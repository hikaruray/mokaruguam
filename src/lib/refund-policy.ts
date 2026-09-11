// Which refund rule applies to a cancellation, and why.
//
// WHY THIS IS ITS OWN FILE
// The rule used to live inline inside cancelBooking(), where it was a single
// call to refundRateForDate(). When the Oct 1 pivot rewrote the terms to say a
// restaurant arrangement fee is not refunded, the terms changed and this did
// not — so the $10 was still refunded in full whenever the meal was 8 or more
// days away, which is most bookings. A guest could trigger it alone, using the
// cancel link in their own acknowledgement email.
//
// The audit that found it put the cause plainly: the wording was corrected
// without anyone going to look for the code that moves the money. Pulling the
// decision out here gives that code one address, one set of cases, and a test.
//
// Deliberately takes primitives rather than a BookingRequest: lib/store.ts
// imports lib/pricing.ts, so a policy module that imported the store would put
// a cycle in the middle of the payment path. It also means this can be executed
// on its own, which is how the cases below are checked.

import { refundRateForDate } from "./pricing";

export type RefundMode =
  // Guest-initiated, or admin applying the normal policy.
  | "policy"
  // Admin overriding: weather, our own cancellation, or the restaurant
  // dropping the booking. When the failure is ours, the guest pays nothing.
  | "full";

export interface RefundDecision {
  rate: number; // 0..1
  tier: string; // shown to the guest and recorded on the booking
}

/**
 * @param requestType "tour" | "restaurant", or null for a pre-pivot charter
 *                    booking taken when a tour was the only thing sold.
 * @param preferredDate the tour date, for the date-based ladder.
 */
export function refundDecision(
  requestType: "tour" | "restaurant" | null | undefined,
  preferredDate: string | null | undefined,
  mode: RefundMode = "policy",
): RefundDecision {
  if (mode === "full") {
    return { rate: 1, tier: "全額返金（自社都合・天候）" };
  }

  if (requestType === "restaurant") {
    // No date ladder here, on purpose. The ladder prices a tour that has not
    // happened yet — cancel early enough and the guide and vehicle can still
    // be sold to someone else. The $10 buys the act of getting the table, and
    // once the table is held that work is finished and cannot be resold. The
    // day of the meal has no bearing on it.
    return { rate: 0, tier: "お手配完了後のため返金なし" };
  }

  // "tour", and also null: a booking with no request type predates the pivot,
  // so it keeps exactly the behaviour it had when it was taken. That is why
  // the column was left NULL on existing rows instead of being backfilled.
  const { rate, tier } = refundRateForDate(preferredDate);
  return { rate, tier };
}
