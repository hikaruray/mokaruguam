import {
  getBooking,
  setBookingStatus,
  setBookingPayment,
  type BookingStatus,
} from "@/lib/store";
import {
  captureAuthorization,
  voidAuthorization,
  refundCapture,
  isPaypalConfigured,
} from "@/lib/paypal";
import { amountForBooking, refundRateForDate } from "@/lib/pricing";

// Update a booking's status from the Admin dashboard, and drive the matching
// PayPal action (booking-payment-design.md: authorize → capture/void/refund).
//
//   confirm     → 予約確定   : capture the authorization (決済確定)
//   decline     → お断り     : void the authorization (仮押さえ解除・課金なし)
//   cancel      → キャンセル : refund per the 3-tier policy (実施日基準)
//   cancel-full → キャンセル : full refund (天候不良・自社都合の中止)
//
// PayPal actions run only when the booking carries the relevant PayPal id and
// PayPal is configured; otherwise this behaves as status-only (request-only
// bookings, or local dev without PayPal). Protected by Basic Auth (src/proxy.ts).
const ACTION_TO_STATUS: Record<string, BookingStatus> = {
  confirm: "confirmed",
  decline: "declined",
  cancel: "cancelled",
  "cancel-full": "cancelled",
};

export async function POST(request: Request) {
  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, action } = body;
  const status = action ? ACTION_TO_STATUS[action] : undefined;
  if (!id || !status || !action) {
    return Response.json({ error: "Bad parameters." }, { status: 400 });
  }

  const booking = await getBooking(id);
  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
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

  // Recompute the charged amount server-side (never trust stored/client amount)
  // from plan + guests + tour date, so refunds use the correct figure.
  const calc = amountForBooking(
    booking.planId,
    booking.guests,
    booking.preferredDate,
  );
  const chargedAmount = calc?.amount ?? 0;

  // Extra info surfaced to the admin UI (refund rate/amount actually applied).
  let refundResult: { rate: number; amount: number; tier: string } | null = null;

  // Drive the PayPal side first — if it fails, we do NOT change the status, so
  // the admin can retry rather than ending up with an inconsistent record.
  try {
    if (action === "confirm" && hasAuthorization) {
      const { captureId } = await captureAuthorization(
        booking.paypalAuthorizationId!,
      );
      await setBookingPayment(id, {
        payment: "captured",
        paypalCaptureId: captureId,
      });
    } else if (action === "decline" && hasAuthorization) {
      await voidAuthorization(booking.paypalAuthorizationId!);
      await setBookingPayment(id, { payment: "voided" });
    } else if (action === "cancel") {
      // Policy-based refund from the tour date (実施日基準・グアム時間).
      const { rate, tier } = refundRateForDate(booking.preferredDate);
      const refundAmount = Math.round(chargedAmount * rate * 100) / 100;
      if (hasCapture && rate > 0) {
        await refundCapture(
          booking.paypalCaptureId!,
          rate >= 1 ? undefined : refundAmount, // omit amount = full refund
        );
        await setBookingPayment(id, {
          payment: "refunded",
          refundAmount,
          refundRate: rate,
        });
      } else if (hasCapture && rate === 0) {
        // No refund per policy; keep the money, just record the 0% rate.
        await setBookingPayment(id, {
          payment: "captured",
          refundAmount: 0,
          refundRate: 0,
        });
      }
      refundResult = { rate, amount: hasCapture ? refundAmount : 0, tier };
    } else if (action === "cancel-full") {
      // Full refund regardless of date (weather / business-side cancellation).
      if (hasCapture) {
        await refundCapture(booking.paypalCaptureId!); // no amount = full
        await setBookingPayment(id, {
          payment: "refunded",
          refundAmount: chargedAmount,
          refundRate: 1,
        });
      }
      refundResult = { rate: 1, amount: hasCapture ? chargedAmount : 0, tier: "全額返金（天候・自社都合）" };
    }
  } catch (err) {
    console.error("PayPal action failed:", err);
    return Response.json(
      { error: "決済処理に失敗しました。もう一度お試しください。" },
      { status: 502 },
    );
  }

  try {
    await setBookingStatus(id, status);
  } catch (err) {
    console.error("Failed to update booking status:", err);
    return Response.json(
      { error: "Could not update the booking. Please try again." },
      { status: 503 },
    );
  }
  return Response.json({ ok: true, refund: refundResult });
}
