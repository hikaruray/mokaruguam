// Who may re-enter payment on an existing booking, and for how much.
//
// WHY THIS IS ITS OWN FILE
// Three callers need the identical answer — the /repay page, the route that
// creates the replacement PayPal order, and the route that finalises it. A rule
// about money that is written out three times is a rule that will be three
// different rules within a month. lib/refund-policy.ts exists for the same
// reason and for the same kind of bug.
//
// THE RULE (design §6-7)
//   request_type = "restaurant"     — a partner tour costs the guest nothing,
//                                      so there is no hold to replace
//   status       = "pending"        — a settled booking is not waiting on money
//   payment     != "captured"       — 🔴 without this we charge a second time
//                                      for a table that is already paid for
//
// and one condition the design did not have to state because it was assumed:
// the hold we are replacing must actually be dead. PayPal is asked directly
// rather than trusting our own `payment` column, because a stale column here
// costs the guest a second $10 hold on their card.

import "server-only";
import {
  getBooking,
  setBookingPayment,
  requestTypeOf,
  chargedAmount,
  type BookingRequest,
} from "./store";
import { getAuthorization, isPaypalConfigured, PaypalApiError } from "./paypal";
import { verifyRepayToken } from "./cancel-token";
import { CONTACT_EMAIL } from "./config";

// How this module asks PayPal about an authorisation. Injectable ONLY so the
// gate checks can drive the four answers that matter — live, dead, already
// captured, no answer — without a network call. Production always uses the
// default. Before this existed, the branch that decides whether to hold a
// guest's money a second time had no test of any kind, and it shipped wrong.
export type AuthorizationLookup = (
  authorizationId: string,
) => Promise<{ status: string; captureId: string | null }>;

export interface RepayRefusal {
  ok: false;
  // HTTP status for the API routes. The page only reads `error`.
  status: number;
  error: string;
}

export interface RepayAllowed {
  ok: true;
  booking: BookingRequest;
  // What this booking was quoted at, from the snapshot taken when it was made.
  amount: number;
  // True when PayPal still has a usable hold. Not an error: it means the guest
  // has nothing to do, and taking another authorisation would hold their money
  // twice for one table.
  holdIsLive: boolean;
}

export type RepayCheck = RepayAllowed | RepayRefusal;

const CONTACT = `お手数ですが ${CONTACT_EMAIL} までご連絡ください。`;

// One sentence for one situation: the table is already paid for. It is reached
// two ways — our own column says so, or PayPal does — and both have to say the
// same thing, because the guest cannot tell which one noticed.
const ALREADY_PAID = `手配料はお支払い済みです。二重のご請求を避けるため、こちらではお手続きいただけません。${CONTACT}`;

function refuse(status: number, error: string): RepayRefusal {
  return { ok: false, status, error };
}

/**
 * Resolve a /repay token to a booking that may be re-authorised.
 *
 * Every refusal carries wording meant for the guest, because every one of them
 * is reachable by a person clicking a link we sent them.
 */
