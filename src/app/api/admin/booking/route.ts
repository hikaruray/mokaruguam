import {
  getBooking,
  setBookingStatus,
  setBookingPayment,
  type BookingStatus,
} from "@/lib/store";
import {
  captureAuthorization,
  voidAuthorization,
  isPaypalConfigured,
} from "@/lib/paypal";

// Update a booking request's status from the Admin dashboard, and drive the
// matching PayPal action (booking-payment-design.md: authorize → capture/void).
//
//   confirm → 予約確定  : capture the authorization (全額決済確定)
//   decline → お断り    : void the authorization (仮押さえ解除・課金なし)
//   cancel  → キャンセル : status only for now; refund is a future step (枠あり)
//
// PayPal actions run only when the booking actually carries an authorization
// and PayPal is configured; otherwise this behaves as status-only (request-only
// bookings, or local dev without PayPal). Protected by Basic Auth (src/proxy.ts).
const ACTION_TO_STATUS: Record<string, BookingStatus> = {
  confirm: "confirmed",
  decline: "declined",
  cancel: "cancelled",
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

  // Drive the PayPal side first — if it fails, we do NOT change the status, so
  // the admin can retry rather than ending up with an inconsistent record.
  const hasAuthorization =
    isPaypalConfigured() &&
    booking.payment === "authorized" &&
    Boolean(booking.paypalAuthorizationId);

  try {
    if (action === "confirm" && hasAuthorization) {
      await captureAuthorization(booking.paypalAuthorizationId!);
      await setBookingPayment(id, "captured");
    } else if (action === "decline" && hasAuthorization) {
      await voidAuthorization(booking.paypalAuthorizationId!);
      // Hold released; leave payment marker as-is (no charge occurred).
    }
    // action === "cancel": refund flow is future work; status-only for now.
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
  return Response.json({ ok: true });
}
