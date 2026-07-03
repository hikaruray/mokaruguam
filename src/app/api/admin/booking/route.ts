import { setBookingStatus, type BookingStatus } from "@/lib/store";

// Update a booking request's status from the Admin dashboard.
//
// Actions map to the statuses in booking-payment-design.md:
//   confirm → 予約確定  (future: Stripe capture)
//   decline → お断り    (future: Stripe cancel/release of the authorization)
//   cancel  → キャンセル (future: Stripe refund per the 3-tier policy)
//
// Protected by HTTP Basic Auth in production (see src/middleware.ts).
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
  if (!id || !status) {
    return Response.json({ error: "Bad parameters." }, { status: 400 });
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
