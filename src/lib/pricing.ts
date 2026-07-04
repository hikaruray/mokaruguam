// Single source of truth for pricing — mirrors MokaruGuam/pricing.md.
// Prices are per VEHICLE (not per person). 5–7 guests add +$20 per plan.
//
// Kept as plain data so the pricing section, the booking form (plan dropdown),
// and any future per-person calculators all read the same numbers.

export interface Plan {
  id: string;
  name: string;         // Japanese display name
  hours: string;        // display label for duration
  durationHours: number; // tour length in hours (for end-time display)
  base: number;         // regular price, 1–4 guests, USD, per vehicle
  peak: number;         // peak-season price, 1–4 guests, USD, per vehicle
  popular?: boolean;    // highlight the most popular plan
  blurb: string[];      // short selling points
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
    durationHours: 3,
    base: 170,
    peak: 205,
    blurb: ["短時間でも主要スポット", "初めての方に人気"],
  },
  {
    id: "middle",
    name: "5時間プラン",
    hours: "5時間",
    durationHours: 5,
    base: 250,
    peak: 300,
    popular: true,
    blurb: ["観光＋ランチにちょうどいい", "迷ったらこれ"],
  },
  {
    id: "long",
    name: "8時間プラン",
    hours: "8時間",
    durationHours: 8,
    base: 345,
    peak: 420,
    blurb: ["島をたっぷり満喫", "ビーチ＋観光＋買い物"],
  },
  {
    id: "total",
    name: "ワンデープラン",
    hours: "12時間",
    durationHours: 12,
    base: 500,
    peak: 600,
    blurb: ["朝から夜まで完全満喫", "特別な1日に"],
  },
];

// ---------------------------------------------------------------------------
// Tour start times (single source of truth) — mirrors the owner's matrix.
// ---------------------------------------------------------------------------
// Per plan id, start times grouped by part of day. Times are "HH:MM" (24h).
// The end time shown to the guest is start + plan.durationHours.
export type TimeBand = "午前" | "午後" | "夕方";

export const START_TIMES: Record<string, Record<TimeBand, string[]>> = {
  short: {
    午前: ["8:30", "9:00", "9:30"],
    午後: ["12:30", "13:00", "13:30"],
    夕方: ["16:30", "17:00", "17:30"],
  },
  middle: {
    午前: ["8:30", "9:00", "9:30"],
    午後: ["14:00", "14:30", "15:00"],
    夕方: [],
  },
  long: {
    午前: ["8:30", "9:00", "9:30"],
    午後: [],
    夕方: [],
  },
  total: {
    午前: ["8:30", "9:00", "9:30"],
    午後: [],
    夕方: [],
  },
};

export const TIME_BANDS: TimeBand[] = ["午前", "午後", "夕方"];

// Add durationHours to a "H:MM" start time and format as "H:MM" (24h).
export function endTimeFor(start: string, durationHours: number): string {
  const [h, m] = start.split(":").map(Number);
  const endH = h + durationHours;
  return `${endH}:${String(m).padStart(2, "0")}`;
}

// Flat list of valid start times for a plan (for validation / reset checks).
export function startTimesForPlan(planId: string): string[] {
  const bands = START_TIMES[planId];
  if (!bands) return [];
  return TIME_BANDS.flatMap((b) => bands[b]);
}

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

// ---------------------------------------------------------------------------
// Cancellation refund policy (mirrors booking-payment-design.md and /guide)
// ---------------------------------------------------------------------------
// Basis: the TOUR DATE in Guam time (UTC+10). Days = tour date minus today,
// both taken as Guam-local calendar dates.
//   8+ days before  → 100% refund (rate 1.0)
//   7–4 days before →  50% refund (rate 0.5)
//   3 days or fewer (incl. same day / no-show) → no refund (rate 0)
export const GUAM_UTC_OFFSET_HOURS = 10;

// Guam-local calendar date (year, month, day) for a given instant.
function guamYmd(instant: Date): { y: number; m: number; d: number } {
  const guam = new Date(instant.getTime() + GUAM_UTC_OFFSET_HOURS * 3600_000);
  return {
    y: guam.getUTCFullYear(),
    m: guam.getUTCMonth() + 1,
    d: guam.getUTCDate(),
  };
}

// Whole days from "now" until the tour date, by Guam calendar date (date-only,
// so time of day doesn't shift the tier). Returns null if the date can't parse.
export function daysUntilTour(
  tourDate: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!tourDate) return null;
  const m = tourDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return null;
  const tourUTC = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = guamYmd(now);
  const todayUTC = Date.UTC(today.y, today.m - 1, today.d);
  return Math.round((tourUTC - todayUTC) / 86_400_000);
}

// Refund rate (0..1) for a policy-based cancellation on `tourDate`.
// When the date can't be parsed, defaults to the safest tier for the business
// (no refund) — the admin can still choose an explicit full refund.
export function refundRateForDate(
  tourDate: string | null | undefined,
  now: Date = new Date(),
): { rate: number; days: number | null; tier: string } {
  const days = daysUntilTour(tourDate, now);
  if (days == null) return { rate: 0, days: null, tier: "日付不明（返金なし）" };
  if (days >= 8) return { rate: 1, days, tier: "8日以上前（全額返金）" };
  if (days >= 4) return { rate: 0.5, days, tier: "7〜4日前（50%返金）" };
  return { rate: 0, days, tier: "3日前以降（返金なし）" };
}
