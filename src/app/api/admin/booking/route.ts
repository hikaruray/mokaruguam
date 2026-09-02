import {
  getBooking,
  setBookingStatus,
  setBookingPayment,
  chargedAmount,
} from "@/lib/store";
import {
  captureAuthorization,
  voidAuthorization,
  isPaypalConfigured,
} from "@/lib/paypal";
import { cancelBooking } from "@/lib/booking-actions";
import { sendMail } from "@/lib/email";
import { confirmedEmail, declinedEmail } from "@/lib/booking-emails";

// Update a booking's status from the Admin dashboard, and drive the matching
// PayPal action (booking-payment-design.md: authorize → capture/void/refund).
//
//   confirm     → 予約確定   : capture the authorization (決済確定)
//   decline     → お断り     : void the authorization (仮押さえ解除・課金なし)
//   cancel      → キャンセル : refund per the 3-tier policy (実施日基準)
//   cancel-full → キャンセル : full refund (天候不良・自社都合の中止)
//
// cancel / cancel-full share their logic with the customer self-service route
// via lib/booking-actions.ts. Protected by Basic Auth (src/proxy.ts).

export async function POST(request: Request) {
  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, action } = body;
  const valid = ["confirm", "decline", "cancel", "cancel-full"];
  if (!id || !action || !valid.includes(action)) {
    return Response.json({ error: "Bad parameters." }, { status: 400 });
  }

  // Cancellation (with policy/full refund) is shared with the customer route.
  if (action === "cancel" || action === "cancel-full") {
    try {
      const result = await cancelBooking(
        id,
        action === "cancel-full" ? "full" : "policy",
      );
      if (!result) {
        return Response.json({ error: "Booking not found." }, { status: 404 });
      }
      return Response.json({ ok: true, refund: result.refund });
    } catch (err) {
      console.error("Cancel failed:", err);
      return Response.json(
        { error: "決済処理に失敗しました。もう一度お試しください。" },
        { status: 502 },
      );
    }
  }

  // confirm / decline
  const booking = await getBooking(id);
  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  // Guard: a booking whose money is already captured must not be "declined".
  // Declining sends the customer a "the hold was released, you were not charged"
  // email and issues no refund — so on a charged booking it would be a lie plus
  // kept money. Cancel (with refund) is the correct action there. The Admin UI
  // only offers decline on pending bookings; this makes that structural.
  if (action === "decline" && booking.payment === "captured") {
    return Response.json(
      {
        error:
          "この予約は決済確定済みです。お断りではなく「キャンセル（返金）」をご利用ください。",
      },
      { status: 409 },
    );
  }

  const hasAuthorization =
    isPaypalConfigured() &&
    booking.payment === "authorized" &&
    Boolean(booking.paypalAuthorizationId);

  try {
    if (action === "confirm") {
      if (hasAuthorization) {
        const { captureId } = await captureAuthorization(
          booking.paypalAuthorizationId!,
        );
        await setBookingPayment(id, {
          payment: "captured",
          paypalCaptureId: captureId,
        });
      }
      await setBookingStatus(id, "confirmed");
    } else {
      // decline: release the hold (idempotent void), then mark declined.
      if (hasAuthorization) {
        await voidAuthorization(booking.paypalAuthorizationId!);
        await setBookingPayment(id, { payment: "voided" });
      }
      await setBookingStatus(id, "declined");
    }
  } catch (err) {
    console.error("PayPal action failed:", err);
    return Response.json(
      { error: "決済処理に失敗しました。もう一度お試しください。" },
      { status: 502 },
    );
  }

  // Notify the customer of the outcome, and copy the owner (best-effort;
  // sendMail never throws).
  //
  // bccOwner was already here for cancellations but not for these two, so the
  // owner's inbox held the request and the cancellation and nothing in
  // between: no written record of what was actually promised to the guest, on
  // the one step that commits a guide and a vehicle to a date. Owner request,
  // 2026-08-30.
  if (action === "confirm") {
    // The amount charged, as snapshotted at request time — so the email always
    // matches the customer's card statement even after a price change.
    const mail = confirmedEmail(booking, chargedAmount(booking));
    await sendMail({
      to: booking.email,
      subject: mail.subject,
      text: mail.text,
      bccOwner: true,
    });
  } else {
    const mail = declinedEmail(booking);
    await sendMail({
      to: booking.email,
      subject: mail.subject,
      text: mail.text,
      bccOwner: true,
    });
  }

  return Response.json({ ok: true });
}
