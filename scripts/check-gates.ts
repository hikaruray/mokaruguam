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
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.chdir(mkdtempSync(join(tmpdir(), "gates-")));

let failed = 0;
function check(ok: boolean, label: string, detail: string) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${detail}`);
}

const post = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

const noHold = await bookingPost(
  post("http://localhost/api/booking", {
    ...baseRequest,
    requestType: "restaurant",
    partnerName: "Proa",
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

console.log("\n--- Nothing refused was written ---");

// The point of gate 1 is not the status code, it is that no booking exists to
// go and work on afterwards. Count the rows.
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

// The tour above was dated 2026-10-20 on purpose. The charter cutoff rejected
// anything after 2026-09-30 without looking at the request type, and every date
// the new business handles is after it — so its removal is load-bearing, not
// tidying. If this file ever starts failing at the assertion above with a
// message about ガイドツアー, the cutoff has come back.

console.log("\n--- The form sends what the server demands ---");

// check:gates calls the routes directly and supplies requestType by hand, so it
// cannot notice that the browser does not. That gap is real right now: stage 4
// has not landed, readForm() never sets requestType, and every real submission
// is refused. Asserting it here keeps the fact visible instead of letting a
// green test suite imply the form works.
const formSource = await readFile(
  join(import.meta.dirname, "..", "src", "components", "BookingForm.tsx"),
  "utf8",
);
const formSendsType = /requestType:\s*(String\(|fd\.get|requestType\b)/.test(formSource);
check(
  !formSendsType,
  "BookingForm still does NOT set requestType (stage 4 outstanding)",
  formSendsType
    ? "it does now — delete this assertion and assert the opposite"
    : "confirmed: this branch cannot be merged until stage 4 lands",
);

console.log("\n--- Gate 2: confirming needs a live hold, for restaurants only ---");

const { POST: adminPost } = await import("@/app/api/admin/booking/route");
const { addBooking, setBookingPayment } = await import("@/lib/store");

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

const { setBookingStatus } = await import("@/lib/store");
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

console.log("\n--- A replacement hold never loses the one it replaces ---");

const { setBookingAuthorization, getBooking } = await import("@/lib/store");

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
