// Checks the two rules that decide whether money moves.
//
//   npm run check:money
//
// WHY THIS EXISTS
// Both rules have already been wrong in production-bound code, and in both
// cases a clean `next build` said nothing:
//
//   • A restaurant request could not be priced at all, because both payment
//     routes asked a function that only knows the four charter plans. It
//     returned null, both routes turned null into a 400, and the request died
//     before reaching any payment check.
//   • A completed restaurant arrangement was refunded in full whenever the meal
//     was 8 or more days away — most bookings — because the cancellation path
//     ran the tour's date ladder over it. A guest could trigger it alone, from
//     the cancel link in their own acknowledgement email.
//
// The second one was introduced by correcting the terms and not going to look
// for the code that moves the money. So these assertions are deliberately
// written as the PROMISES, not as a transcript of the implementation:
// "a flat ten dollars", "nothing comes back once the table is held",
// "bookings taken before the pivot behave exactly as they did".
//
// Runs the real modules under node's type stripping — no database, no network,
// no PayPal, nothing to clean up afterwards. Run it after touching pricing.ts,
// refund-policy.ts, or anything about fees, refunds or request types.

import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const lib = join(dirname(import.meta.dirname), "src", "lib");
const load = (name: string) => import(pathToFileURL(join(lib, name)).href);

const { amountForRequest, RESTAURANT_FEE, MAX_GUESTS } = await load("pricing.ts");
const { refundDecision } = await load("refund-policy.ts");

const fee = amountForRequest as (
  t: unknown,
  p: unknown,
  g: unknown,
  d: unknown,
) => { amount: number; guests: number } | null;

const refund = refundDecision as (
  t: unknown,
  d: unknown,
  m?: unknown,
) => { rate: number; tier: string };

let failed = 0;
function check(ok: boolean, label: string, detail: string) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${detail}`);
}

const day = 86_400_000;
const inDays = (n: number) =>
  new Date(Date.now() + n * day).toISOString().slice(0, 10);

console.log("\n--- What a request costs ---");

for (const [label, args, expected] of [
  ["restaurant, 2 guests", ["restaurant", "", 2, inDays(20)], 10],
  ["restaurant, 7 guests", ["restaurant", "", 7, inDays(20)], 10],
  ["restaurant, peak-season date", ["restaurant", "", 2, "2026-12-25"], 10],
  ["restaurant, two months out", ["restaurant", "", 2, inDays(60)], 10],
  ["restaurant, no date", ["restaurant", "", 2, null], 10],
  ["tour never charges", ["tour", "short", 4, inDays(20)], null],
  ["tour with a real plan id", ["tour", "middle", 6, inDays(20)], null],
  ["missing request type", [undefined, "short", 4, inDays(20)], null],
  ["empty request type", ["", "short", 4, inDays(20)], null],
  ["unknown request type", ["hotel", "short", 4, inDays(20)], null],
  ["null request type", [null, "short", 4, inDays(20)], null],
] as [string, [unknown, unknown, unknown, unknown], number | null][]) {
  const got = fee(...args);
  const amount = got === null ? null : got.amount;
  check(amount === expected, label, `${amount} (expected ${expected})`);
}

// The fee buys one act of arranging — the same phone call whether it seats two
// or seven — so it must never pick up the per-guest surcharge.
const one = fee("restaurant", "", 1, inDays(20))!;
const seven = fee("restaurant", "", 7, inDays(20))!;
check(
  one.amount === seven.amount && one.amount === RESTAURANT_FEE,
  "fee is flat, not per guest",
  `1 guest $${one.amount} / 7 guests $${seven.amount}`,
);

// A tampered client must not be able to record a party of 99.
const over = fee("restaurant", "", 99, inDays(20))!;
const under = fee("restaurant", "", 0, inDays(20))!;
check(
  over.guests === MAX_GUESTS && under.guests === 1,
  "guests clamped",
  `99 becomes ${over.guests} / 0 becomes ${under.guests}`,
);

console.log("\n--- What comes back on a cancellation ---");

for (const [label, type, date, mode, expected] of [
  // Once the table is held the work is done. The day of the meal is irrelevant.
  ["restaurant, meal 60 days out", "restaurant", inDays(60), "policy", 0],
  ["restaurant, meal 30 days out", "restaurant", inDays(30), "policy", 0],
  ["restaurant, meal 8 days out", "restaurant", inDays(8), "policy", 0],
  ["restaurant, meal tomorrow", "restaurant", inDays(1), "policy", 0],
  ["restaurant, no date recorded", "restaurant", null, "policy", 0],
  ["restaurant, mode omitted", "restaurant", inDays(30), undefined, 0],

  // A booking with no request type predates the pivot. Its behaviour must not
  // have moved by a single percent.
  ["pre-pivot (null), 30 days out", null, inDays(30), "policy", 1],
  ["pre-pivot (null), 8 days out", null, inDays(8), "policy", 1],
  ["pre-pivot (null), 5 days out", null, inDays(5), "policy", 0.5],
  ["pre-pivot (null), 2 days out", null, inDays(2), "policy", 0],
  ["pre-pivot (undefined), 30 days out", undefined, inDays(30), "policy", 1],

  ["tour, 30 days out", "tour", inDays(30), "policy", 1],
  ["tour, 5 days out", "tour", inDays(5), "policy", 0.5],
  ["tour, 2 days out", "tour", inDays(2), "policy", 0],

  // When the failure is ours — weather, our own cancellation, the restaurant
  // dropping it — the guest pays nothing, on every path.
  ["restaurant, admin full refund", "restaurant", inDays(30), "full", 1],
  ["restaurant, admin full, meal tomorrow", "restaurant", inDays(1), "full", 1],
  ["tour, admin full, 2 days out", "tour", inDays(2), "full", 1],
  ["pre-pivot, admin full", null, inDays(2), "full", 1],
] as [string, unknown, string | null, unknown, number][]) {
  const got = mode === undefined ? refund(type, date) : refund(type, date, mode);
  check(got.rate === expected, label, `rate ${got.rate} (expected ${expected})  [${got.tier}]`);
}

// A guest reading "3日前以降" about a meal two months away would rightly think
// it was a mistake. The restaurant reason must stand on its own.
const tier = refund("restaurant", inDays(30), "policy").tier;
check(
  !tier.includes("3日前") && !tier.includes("実施日"),
  "restaurant reason does not cite the tour ladder",
  `"${tier}"`,
);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
