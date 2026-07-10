import { verifyCancelToken } from "@/lib/cancel-token";
import { cancelBooking } from "@/lib/booking-actions";

// Customer self-service cancellation. The token (from the emailed link) is
// verified server-side; the booking id it encodes is the only thing we trust.
// Refund/void follows the same shared, idempotent logic as the admin route.
export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const bookingId = body.token ? verifyCancelToken(body.token) : null;
  if (!bookingId) {
    return Response.json(
      { error: "キャンセルリンクが無効です。" },
      { status: 400 },
    );
  }

  try {
    const result = await cancelBooking(bookingId, "policy");
    if (!result) {
      return Response.json(
        { error: "予約が見つかりませんでした。" },
        { status: 404 },
      );
    }
    return Response.json({
      ok: true,
      alreadyCancelled: result.alreadyCancelled,
      refund: result.refund,
      // Post-cancel payment state, so the UI can tell "no charge" (voided/none)
      // apart from "charged, no refund" (captured) and word it clearly.
      payment: result.booking.payment,
    });
  } catch (err) {
    console.error("Self-cancel failed:", err);
    return Response.json(
      { error: "キャンセル処理に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }
}
