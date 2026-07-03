import { amountForBooking } from "@/lib/pricing";
import { createAuthorizeOrder, isPaypalConfigured } from "@/lib/paypal";

// Creates a PayPal order (intent=AUTHORIZE) for the chosen plan + guests + date.
//
// IMPORTANT: the charge amount is computed HERE on the server from the plan id,
// guest count and TOUR DATE (peak season recomputed from the date) — never taken
// from the client — so a tampered client cannot change the price, and peak-season
// tours are held at the correct (higher) amount.
export async function POST(request: Request) {
  if (!isPaypalConfigured()) {
    return Response.json(
      { error: "オンライン決済は現在ご利用いただけません。" },
      { status: 503 },
    );
  }

  let body: { planId?: string; guests?: number; tourDate?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const calc = amountForBooking(
    body.planId ?? "",
    Number(body.guests ?? 0),
    body.tourDate,
  );
  if (!calc) {
    return Response.json({ error: "プランが不正です。" }, { status: 400 });
  }

  try {
    const order = await createAuthorizeOrder(calc.amount, {
      referenceId: `mokaru-${calc.plan.id}`,
      description: `Mokaru Guam ${calc.plan.name}（${calc.guests}名${calc.peak ? "・繁忙期" : ""}）`,
    });
    // Return the order id and the server-trusted amount (for display only).
    return Response.json({
      id: order.id,
      amount: calc.amount,
      planName: calc.plan.name,
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
