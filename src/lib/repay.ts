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
  requestTypeOf,
  chargedAmount,
  type BookingRequest,
} from "./store";
import { getAuthorization, isPaypalConfigured, PaypalApiError } from "./paypal";
import { verifyRepayToken } from "./cancel-token";
import { CONTACT_EMAIL } from "./config";

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
    return refuse(
      409,
      `手配料はお支払い済みです。二重のご請求を避けるため、こちらではお手続きいただけません。${CONTACT}`,
    );
  }

  if (booking.payment === "refunded" || booking.payment === "voided") {
    return refuse(
      409,
      `このご依頼のお支払いは既に完了しています。${CONTACT}`,
    );
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

  const hold = await holdState(booking);

  // 🔴 Neither "go ahead" nor "nothing to do" is true when PayPal did not
  // answer, and both are damaging to say: one takes a second hold on a card
  // that may already carry a live one, the other tells a guest to stop when
  // their payment may in fact have lapsed. Ask them to come back instead.
  if (hold === "unknown") {
    return refuse(
      503,
      `ただいまお支払い状況を確認できませんでした。お手数ですが時間をおいて再度お試しください。`,
    );
  }

  return { ok: true, booking, amount, holdIsLive: hold === "live" };
}

/**
 * Does PayPal still have a usable hold for this booking?
 *
 * Only asked when our own column says "authorized". Any other value means we
 * already know there is no live hold, and asking would spend a network call to
 * be told so.
 */
async function holdState(
  booking: BookingRequest,
): Promise<"live" | "dead" | "unknown"> {
  if (booking.payment !== "authorized") return "dead";
  if (!booking.paypalAuthorizationId) return "dead";

  try {
    const { status } = await getAuthorization(booking.paypalAuthorizationId);
    // PENDING sits with CREATED deliberately: it is under review and still
    // capturable, so it is not a hold to replace.
    return status === "CREATED" || status === "PENDING" ? "live" : "dead";
  } catch (err) {
    // PayPal does not know this authorisation at all, so there is certainly no
    // live hold behind it. This is the one error that answers the question.
    if (err instanceof PaypalApiError && err.status === 404) return "dead";
    console.error("Could not read authorization for /repay:", err);
    return "unknown";
  }
}