export async function loadRepayable(
  token: string | undefined | null,
  lookup: AuthorizationLookup = getAuthorization,
): Promise<RepayCheck> {
  const bookingId = token ? verifyRepayToken(token) : null;
  if (!bookingId) {
    return refuse(400, `お手続きリンクが無効です。${CONTACT}`);
  }

  const booking = await getBooking(bookingId);
  if (!booking) {
    return refuse(404, `ご依頼が見つかりませんでした。${CONTACT}`);
  }

  // A tour arrangement never touches PayPal — there is no fee and so nothing to
  // re-authorise. A link like this one should not exist; say so plainly rather
  // than opening a payment form on a free service.
  if (requestTypeOf(booking) !== "restaurant") {
    return refuse(
      400,
      `このご依頼にお支払いは発生しません。お手続きは不要です。`,
    );
  }

  if (booking.status !== "pending") {
    const reason =
      booking.status === "confirmed"
        ? "このご依頼はお手配が完了しています。追加のお支払い手続きは不要です。"
        : booking.status === "cancelled"
          ? "このご依頼はキャンセル済みです。お手続きは不要です。"
          : "このご依頼は承ることができませんでした。ご請求は発生しておりません。";
    return refuse(409, reason);
  }

  // 🔴 The double-charge guard. A row can be captured but still pending when
  // setBookingPayment succeeded and setBookingStatus did not — the money is
  // taken, the status never moved. Sending that guest through /repay charges
  // them twice for one table.
  if (booking.payment === "captured") {
    return refuse(409, ALREADY_PAID);
  }

  // Neither of these is "completed", and saying so was wrong in opposite
  // directions: a voided hold took nothing at all, and a refund gave it back.
  // Telling a guest they have paid when they have not also throws away any
  // standing to ask them for the money later.
  if (booking.payment === "voided") {
    return refuse(
      409,
      `カードのお預かりは解除済みで、ご請求は発生しておりません。${CONTACT}`,
    );
  }
  if (booking.payment === "refunded") {
    return refuse(409, `このご依頼は手配料をご返金済みです。${CONTACT}`);
  }

  // The fee quoted when the request was made, not today's price list. The guest
  // agreed to that figure; a later change to the fee must not ride in on a
  // re-authorisation of work they already asked for.
  const amount = chargedAmount(booking);
  if (!(amount > 0)) {
    return refuse(
      409,
      `金額を確認できませんでした。${CONTACT}`,
    );
  }

  if (!isPaypalConfigured()) {
    // Our configuration, not their card. Do not imply a payment failure.
    return refuse(
      503,
      `ただいまお支払いのお手続きを受け付けられません。${CONTACT}`,
    );
  }

  const hold = await holdState(booking, lookup);

  // 🔴 PayPal says this authorisation was already captured. The money is taken;
  // our column simply never heard about it, which happens when the capture
  // succeeds and the write that records it does not.
  //
  // This used to be folded in with EXPIRED as "dead", and the consequence was
  // the exact failure the whole module exists to prevent: the page opened,
  // said the hold had lapsed, and charged a second $10 for one table. The
  // guest reaches it by doing the most natural thing available to them —
  // no confirmation arrived, so they open the link in their inbox again.
  if (hold.state === "captured") {
    // Repair the row on the way past. We are holding the capture id PayPal
    // just gave us, and the alternative is leaving money that has been taken
    // with no record of it anywhere: the Admin screen shows a hold still
    // waiting, and the confirm button keeps failing with nothing to explain
    // why. A failure here must not stop the refusal below, which is what
    // actually protects the guest.
    if (hold.captureId) {
      try {
        await setBookingPayment(booking.id, {
          payment: "captured",
          paypalCaptureId: hold.captureId,
        });
      } catch (err) {
        console.error("Could not record a capture found via /repay:", err);
      }
    }
    return refuse(409, ALREADY_PAID);
  }

  // 🔴 Neither "go ahead" nor "nothing to do" is true when PayPal did not
  // answer, and both are damaging to say: one takes a second hold on a card
  // that may already carry a live one, the other tells a guest to stop when
  // their payment may in fact have lapsed. Ask them to come back instead.
  if (hold.state === "unknown") {
    return refuse(
      503,
      `ただいまお支払い状況を確認できませんでした。お手数ですが時間をおいて再度お試しください。`,
    );
  }

  return { ok: true, booking, amount, holdIsLive: hold.state === "live" };
}

interface HoldState {
  state: "live" | "dead" | "captured" | "unknown";
  // Only on "captured": the capture PayPal says this authorisation became.
  captureId: string | null;
}

/**
 * What PayPal currently thinks of this booking's authorisation.
 *
 * Only asked when our own column says "authorized". Any other value means we
 * already know there is no live hold, and asking would spend a network call to
 * be told so.
 *
 * 🔴 Four answers, not two. "Is there a live hold?" is the question the page
 * needs, but answering it with a boolean throws away the one state that must
 * never be treated as "go ahead and take another": already captured.
 */
async function holdState(
  booking: BookingRequest,
  lookup: AuthorizationLookup,
): Promise<HoldState> {
  if (booking.payment !== "authorized") return { state: "dead", captureId: null };
  if (!booking.paypalAuthorizationId) {
    return { state: "dead", captureId: null };
  }

  try {
    const { status, captureId } = await lookup(booking.paypalAuthorizationId);
    // PENDING sits with CREATED deliberately: it is under review and still
    // capturable, so it is not a hold to replace.
    if (status === "CREATED" || status === "PENDING") {
      return { state: "live", captureId: null };
    }
    if (status === "CAPTURED" || status === "PARTIALLY_CAPTURED") {
      return { state: "captured", captureId };
    }
    // EXPIRED, VOIDED, DENIED: nothing is held and nothing was taken.
    return { state: "dead", captureId: null };
  } catch (err) {
    // PayPal does not know this authorisation at all, so there is certainly no
    // live hold behind it. This is the one error that answers the question.
    if (err instanceof PaypalApiError && err.status === 404) {
      return { state: "dead", captureId: null };
    }
    console.error("Could not read authorization for /repay:", err);
    return { state: "unknown", captureId: null };
  }
}
