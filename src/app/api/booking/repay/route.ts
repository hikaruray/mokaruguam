import { loadRepayable } from "@/lib/repay";
import { setBookingAuthorization } from "@/lib/store";
import {
  authorizeOrder,
  voidAuthorization,
  getOrder,
  type PaypalOrder,
} from "@/lib/paypal";
import { sendMail } from "@/lib/email";
import { reauthorizedEmail, reauthorizedOwnerEmail } from "@/lib/booking-emails";
import { rateLimit, clientIp } from "@/lib/spam";
import { CONTACT_EMAIL } from "@/lib/config";

// Finalises a re-authorisation: the guest has approved the replacement order in
// PayPal, and this turns it into a hold and attaches it to the booking.
//
// 🔴 WHY THE TABLE IS NOT BOOKED BEFORE THIS POINT (design §6-4-1)
// The old order of operations was: guest accepts the alternative restaurant →
// we book the table → we capture. Between the acceptance and the capture the
// hold could die, and then the work was done, the seat was held in our name,
// and there was no money to take — the guest only had to ignore the follow-up.
// So the sequence was reversed. This route is the step that has to succeed
// before anyone rings the restaurant, which is why it must never report success
// on a hold it did not actually get.
export async function POST(request: Request) {
  if (!rateLimit(`repay:${clientIp(request)}`)) {
    return Response.json(
      { error: "しばらくおいて再度お試しください。" },
      { status: 429 },
    );
  }

  let body: { token?: string; paypalOrderId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const check = await loadRepayable(body.token);
  if (!check.ok) {
    return Response.json({ error: check.error }, { status: check.status });
  }
  if (check.holdIsLive) {
    return Response.json(
      {
        error:
          "お支払いは有効なままお預かりしています。追加のお手続きは不要です。",
      },
      { status: 409 },
    );
  }

  const orderId = body.paypalOrderId;
  if (!orderId) {
    return Response.json(
      { error: "お支払い情報を確認できませんでした。もう一度お試しください。" },
      { status: 402 },
    );
  }

  const { booking, amount } = check;
  let authorizationId: string;

  try {
    // Same verification as the original request: the approved order must carry
    // the amount this server computed, so a tampered order cannot be authorised
    // at a figure of the buyer's choosing.
    const order = (await getOrder(orderId)) as PaypalOrder & {
      purchase_units?: { amount?: { value?: string } }[];
    };
    const orderValue = Number(order.purchase_units?.[0]?.amount?.value ?? "0");
    if (orderValue.toFixed(2) !== amount.toFixed(2)) {
      return Response.json(
        { error: "金額が一致しません。もう一度お試しください。" },
        { status: 400 },
      );
    }

    const result = await authorizeOrder(orderId);
    // Only CREATED is a hold. DENIED and the other states are not, and calling
    // them one would restart the arrangement on a card that never agreed.
    if (result.status !== "CREATED") {
      return Response.json(
        {
          error:
            "カードの承認が完了しませんでした。別のカードでお試しいただくか、カード発行会社へご確認ください。",
        },
        { status: 402 },
      );
    }
    authorizationId = result.authorizationId;
  } catch (err) {
    console.error("PayPal re-authorize failed:", err);
    return Response.json(
      { error: "決済の確定に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }

  // The hold we are about to replace. Captured before the write, because the
  // write is what forgets it.
  const superseded = booking.paypalAuthorizationId;

  try {
    await setBookingAuthorization(booking.id, {
      paypalOrderId: orderId,
      paypalAuthorizationId: authorizationId,
    });
  } catch (err) {
    console.error("Failed to save re-authorisation:", err);
    // Same compensating action as the original request path: a hold we cannot
    // record is a hold nobody will ever capture or release, so release it now
    // rather than leave the guest's money held against nothing.
    try {
      await voidAuthorization(authorizationId);
    } catch (voidErr) {
      console.error("Failed to void unrecorded re-authorisation:", voidErr);
    }
    return Response.json(
      { error: "お手続きを保存できませんでした。時間をおいて再度お試しください。" },
      { status: 503 },
    );
  }

  // Release the hold we just replaced.
  //
  // Usually it is already dead — an expired hold is what sent the guest here —
  // and voidAuthorization absorbs every "it is already gone" answer, so this
  // does nothing at all in the normal case. It matters when /repay runs twice
  // over: two tabs, a double-tapped PayPal button, a retry after a slow save.
  // Then a live hold really was replaced, and without this it sits on the
  // guest's card for three days with nothing left that would ever release it.
  if (superseded && superseded !== authorizationId) {
    try {
      await voidAuthorization(superseded);
    } catch (err) {
      // Best-effort: the booking is already recorded against the new hold, and
      // the old one expires on its own. Log so it can be reconciled by hand.
      console.error("Could not void the superseded authorization:", err);
    }
  }

  // The owner has to learn about this: under §6-4-1 nothing is booked until the
  // hold exists, so this mail is the signal to go and get the table. Both sends
  // are best-effort — sendMail never throws — because the hold is already
  // recorded and a mail failure must not make the guest pay again.
  const owner = reauthorizedOwnerEmail(booking, amount);
  await sendMail({
    to: CONTACT_EMAIL,
    subject: owner.subject,
    text: owner.text,
    bccOwner: true,
  });

  const guest = reauthorizedEmail(booking, amount);
  await sendMail({
    to: booking.email,
    subject: guest.subject,
    text: guest.text,
  });

  return Response.json({ ok: true, amount });
}
