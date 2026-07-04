// Shared booking-cancellation logic used by BOTH the admin route and the
// customer self-service cancel route, so the two stay in lockstep.
//
// Rules (booking-payment-design.md):
//   • pending + authorized (仮押さえ) → void the hold, status=cancelled.
//   • confirmed + captured (決済確定) → refund per the tour-date policy
//       (8日以上=全額 / 7〜4日=50% / 3日以内=なし), status=cancelled.
//   • already declined/cancelled, or no PayPal → status=cancelled, no charge op.
// Idempotent: PayPal "already voided/refunded" is treated as success by the
// lib/paypal.ts helpers, and an already-cancelled booking is a no-op success.

import "server-only";
import {
  getBooking,
  setBookingStatus,
  setBookingPayment,
  type BookingRequest,
} from "./store";
import {
  voidAuthorization,
  refundCapture,
  isPaypalConfigured,
} from "./paypal";
import { amountForBooking, refundRateForDate } from "./pricing";

export interface CancelResult {
  ok: boolean;
  alreadyCancelled: boolean;
  refund: { rate: number; amount: number; tier: string } | null;
  booking: BookingRequest;
}

// Cancel a booking by id. `mode`:
//   "policy" — refund per the 3-tier date policy (customer + admin default)
//   "full"   — full refund regardless of date (admin: weather/self cancel)
export async function cancelBooking(
  id: string,
  mode: "policy" | "full" = "policy",
): Promise<CancelResult | null> {
  const booking = await getBooking(id);
  if (!booking) return null;

  // Idempotent: already cancelled/declined → report success, do nothing.
  if (booking.status === "cancelled" || booking.status === "declined") {
    return {
      ok: true,
      alreadyCancelled: true,
      refund:
        booking.refundRate != null
          ? {
              rate: booking.refundRate,
              amount: booking.refundAmount ?? 0,
              tier: "",
            }
          : null,
      booking,
    };
  }

  const paypalReady = isPaypalConfigured();
  const hasAuthorization =
    paypalReady &&
    booking.payment === "authorized" &&
    Boolean(booking.paypalAuthorizationId);
  const hasCapture =
    paypalReady &&
    booking.payment === "captured" &&
    Boolean(booking.paypalCaptureId);

  const calc = amountForBooking(
    booking.planId,
    booking.guests,
    booking.preferredDate,
  );
  const chargedAmount = calc?.amount ?? 0;

  let refund: CancelResult["refund"] = null;

  if (hasAuthorization) {
    // Only a hold exists — release it (no charge).
    await voidAuthorization(booking.paypalAuthorizationId!);
    await setBookingPayment(id, { payment: "voided" });
    refund = { rate: 0, amount: 0, tier: "仮押さえの解除（課金なし）" };
  } else if (hasCapture) {
    const { rate, tier } =
      mode === "full"
        ? { rate: 1, tier: "全額返金（自社都合・天候）" }
        : refundRateForDate(booking.preferredDate);
    const refundAmount = Math.round(chargedAmount * rate * 100) / 100;
    if (rate > 0) {
      await refundCapture(
        booking.paypalCaptureId!,
        rate >= 1 ? undefined : refundAmount, // omit = full refund
      );
      await setBookingPayment(id, {
        payment: "refunded",
        refundAmount,
        refundRate: rate,
      });
    } else {
      // No refund per policy; record the 0% outcome.
      await setBookingPayment(id, {
        payment: "captured",
        refundAmount: 0,
        refundRate: 0,
      });
    }
    refund = { rate, amount: refundAmount, tier };
  }
  // else: request-only / no PayPal → status change only below.

  await setBookingStatus(id, "cancelled");
  const updated = (await getBooking(id)) ?? booking;

  return { ok: true, alreadyCancelled: false, refund, booking: updated };
}
