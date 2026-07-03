import { Resend } from "resend";
import { FROM_EMAIL, CONTACT_EMAIL, OWNER_COPY_EMAIL } from "@/lib/config";
import { addBooking } from "@/lib/store";
import { PLANS, amountForBooking } from "@/lib/pricing";
import {
  authorizeOrder,
  getOrder,
  isPaypalConfigured,
  type PaypalOrder,
} from "@/lib/paypal";

// Receives a booking REQUEST.
//
// Two modes:
//   • Request-only (no PayPal env, or no paypalOrderId) — saves the request and
//     emails the business, exactly as before. payment stays "none".
//   • With PayPal — the buyer has approved an AUTHORIZE order on the client.
//     We verify the order amount server-side, move it to an authorization
//     (a hold, not a charge), and save the booking as payment="authorized"
//     with the order + authorization ids. Capture happens later on 予約確定.
export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    planId?: string;
    preferredDate?: string;
    guests?: number;
    spots?: string;
    notes?: string;
    paypalOrderId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { name, email, phone, planId, preferredDate, guests, spots, notes } = body;

  if (!name || !email || !phone || !preferredDate || !guests) {
    return Response.json(
      { error: "必須項目（お名前・連絡先・希望日・人数）をご入力ください。" },
      { status: 400 },
    );
  }

  const plan = PLANS.find((p) => p.id === planId);
  const planName = plan ? plan.name : "（未選択）";

  // --- PayPal path: verify + authorize before saving --------------------
  let paymentFields: {
    payment?: "authorized";
    paypalOrderId?: string;
    paypalAuthorizationId?: string;
  } = {};
  let authorizedAmount: number | null = null;

  if (body.paypalOrderId && isPaypalConfigured()) {
    // preferredDate carries the tour date (from the date picker); peak is
    // recomputed from it server-side so verification uses the correct amount.
    const calc = amountForBooking(planId ?? "", Number(guests), preferredDate);
    if (!calc) {
      return Response.json({ error: "プランが不正です。" }, { status: 400 });
    }
    try {
      // Verify the approved order's amount matches our server-computed price,
      // so a tampered order can't be authorized at the wrong amount.
      const order = (await getOrder(body.paypalOrderId)) as PaypalOrder & {
        purchase_units?: { amount?: { value?: string } }[];
      };
      const orderValue = Number(order.purchase_units?.[0]?.amount?.value ?? "0");
      if (orderValue.toFixed(2) !== calc.amount.toFixed(2)) {
        return Response.json(
          { error: "金額が一致しません。もう一度お試しください。" },
          { status: 400 },
        );
      }
      const { authorizationId } = await authorizeOrder(body.paypalOrderId);
      paymentFields = {
        payment: "authorized",
        paypalOrderId: body.paypalOrderId,
        paypalAuthorizationId: authorizationId,
      };
      authorizedAmount = calc.amount;
    } catch (err) {
      console.error("PayPal authorize failed:", err);
      return Response.json(
        { error: "決済の確定に失敗しました。時間をおいて再度お試しください。" },
        { status: 502 },
      );
    }
  }

  let saved;
  try {
    saved = await addBooking({
      name,
      email,
      phone,
      planId: planId ?? "",
      planName,
      preferredDate,
      guests: Number(guests),
      spots: spots?.trim() ?? "",
      notes: notes?.trim() ?? "",
      ...paymentFields,
    });
  } catch (err) {
    console.error("Failed to save booking:", err);
    return Response.json(
      { error: "送信できませんでした。時間をおいて再度お試しください。" },
      { status: 503 },
    );
  }

  const subject = `【リクエスト予約】${name} 様／${planName}`;
  const text = [
    `新しいリクエスト予約が入りました。`,
    ``,
    `お名前:   ${name}`,
    `連絡先:   ${email} / ${phone}`,
    `プラン:   ${planName}`,
    `希望日時: ${preferredDate}`,
    `人数:     ${guests}名`,
    `行きたいスポット:`,
    spots?.trim() || "（記入なし）",
    ``,
    `その他ご要望:`,
    notes?.trim() || "（なし）",
    ``,
    authorizedAmount != null
      ? `お支払い: PayPalで $${authorizedAmount.toFixed(2)} を仮押さえ済み（確定時に自動決済／お断り時に自動解除）`
      : `お支払い: 未設定（リクエストのみ）`,
    `受付ID: ${saved.id}`,
    `— Mokaru Guam サイトのリクエストフォームより`,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;

  // Until the sending key is configured at launch, log so nothing is lost.
  const authorized = authorizedAmount != null;

  if (!apiKey) {
    console.log("[BOOKING REQUEST — email sending not configured yet]\n" + text);
    return Response.json({ ok: true, delivered: false, authorized });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      bcc: OWNER_COPY_EMAIL,
      replyTo: email,
      subject,
      text,
    });
    return Response.json({ ok: true, delivered: true, authorized });
  } catch (err) {
    console.error("Failed to send booking email:", err);
    // The request is already saved to the store, so report success to the user;
    // the owner can still see it in the Admin dashboard.
    return Response.json({ ok: true, delivered: false, authorized });
  }
}
