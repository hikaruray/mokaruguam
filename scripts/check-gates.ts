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

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
