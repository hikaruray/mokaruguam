// Single source of truth for pricing — mirrors MokaruGuam/pricing.md.
// Prices are per VEHICLE (not per person). 5–7 guests add +$20 per plan.
//
// Kept as plain data so the pricing section, the booking form (plan dropdown),
// and any future per-person calculators all read the same numbers.

export interface Plan {
  id: string;
  name: string;      // Japanese display name
  hours: string;     // display label for duration
  base: number;      // regular price, 1–4 guests, USD, per vehicle
  peak: number;      // peak-season price, 1–4 guests, USD, per vehicle
  popular?: boolean; // highlight the most popular plan
  blurb: string[];   // short selling points
}

// +$20 for groups of 5–7 guests (applies to every plan, regular and peak).
export const EXTRA_GUEST_SURCHARGE = 20;

// Vehicle capacity — sedan up to 4 adults, van up to 7.
export const MAX_GUESTS = 7;

export const PLANS: Plan[] = [
  {
    id: "short",
    name: "3時間プラン",
    hours: "3時間",
    base: 170,
    peak: 205,
    blurb: ["短時間でも主要スポット", "初めての方に人気"],
  },
  {
    id: "middle",
    name: "5時間プラン",
    hours: "5時間",
    base: 250,
    peak: 300,
    popular: true,
    blurb: ["観光＋ランチにちょうどいい", "迷ったらこれ"],
  },
  {
    id: "long",
    name: "8時間プラン",
    hours: "8時間",
    base: 345,
    peak: 420,
    blurb: ["島をたっぷり満喫", "ビーチ＋観光＋買い物"],
  },
  {
    id: "total",
    name: "ワンデープラン",
    hours: "12時間",
    base: 500,
    peak: 600,
    blurb: ["朝から夜まで完全満喫", "特別な1日に"],
  },
];

// Price for a plan given guest count and season. Adds the surcharge for 5–7.
export function priceFor(plan: Plan, guests: number, peak = false): number {
  const bandPrice = peak ? plan.peak : plan.base;
  return guests >= 5 ? bandPrice + EXTRA_GUEST_SURCHARGE : bandPrice;
}

// Rounded per-person amount for display ("約$XX / 人").
export function perPerson(plan: Plan, guests: number, peak = false): number {
  const g = Math.max(1, guests);
  return Math.round(priceFor(plan, g, peak) / g);
}

// ---------------------------------------------------------------------------
// Peak-season detection (mirrors MokaruGuam/pricing.md)
// ---------------------------------------------------------------------------
// Ranges recur every year, so the check is month/day only (year-independent).
// Each range is [startMonth, startDay] .. [endMonth, endDay], inclusive.
// The year-end range wraps across the new year (Dec 20 → Jan 11).
export const PEAK_RANGES: {
  label: string;
  start: [number, number];
  end: [number, number];
}[] = [
  { label: "ゴールデンウィーク", start: [4, 26], end: [5, 6] },
  { label: "夏休み", start: [7, 17], end: [8, 31] },
  { label: "シルバーウィーク", start: [9, 19], end: [9, 23] },
  { label: "年末年始", start: [12, 20], end: [1, 11] }, // wraps year-end
];

// Compare (month, day) pairs ignoring year. Returns <0, 0, or >0.
function cmpMd(aM: number, aD: number, bM: number, bD: number): number {
  return aM !== bM ? aM - bM : aD - bD;
}

// Is the given month/day inside any peak range? (year-independent)
export function isPeakMonthDay(month: number, day: number): boolean {
  for (const r of PEAK_RANGES) {
    const [sM, sD] = r.start;
    const [eM, eD] = r.end;
    const afterStart = cmpMd(month, day, sM, sD) >= 0;
    const beforeEnd = cmpMd(month, day, eM, eD) <= 0;
    if (cmpMd(sM, sD, eM, eD) <= 0) {
      // Normal range within one year.
      if (afterStart && beforeEnd) return true;
    } else {
      // Wrapping range (e.g. Dec 20 → Jan 11): match either tail.
      if (afterStart || beforeEnd) return true;
    }
  }
  return false;
}

// Parse a tour date. Accepts "YYYY-MM-DD" (from <input type="date">) and a few
// lenient forms. Returns null if it can't extract a month/day.
export function isPeakDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const m = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return isPeakMonthDay(Number(m[2]), Number(m[3]));
  // Fallback: "M/D" or "M月D日"
  const md =
    dateStr.match(/(?:^|\D)(\d{1,2})[/月](\d{1,2})/) ?? null;
  if (md) return isPeakMonthDay(Number(md[1]), Number(md[2]));
  return false;
}

// Server-side amount by plan id + guests + tour date. Returns null for an
// unknown plan. Used by the PayPal order route so the charge amount is computed
// and TRUSTED on the server (peak recomputed from the date), never taken from
// the client. Guests are clamped to 1..MAX.
export function amountForBooking(
  planId: string,
  guests: number,
  tourDate?: string | null,
): { plan: Plan; guests: number; amount: number; peak: boolean } | null {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  const g = Math.min(MAX_GUESTS, Math.max(1, Math.floor(guests) || 1));
  const peak = isPeakDate(tourDate);
  return { plan, guests: g, amount: priceFor(plan, g, peak), peak };
}
