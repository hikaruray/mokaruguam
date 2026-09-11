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
//   1  restaurant with no hold    -> 402 (or 503 when PayPal is switched off)
//   2  confirming such a booking  -> 409
//   3  a failed capture           -> never leaves the booking "confirmed"

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
// Keep writes inside the scratch directory rather than the repo's own data dir.
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

import { mkdtempSync } from "node:fs";
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
// PayPal is switched off in this process, so the honest answer is "we cannot
// take this right now", not "your card failed".
check(
  noHold.status === 503,
  "restaurant, no hold, PayPal off",
  `HTTP ${noHold.status} (expected 503)`,
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

console.log("\n--- A date in October is accepted ---");

// LAST_TOUR_DATE rejects anything after 2026-09-30 without looking at the
// request type. Every booking from 2026-10-01 onwards is after it, so if this
// ever starts failing, the new business is refusing all of its own traffic.
check(
  tour.status === 200,
  "2026-10-20 not blocked by the charter cutoff",
  `HTTP ${tour.status} — remove LAST_TOUR_DATE at merge (design §7-2)`,
);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
