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
