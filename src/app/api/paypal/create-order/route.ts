import { amountForRequest } from "@/lib/pricing";
import { createAuthorizeOrder, isPaypalConfigured } from "@/lib/paypal";
import { rateLimit, clientIp } from "@/lib/spam";

// Creates a PayPal order (intent=AUTHORIZE) for a request that involves money.
//
// IMPORTANT: the amount is computed HERE on the server — never taken from the
// client — so a tampered client cannot change what gets held on the card.
//
// 2026-09-11: this used to call amountForBooking(), which only knows the four
// charter plans, so a restaurant request was rejected with "プランが不正です。"
// before it could get an order at all. It now goes through amountForRequest(),
// which returns the flat arrangement fee for a restaurant and null for a tour —
// arranging a partner tour costs the guest nothing, so reaching this route on
// that path is a bug and must fail rather than invent an amount.
export async function POST(request: Request) {
  if (!isPaypalConfigured()) {
    return Response.json(
      { error: "オンライン決済は現在ご利用いただけません。" },
      { status: 503 },
    );
  }

  // Throttle order creation per IP (each order is a PayPal API call).
  if (!rateLimit(`create-order:${clientIp(request)}`)) {
    return Response.json(
      { error: "しばらくおいて再度お試しください。" },
      { status: 429 },
    );
  }

  let body: {
    requestType?: string;
    planId?: string;
    guests?: number;
    tourDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const calc = amountForRequest(
    body.requestType,
    body.planId,
    Number(body.guests ?? 0),
    body.tourDate,
  );
  // null means no money should move on this path — a missing/unknown request
  // type, or a tour, which the guest pays the operator for directly.
  if (!calc) {
    return Response.json(
      { error: "この内容ではお支払いは発生しません。" },
      { status: 400 },
    );
  }

  try {
    const order = await createAuthorizeOrder(calc.amount, {
      referenceId: calc.referenceId,
      description: `Mokaru Guam ${calc.label}（${calc.guests}名${calc.peak ? "・繁忙期" : ""}）`,
    });
    // Return the order id and the server-trusted amount (for display only).
    return Response.json({
      id: order.id,
      amount: calc.amount,
      planName: calc.label,
      guests: calc.guests,
      peak: calc.peak,
    });
  } catch (err) {
    console.error("PayPal create-order failed:", err);
    return Response.json(
      { error: "決済の準備に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }
}
