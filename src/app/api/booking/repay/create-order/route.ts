import { loadRepayable } from "@/lib/repay";
import { createAuthorizeOrder } from "@/lib/paypal";
import { rateLimit, clientIp } from "@/lib/spam";

// Creates the REPLACEMENT PayPal order (intent=AUTHORIZE) for a booking whose
// first hold died before the table could be confirmed.
//
// The amount is not taken from the client and not recomputed from today's price
// list either: it is the figure snapshotted on the booking when the guest made
// the request. They agreed to that number, and a fee change between then and
// now must not ride in on a re-authorisation of work they already asked for.
// lib/repay.ts is the only place that decides both the amount and who is
// allowed here — see the rule written out at the top of it.
export async function POST(request: Request) {
  if (!rateLimit(`repay-order:${clientIp(request)}`)) {
    return Response.json(
      { error: "しばらくおいて再度お試しください。" },
      { status: 429 },
    );
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const check = await loadRepayable(body.token);
  if (!check.ok) {
    return Response.json({ error: check.error }, { status: check.status });
  }

  // 🔴 A live hold means the money is already waiting. Creating a second order
  // here would put another $10 on the card for one table — the exact failure
  // the PayPal lookup in lib/repay.ts exists to prevent, so it must refuse and
  // not merely warn.
  if (check.holdIsLive) {
    return Response.json(
      {
        error:
          "お支払いは有効なままお預かりしています。追加のお手続きは不要です。",
      },
      { status: 409 },
    );
  }

  try {
    const order = await createAuthorizeOrder(check.amount, {
      referenceId: "mokaru-restaurant-repay",
      description: `Mokaru Guam レストラン予約代行 手配料（お手続きのやり直し）`,
    });
    return Response.json({ id: order.id, amount: check.amount });
  } catch (err) {
    console.error("PayPal repay create-order failed:", err);
    return Response.json(
      { error: "決済の準備に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }
}
