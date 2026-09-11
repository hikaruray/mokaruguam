// Checks the gates that stop a booking being taken without the money.
//
//   npm run check:gates
//
// SAFETY — READ THIS BEFORE CHANGING ANYTHING HERE
// On 2026-09-11 a "control experiment" was posted to the LIVE booking API to
// see whether it would be rejected. It was not: a real booking was created and
// the owner got a notification email for a guest who does not exist. This file
// exists so that question never has to be asked of production again.
//
// It calls the route handlers in-process, with the environment blanked first:
//   SUPABASE_*  unset -> lib/store falls back to a local JSON file
//   RESEND_API_KEY unset -> lib/email logs instead of sending
// Both are set before any project module is imported, because lib/paypal reads
// its credentials at module load. Nothing here reaches the network, the real
// database, or anyone's inbox.
//
// The gates, in the order a request meets them:
//   0  no request type            -> 400, nothing saved
//   1  restaurant with no hold    -> 402, nothing saved
//   2  confirming such a booking  -> 409, and 409 again if already captured
//      ...but a TOUR with no hold must still confirm. Gate 2 written one word
//      wider stops every confirmation from 2026-10-01 onwards.
//
// Gate 3 — a failed capture never leaves the booking "confirmed" — is not
// asserted here. It needs PayPal to fail mid-call, which this harness cannot
// produce without reaching the network. Say so rather than let the list imply
// coverage that does not exist.

// --- Blank the environment BEFORE importing anything from the project ------
for (const key of [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
]) {
  delete process.env[key];
}

// PayPal is then switched back on with credentials that are obviously not
// credentials. Deleting them entirely made isPaypalConfigured() false, which
// sent every restaurant case down the "we cannot take this right now" branch —
// so the 402 and 409 the design actually specifies were never executed once,
// while the suite reported all green. In production PayPal IS configured, so
// those are the paths that matter.
//
// Safe because no path asserted below makes a PayPal call: gate 1 returns
// before authorizeOrder, gate 2 returns before captureAuthorization. These
// strings could not authenticate against anything if one ever did.
process.env.PAYPAL_CLIENT_ID = "not-a-real-client-id";
process.env.PAYPAL_CLIENT_SECRET = "not-a-real-secret";
process.env.PAYPAL_ENV = "sandbox";
// Keep writes inside the scratch directory rather than the repo's own data dir.
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
// Pinned so the token assertions below can compare against literal strings.
// Without this the signing key would fall through to ADMIN_PASSWORD, which this
// file sets later, and the "already-sent links still work" check would be
// comparing a value to itself.
process.env.CANCEL_TOKEN_SECRET = "gate-check-secret";

import { mkdtempSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.chdir(mkdtempSync(join(tmpdir(), "gates-")));

let failed = 0;
function check(ok: boolean, label: string, detail: string) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${detail}`);
}

// Each request comes from its own address.
//
// The per-IP throttle allows five submissions a minute, and every call here
// shares one instance — so once this file grew past five posts the later gates
// started answering 429 and the assertions failed for a reason that had nothing
// to do with what they were testing. Giving each call a distinct address takes
// the throttle out of the way. It is therefore NOT exercised by this suite.
let callNo = 0;
const post = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `203.0.113.${++callNo}`,
    },
    body: JSON.stringify(body),
  });

const baseRequest = {
  name: "検証 太郎",
  email: "gate-check@example.invalid",
  phone: "090-0000-0000",
  preferredDate: "2026-10-20 18:00",
  hotel: "未定",
  guests: 2,
  adults: 2,
};

const { POST: bookingPost } = await import("@/app/api/booking/route");
const { listBookings } = await import("@/lib/store");

console.log("\n--- Gate 0: a request must say which kind it is ---");

for (const [label, requestType] of [
  ["no request type at all", undefined],
  ["empty request type", ""],
  ["unknown request type", "hotel"],
] as [string, unknown][]) {
  const res = await bookingPost(
    post("http://localhost/api/booking", { ...baseRequest, requestType }),
  );
  check(res.status === 400, label, `HTTP ${res.status} (expected 400)`);
}

console.log("\n--- Gate 1: a restaurant request needs the money held ---");

// Complete in every other way — a named restaurant and an answer for a full
// one — so the only thing missing is the money. Gate 0b sits in front of this
// one and would otherwise answer first, and a 400 here would look like gate 1
// working when it had never run.
const noHold = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "restaurant",
    partnerName: "Proa",
    fallbackChoice: "cancel",
  }),
);
// 402, not 503: PayPal is configured here as it is in production, so the
// refusal is about this request having no hold — the condition the design
// specifies. Nothing was saved either; that is asserted by row count below.
check(
  noHold.status === 402,
  "restaurant, no hold",
  `HTTP ${noHold.status} (expected 402)`,
);
const noHoldBody = (await noHold.json()) as { error?: string; ok?: boolean };
check(
  noHoldBody.ok !== true,
  "restaurant refusal does not report success",
  JSON.stringify(noHoldBody).slice(0, 90),
);

console.log("\n--- Gate 0b: a restaurant request must be arrangeable ---");

// Both answers are impossible to get later without stopping the arrangement and
// emailing the guest — and that pause is what outlives a PayPal hold. Neither
// has a safe default: "cancel" gives up a booking they may have wanted,
// "suggest" spends their money somewhere they did not choose.
const noShop = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "restaurant",
    fallbackChoice: "cancel",
  }),
);
check(
  noShop.status === 400,
  "restaurant with no restaurant named",
  `HTTP ${noShop.status} (expected 400)`,
);

for (const [label, fallbackChoice] of [
  ["no answer at all", undefined],
  ["an unknown answer", "maybe"],
] as [string, unknown][]) {
  const res = await bookingPost(
    post("http://localhost/api/booking", {
      ...baseRequest,
      requestType: "restaurant",
      partnerName: "Proa",
      fallbackChoice,
    }),
  );
  check(
    res.status === 400,
    `restaurant, full-restaurant question: ${label}`,
    `HTTP ${res.status} (expected 400)`,
  );
}

console.log("\n--- What the server refuses that the browser also refuses ---");

// Every rule the form enforces has to hold at the API too: the form's own
// attributes are a convenience, and nothing stops a request arriving without
// them. The tour path needs no payment, so it is reachable by anyone.
const oversized = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "tour",
    partnerName: "あ".repeat(500),
  }),
);
check(
  oversized.status === 400,
  "an oversized partner name is refused (it lands in the owner's inbox)",
  `HTTP ${oversized.status} (expected 400)`,
);

// Adding the three groups up and checking only the sum accepts this: it totals
// 5, and reaches the owner as「大人-5名・子供(4-11歳)10名」.
const negativeAdults = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "tour",
    adults: -5,
    children4to11: 10,
    children0to3: 0,
  }),
);
check(
  negativeAdults.status === 400,
  "a negative headcount is refused even when the total looks sane",
  `HTTP ${negativeAdults.status} (expected 400)`,
);

// A mistyped year. Nothing is charged in the end, but on the restaurant path it
// would hold the guest's money for a meal that already happened.
const pastDate = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "tour",
    preferredDate: "2020-01-01 09:00",
  }),
);
check(
  pastDate.status === 400,
  "a date in the past is refused",
  `HTTP ${pastDate.status} (expected 400)`,
);

console.log("\n--- The honeypot drops bots, not guests who paid ---");

const { isBot } = await import("@/lib/spam");
// 🔴 The rename is the fix, so assert the rename. An input named `company`
// under a label reading「会社名」is what an address autofill fills in, and a
// trip here discards the request in silence.
check(
  isBot({ mg_field_2: "filled" }) === true &&
    isBot({ company: "ACME Corp" } as Record<string, unknown>) === false,
  "an autofilled company name no longer trips it",
  "only mg_field_2 counts",
);

const trapped = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "tour",
    mg_field_2: "i am a bot",
  }),
);
check(
  trapped.status === 200,
  "a tripped honeypot still answers 200 so the bot does not retry",
  `HTTP ${trapped.status} (expected 200)`,
);

// 🔴 And the exception. An approved PayPal order id cannot be produced by a
// bot — our server mints it and only a human completing PayPal's flow approves
// it. Dropping a request that carries one abandons a guest who has already
// agreed to pay. It must reach the real gates instead; gate 1 answering 402
// here is proof it got past the honeypot.
const paidButTrapped = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "restaurant",
    partnerName: "Proa",
    fallbackChoice: "cancel",
    mg_field_2: "autofilled",
    paypalOrderId: "ORDER-APPROVED",
  }),
);
check(
  paidButTrapped.status !== 200,
  "but a request carrying an approved order is never silently dropped",
  `HTTP ${paidButTrapped.status} (200 would mean it vanished)`,
);

console.log("\n--- Nothing refused was written ---");

// The point of the gates is not the status code, it is that no booking exists
// to go and work on afterwards. Count the rows, after every refusal above.
const rows = await listBookings();
check(
  rows.length === 0,
  "no bookings saved by any refused request",
  `${rows.length} rows (expected 0)`,
);

console.log("\n--- A tour request still goes through ---");

// The mirror image, and the one that would break the business on 2026-10-01 if
// a gate were written too broadly: arranging a partner tour involves no payment
// at all, so it must be accepted with no hold.
const tour = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "tour",
    partnerName: "Joe's Jet Ski",
  }),
);
check(tour.status === 200, "tour, no payment", `HTTP ${tour.status} (expected 200)`);

const after = await listBookings();
check(after.length === 1, "the tour request was saved", `${after.length} rows (expected 1)`);
check(
  after[0]?.requestType === "tour",
  "saved with its request type",
  `${after[0]?.requestType} (expected "tour")`,
);
check(
  after[0]?.payment === "none",
  "and with no payment attached",
  `${after[0]?.payment} (expected "none")`,
);
check(
  after[0]?.partnerName === "Joe's Jet Ski",
  "and with the partner we are to arrange with",
  `"${after[0]?.partnerName}"`,
);

// 🔴 The asymmetry in gate 0b, asserted from the free side. A tour moves no
// money, so an incomplete request costs one email to ask what they meant —
// refusing it would turn away a free enquiry on the strength of a form field.
// The gates are strict exactly where money is.
const tourNoPartner = await bookingPost(
  post("http://localhost/api/booking", { ...baseRequest, requestType: "tour" }),
);
check(
  tourNoPartner.status === 200,
  "a tour with nothing named is still accepted",
  `HTTP ${tourNoPartner.status} (expected 200)`,
);

// A restaurant request that answers both questions and holds no money is
// refused by gate 1, not saved — already asserted above. The complete
// restaurant path (with a hold) cannot run here: it needs PayPal.
const saved = await listBookings();
check(
  saved.every((b) => b.requestType === "tour"),
  "and nothing but tours reached the store",
  `${saved.length} rows, all tours`,
);

// The tour above was dated 2026-10-20 on purpose. The charter cutoff rejected
// anything after 2026-09-30 without looking at the request type, and every date
// the new business handles is after it — so its removal is load-bearing, not
// tidying. If this file ever starts failing at the assertion above with a
// message about ガイドツアー, the cutoff has come back.

console.log("\n--- The form sends what the server demands ---");

// check:gates calls the routes directly and supplies requestType by hand, so it
// cannot notice whether the browser does. Until stage 4 landed it did not, and
// every real submission was refused by gate 0 while this suite reported green —
// which is why the fact is asserted from the source rather than assumed.
const formSource = await readFile(
  join(import.meta.dirname, "..", "src", "components", "BookingForm.tsx"),
  "utf8",
);
check(
  /requestType:\s*requestType as RequestType/.test(formSource),
  "BookingForm sends requestType (stage 4 landed)",
  "readForm() fills it from the chosen option",
);
// 🔴 The one way stage 4 could be "finished" and still be a money bug: a
// default. "tour" makes a paid restaurant arrangement free; "restaurant"
// charges $10 for something given away. The state must start null.
check(
  /useState<RequestType \| null>\(null\)/.test(formSource),
  "and starts with no kind pre-selected",
  "requestType begins as null — neither path is a default",
);
// PayPal on the tour path contradicts「お客様のお支払いはありません」the moment
// it renders, even briefly (design §6-5).
check(
  /const takesPayment = isRestaurant && PAYPAL_ENABLED/.test(formSource),
  "and only offers payment on the restaurant path",
  "takesPayment requires isRestaurant",
);

console.log("\n--- Gate 2: confirming needs a live hold, for restaurants only ---");

const { POST: adminPost } = await import("@/app/api/admin/booking/route");
const { addBooking, setBookingPayment, getBooking, setBookingStatus } = await import("@/lib/store");

process.env.ADMIN_PASSWORD = "gate-check";

const admin = (id: string, action: string) =>
  adminPost(
    new Request("http://localhost/api/admin/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: "admin=gate-check",
      },
      body: JSON.stringify({ id, action }),
    }),
  );

const seed = async (over: Record<string, unknown>) =>
  addBooking({
    name: "検証",
    email: "gate-check@example.invalid",
    phone: "090-0000-0000",
    requestType: null,
    partnerName: "",
    fallbackChoice: null,
    budgetHint: "",
    cuisineHint: "",
    planId: "middle",
    planName: "5時間プラン",
    preferredDate: "2026-10-20 18:00",
    hotel: "未定",
    guests: 2,
    spots: "",
    notes: "",
    ...over,
  } as Parameters<typeof addBooking>[0]);

// A restaurant with no hold must not be confirmable — this is the case that
// used to email the guest 「お支払い: $0.00（決済確定済み）」.
const restNoHold = await seed({ requestType: "restaurant", partnerName: "Proa" });
const r1 = await admin(restNoHold.id, "confirm");
check(r1.status === 409, "restaurant, no hold, confirm", `HTTP ${r1.status} (expected 409)`);

// 🔴 The mirror image, and the reason gate 2 is restricted to restaurants:
// arranging a partner tour never touches PayPal, so payment is "none" by
// design. A gate written one word wider stops every confirmation from
// 2026-10-01 onwards. This assertion is the regression test for that.
const tourRow = await seed({ requestType: "tour", partnerName: "Joe's Jet Ski" });
const r2 = await admin(tourRow.id, "confirm");
check(r2.status === 200, "tour, no hold, confirm (gate 2 must NOT catch it)", `HTTP ${r2.status} (expected 200)`);

// Pre-pivot charter rows are request-only too and must stay operable.
const legacyRow = await seed({ requestType: null });
const r3 = await admin(legacyRow.id, "confirm");
check(r3.status === 200, "pre-pivot row, confirm", `HTTP ${r3.status} (expected 200)`);

const legacyDecline = await seed({ requestType: null });
const r4 = await admin(legacyDecline.id, "decline");
check(r4.status === 200, "pre-pivot row, decline", `HTTP ${r4.status} (expected 200)`);

// A charged row whose status never moved: the money is taken. Confirming must
// refuse, and must NOT tell the owner to send the guest for another payment.
const stuck = await seed({ requestType: "restaurant", partnerName: "Proa" });
await setBookingPayment(stuck.id, { payment: "captured", paypalCaptureId: "CAP-TEST" });
const r5 = await admin(stuck.id, "confirm");
const r5body = (await r5.json()) as { error?: string };
check(r5.status === 409, "restaurant, already captured, confirm", `HTTP ${r5.status} (expected 409)`);
check(
  !(r5body.error ?? "").includes("再度のお手続き"),
  "and does not send an already-charged guest to pay again",
  `"${(r5body.error ?? "").slice(0, 40)}…"`,
);

// 🔴 A settled booking is not actionable. The buttons only appear on pending
// rows, so the way in is a stale screen — the guest cancels in one tab while
// the owner has the list open in another. Confirming then sent someone who had
// called off their booking「お手配が完了しました」, in an email nobody can recall.
const settledTour = await seed({ requestType: "tour", partnerName: "Joe's Jet Ski" });
await setBookingStatus(settledTour.id, "cancelled");
const reconfirm = await admin(settledTour.id, "confirm");
check(
  reconfirm.status === 409,
  "a cancelled booking cannot be confirmed back to life",
  `HTTP ${reconfirm.status} (expected 409)`,
);
check(
  (await getBooking(settledTour.id))?.status === "cancelled",
  "and it stays cancelled",
  String((await getBooking(settledTour.id))?.status),
);

console.log("\n--- What the restaurant path has to remember ---");

// The write side of gate 0b. The API refuses a request missing either answer —
// asserted above — but a field that is read and then dropped on the way to the
// store fails silently: the booking saves, the owner sees no answer, and the
// arrangement stops to ask by email. That is the pause the hold does not
// survive.
//
// Exercised through the store rather than the API because a complete restaurant
// request needs a real PayPal hold, which this harness cannot produce.
const withHints = await seed({
  requestType: "restaurant",
  partnerName: "Proa",
  fallbackChoice: "suggest",
  budgetHint: "1人 $50 くらい",
  cuisineHint: "シーフード",
});
const readBack = await getBooking(withHints.id);
check(
  readBack?.fallbackChoice === "suggest",
  "what to do about a full restaurant survives the round trip",
  `${readBack?.fallbackChoice}`,
);
check(
  readBack?.budgetHint === "1人 $50 くらい" &&
    readBack?.cuisineHint === "シーフード",
  "and so do the hints that make the one proposal a good one",
  `${readBack?.budgetHint} / ${readBack?.cuisineHint}`,
);

console.log("\n--- A booking has one name, whether or not the DB numbered it ---");

// refNo comes from a Postgres identity column, so it is ALWAYS null here and
// always null in local development. A display that assumed otherwise would look
// perfect on Vercel and print「#NaN」or「#0null」everywhere else — and the place
// it is printed is the handle a partner quotes back to us.
const { refLabel } = await import("@/lib/store");
const unnumbered = await seed({ requestType: "tour", partnerName: "Joe's Jet Ski" });
check(
  unnumbered.refNo === null && refLabel(unnumbered) === unnumbered.id,
  "with no number, a booking is named by its id",
  refLabel(unnumbered),
);
check(
  refLabel({ ...unnumbered, refNo: 12 }) === "#0012",
  "and with one, as #0012",
  refLabel({ ...unnumbered, refNo: 12 }),
);

console.log("\n--- A confirmed tour is never told it was charged ---");

// chargedAmount() used to recompute from the plan when amount was null, so a
// free arrangement was confirmed with 「お支払い: $300.00（決済確定済み）」.
const { confirmedEmail } = await import("@/lib/booking-emails");
const { chargedAmount } = await import("@/lib/store");
const confirmedTour = { ...tourRow, requestType: "tour" as const, amount: null };
const mail = confirmedEmail(confirmedTour, chargedAmount(confirmedTour));
check(
  !/\$\d/.test(mail.text),
  "tour confirmation states no dollar figure",
  mail.text.split("\n").find((l) => l.includes("お支払い")) ?? "(no payment line)",
);

console.log("\n--- Re-authorisation links are scoped, and old ones still work ---");

const {
  makeCancelToken,
  verifyCancelToken,
  makeRepayToken,
  verifyRepayToken,
} = await import("@/lib/cancel-token");

// 🔴 The literal is the point. Mixing a purpose into sign() is the obvious way
// to scope a token, and it would invalidate every cancellation link already
// sitting in a guest's inbox — a change with no local symptom whatsoever, since
// the code would keep producing and accepting its own new tokens quite happily.
// Comparing against a value computed before the change is the only thing that
// notices.
check(
  makeCancelToken("bk-stable-1") ===
    "Ymstc3RhYmxlLTE.NzQ1YTQ5MGYxMjEzMzhjMTVkNTA0MzI4YzM3NDQ4NzQ4OGIyOTljZjU0NDE1ZGU2NDNhNGFmZmM5MjczMjU3OQ",
  "cancel tokens are byte-identical to previously issued ones",
  makeCancelToken("bk-stable-1").slice(0, 24) + "…",
);
check(
  makeRepayToken("bk-stable-1") ===
    "Ymstc3RhYmxlLTE.NDllM2QxYTc0M2NiYzU1YTZjNWYwNWE2YjUzOWY1ZDMxYjRjNTNlYjdhMzhjMjRlYjQ5MGE1YWQxMzRjMmI3OA",
  "repay tokens are stable too",
  makeRepayToken("bk-stable-1").slice(0, 24) + "…",
);

// Neither link may act as the other: a cancel link must not re-authorise a
// card, and a repay link must not cancel a booking.
check(
  verifyRepayToken(makeCancelToken("bk-1")) === null,
  "a cancel link is not accepted as a repay link",
  String(verifyRepayToken(makeCancelToken("bk-1"))),
);
check(
  verifyCancelToken(makeRepayToken("bk-1")) === null,
  "a repay link is not accepted as a cancel link",
  String(verifyCancelToken(makeRepayToken("bk-1"))),
);
check(
  verifyCancelToken(makeCancelToken("bk-1")) === "bk-1" &&
    verifyRepayToken(makeRepayToken("bk-1")) === "bk-1",
  "each link still verifies under its own purpose",
  "both round-trip",
);

console.log("\n--- Who may re-enter payment at /repay ---");

// NOTE ON COVERAGE: every case below is chosen so that lib/repay.ts refuses or
// answers BEFORE it would ask PayPal whether a hold is still alive. That branch
// runs only when payment === "authorized", and exercising it here would put a
// real request on the network with the deliberately fake credentials at the top
// of this file. It is not asserted, and it is not covered by anything else.
const { loadRepayable } = await import("@/lib/repay");

check(
  (await loadRepayable("not-a-token")).ok === false,
  "a forged token is refused",
  "refused",
);

const tourRepay = await seed({ requestType: "tour", partnerName: "Joe's Jet Ski" });
check(
  (await loadRepayable(makeRepayToken(tourRepay.id))).ok === false,
  "a tour is refused (there is no fee to re-authorise)",
  "refused",
);

// 🔴 The double-charge guard: captured, but the status never moved. Sending
// this guest to /repay charges them twice for one table.
const paidRepay = await seed({ requestType: "restaurant", partnerName: "Proa" });
await setBookingPayment(paidRepay.id, {
  payment: "captured",
  paypalCaptureId: "CAP-TEST",
});
const paidCheck = await loadRepayable(makeRepayToken(paidRepay.id));
check(paidCheck.ok === false, "a captured booking is refused", "refused");
check(
  paidCheck.ok === false && paidCheck.status === 409,
  "and refused as a conflict, not a bad link",
  paidCheck.ok === false ? `HTTP ${paidCheck.status}` : "allowed",
);

// setBookingStatus is imported with the rest of the store above.
const settledRepay = await seed({ requestType: "restaurant", partnerName: "Proa" });
await setBookingStatus(settledRepay.id, "confirmed");
check(
  (await loadRepayable(makeRepayToken(settledRepay.id))).ok === false,
  "a confirmed booking is refused",
  "refused",
);

// The case /repay exists for: the hold died, the booking is still waiting.
// Seeded at $7 rather than $10 on purpose — the amount offered must come from
// the snapshot taken when the guest agreed to it, not from today's fee table.
const deadHold = await seed({
  requestType: "restaurant",
  partnerName: "Proa",
  payment: "authorized",
  amount: 7,
  paypalOrderId: "ORDER-1",
  paypalAuthorizationId: "AUTH-1",
});
await setBookingPayment(deadHold.id, { payment: "expired" });
const allowed = await loadRepayable(makeRepayToken(deadHold.id));
check(allowed.ok === true, "an expired hold may be re-authorised", "allowed");
check(
  allowed.ok === true && allowed.amount === 7,
  "at the amount quoted when the request was made",
  allowed.ok === true ? `$${allowed.amount}` : "n/a",
);

console.log("\n--- What PayPal says about the hold decides what /repay does ---");

// The branch that decides whether to put a second $10 on a card. It shipped
// wrong — CAPTURED was folded in with EXPIRED as "no hold here", so a guest
// whose payment had gone through but whose row never recorded it was shown a
// payment form and charged again. It had no test of any kind, because testing
// it meant calling PayPal.
//
// loadRepayable now takes the lookup as an argument for exactly this. The four
// answers below are what PayPal actually returns; none of them touch a network.
const stub =
  (status: string, captureId: string | null = null) =>
  async () => ({ status, captureId });

const pendingHold = await seed({
  requestType: "restaurant",
  partnerName: "Proa",
  payment: "authorized",
  amount: 10,
  paypalOrderId: "ORDER-H",
  paypalAuthorizationId: "AUTH-H",
});
const holdToken = makeRepayToken(pendingHold.id);

const live = await loadRepayable(holdToken, stub("CREATED"));
check(
  live.ok === true && live.holdIsLive === true,
  "a live hold offers no form (nothing to pay twice)",
  live.ok ? `holdIsLive=${live.holdIsLive}` : "refused",
);

const underReview = await loadRepayable(holdToken, stub("PENDING"));
check(
  underReview.ok === true && underReview.holdIsLive === true,
  "and neither does one still under review",
  underReview.ok ? `holdIsLive=${underReview.holdIsLive}` : "refused",
);

const expiredHold = await loadRepayable(holdToken, stub("EXPIRED"));
check(
  expiredHold.ok === true && expiredHold.holdIsLive === false,
  "an expired hold does offer the form",
  expiredHold.ok ? `holdIsLive=${expiredHold.holdIsLive}` : "refused",
);

// 🔴 The one that was wrong. PayPal says the money is taken; our column does
// not know yet. Offering the form here charges a second time for one table.
const alreadyPaid = await loadRepayable(
  holdToken,
  stub("CAPTURED", "CAP-FOUND"),
);
check(
  alreadyPaid.ok === false && alreadyPaid.status === 409,
  "a hold PayPal already captured is refused, not re-charged",
  alreadyPaid.ok === false ? `HTTP ${alreadyPaid.status}` : "IT OFFERED THE FORM",
);
check(
  alreadyPaid.ok === false && alreadyPaid.error.includes("二重"),
  "and says why, in the words used for the other double-charge case",
  alreadyPaid.ok === false ? alreadyPaid.error.slice(0, 24) + "…" : "n/a",
);
// Repaired on the way past: money that was taken now has a record.
const repaired = await getBooking(pendingHold.id);
check(
  repaired?.payment === "captured" && repaired?.paypalCaptureId === "CAP-FOUND",
  "and the capture it found is written back to the booking",
  `${repaired?.payment} / ${repaired?.paypalCaptureId}`,
);

// No answer at all. Guessing either way is damaging, so it asks them to return.
const noAnswer = await seed({
  requestType: "restaurant",
  partnerName: "Proa",
  payment: "authorized",
  amount: 10,
  paypalAuthorizationId: "AUTH-N",
});
const unreachable = await loadRepayable(makeRepayToken(noAnswer.id), async () => {
  throw new Error("network down");
});
check(
  unreachable.ok === false && unreachable.status === 503,
  "and an unanswerable question refuses rather than guessing",
  unreachable.ok === false ? `HTTP ${unreachable.status}` : "it guessed",
);

console.log("\n--- The refund a screen promises is the refund that happens ---");

// 🔴 A source assertion, and it is the point of this whole block.
//
// refundRateForDate is the TOUR ladder. refundDecision is the rule that knows
// what was bought. Both screens that quote a refund to a human — the guest's
// cancel page and the owner's buttons — called the ladder directly and printed
// 「返金 100%」on restaurant bookings that refund nothing.
//
// The behavioural checks in check:money all passed throughout: they measure the
// decision function, and a caller that never asks it is invisible to them. The
// only cheap way to stop this returning is to assert nobody in these two
// directories reaches for the ladder again.
for (const dir of ["cancel", "admin"]) {
  const files = await readdir(join(import.meta.dirname, "..", "src", "app", dir), {
    recursive: true,
  });
  let offenders: string[] = [];
  for (const f of files) {
    if (!/\.tsx?$/.test(String(f))) continue;
    const src = await readFile(
      join(import.meta.dirname, "..", "src", "app", dir, String(f)),
      "utf8",
    );
    // The import and the call, not the word in a comment explaining this rule.
    if (/refundRateForDate\s*\(/.test(src)) offenders.push(String(f));
  }
  check(
    offenders.length === 0,
    `src/app/${dir} quotes refunds through refundDecision only`,
    offenders.length ? `calls the tour ladder: ${offenders.join(", ")}` : "no direct ladder calls",
  );
}

// And the behaviour behind the promise, run through cancelBooking itself
// rather than through the decision function it calls. This is design §11's
// acceptance condition and nothing asserted it before.
//
// Only the zero-refund case runs here: it is the one that moves no money, so
// it needs no PayPal call. The tour side (a real 100% refund) does, and is not
// covered — see the note at the top of this file.
const { cancelBooking } = await import("@/lib/booking-actions");
const paidTable = await seed({
  requestType: "restaurant",
  partnerName: "Proa",
  status: "pending",
  amount: 10,
});
await setBookingPayment(paidTable.id, {
  payment: "captured",
  paypalCaptureId: "CAP-TABLE",
});
// 30 days out: the tour ladder would call this a full refund.
const cancelled = await cancelBooking(paidTable.id, "policy");
check(
  cancelled?.refund?.rate === 0,
  "cancelling a held table 30 days out refunds nothing",
  `rate ${cancelled?.refund?.rate} ($${cancelled?.refund?.amount})`,
);
check(
  (await getBooking(paidTable.id))?.payment === "captured",
  "and the fee stays captured rather than being marked refunded",
  String((await getBooking(paidTable.id))?.payment),
);

console.log("\n--- A replacement hold never loses the one it replaces ---");

const { setBookingAuthorization } = await import("@/lib/store");

await setBookingAuthorization(deadHold.id, {
  paypalOrderId: "ORDER-2",
  paypalAuthorizationId: "AUTH-2",
});
const after1 = await getBooking(deadHold.id);
check(
  after1?.paypalAuthorizationId === "AUTH-2" &&
    after1?.paypalOrderId === "ORDER-2",
  "both ids move together",
  `${after1?.paypalOrderId} / ${after1?.paypalAuthorizationId}`,
);
check(
  after1?.payment === "authorized",
  "and the booking is holding money again",
  String(after1?.payment),
);
check(
  JSON.stringify(after1?.previousAuthorizationIds) === JSON.stringify(["AUTH-1"]),
  "the superseded hold is kept",
  JSON.stringify(after1?.previousAuthorizationIds),
);

// Twice, because the proposal branch can outlive two holds.
await setBookingAuthorization(deadHold.id, {
  paypalOrderId: "ORDER-3",
  paypalAuthorizationId: "AUTH-3",
});
const after2 = await getBooking(deadHold.id);
check(
  JSON.stringify(after2?.previousAuthorizationIds) ===
    JSON.stringify(["AUTH-1", "AUTH-2"]),
  "and appended, not overwritten, on the next one",
  JSON.stringify(after2?.previousAuthorizationIds),
);

// The last place that can still refuse. Everything upstream checks this, which
// is exactly why the write itself has to as well.
let refusedCaptured = false;
try {
  await setBookingAuthorization(paidRepay.id, {
    paypalOrderId: "ORDER-X",
    paypalAuthorizationId: "AUTH-X",
  });
} catch {
  refusedCaptured = true;
}
check(
  refusedCaptured,
  "and the write refuses outright on a captured booking",
  refusedCaptured ? "threw" : "wrote — it would have double-charged",
);

console.log("\n--- The routes refuse the same cases ---");

const { POST: repayOrderPost } = await import(
  "@/app/api/booking/repay/create-order/route"
);
const { POST: repayPost } = await import("@/app/api/booking/repay/route");

const orderRes = await repayOrderPost(
  post("http://localhost/api/booking/repay/create-order", {
    token: makeRepayToken(paidRepay.id),
  }),
);
check(
  orderRes.status === 409,
  "create-order refuses a captured booking",
  `HTTP ${orderRes.status} (expected 409)`,
);

const finalRes = await repayPost(
  post("http://localhost/api/booking/repay", {
    token: makeRepayToken(paidRepay.id),
    paypalOrderId: "ORDER-FORGED",
  }),
);
check(
  finalRes.status === 409,
  "and so does the route that saves the hold",
  `HTTP ${finalRes.status} (expected 409)`,
);

console.log("\n--- An expired hold gives the owner somewhere to go ---");

// Gate 2 refuses the confirmation. What matters as much is that the refusal
// carries the link: without it the owner knows only that it failed, and the
// booking sits pending until someone remembers it.
const expiredRow = await seed({ requestType: "restaurant", partnerName: "Proa" });
await setBookingPayment(expiredRow.id, { payment: "expired" });
const expiredConfirm = await admin(expiredRow.id, "confirm");
const expiredBody = (await expiredConfirm.json()) as { error?: string };
check(
  expiredConfirm.status === 409,
  "confirming an expired hold is refused",
  `HTTP ${expiredConfirm.status} (expected 409)`,
);
check(
  (expiredBody.error ?? "").includes("/repay/"),
  "and the refusal hands over the re-payment link",
  (expiredBody.error ?? "").split("\n").pop() ?? "(no link)",
);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
