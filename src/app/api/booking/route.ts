import { Resend } from "resend";
import {
  FROM_EMAIL,
  CONTACT_EMAIL,
  OWNER_COPY_EMAIL,
  LINE_URL,
  SITE_URL,
} from "@/lib/config";
import { addBooking } from "@/lib/store";
import { PLANS, amountForBooking } from "@/lib/pricing";
import {
  authorizeOrder,
  voidAuthorization,
  getOrder,
  isPaypalConfigured,
  type PaypalOrder,
} from "@/lib/paypal";
import { cancelUrl } from "@/lib/cancel-token";
import { isBot, validateBooking, rateLimit, clientIp } from "@/lib/spam";

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
    hotel?: string;
    guests?: number;
    adults?: number;
    children4to11?: number;
    children0to3?: number;
    spots?: string;
    notes?: string;
    paypalOrderId?: string;
    company?: string; // honeypot
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  // Honeypot: a bot filled the hidden field. Pretend success so it doesn't
  // retry, but save nothing and send nothing.
  if (isBot(body)) {
    return Response.json({ ok: true, delivered: false, authorized: false });
  }

  // Best-effort per-IP throttle against rapid spam submissions.
  if (!rateLimit(`booking:${clientIp(request)}`)) {
    return Response.json(
      { error: "送信が続けて行われました。しばらくおいて再度お試しください。" },
      { status: 429 },
    );
  }

  // Participant breakdown (adults + children). The total headcount is what
  // drives price/capacity, so recompute it server-side and make it authoritative.
  const adults = Number(body.adults ?? 0);
  const children4to11 = Number(body.children4to11 ?? 0);
  const children0to3 = Number(body.children0to3 ?? 0);
  const hasBreakdown =
    body.adults !== undefined ||
    body.children4to11 !== undefined ||
    body.children0to3 !== undefined;
  if (hasBreakdown) body.guests = adults + children4to11 + children0to3;
  const guestBreakdown = hasBreakdown
    ? `大人${adults}名` +
      (children4to11 > 0 ? `・子供(4-11歳)${children4to11}名` : "") +
      (children0to3 > 0 ? `・子供(0-3歳)${children0to3}名` : "")
    : "";

  const { name, email, phone, planId, preferredDate, hotel, guests, spots, notes } =
    body;

  // Hotel is required because it is where the guide drives on the day. Guests
  // who have not booked accommodation yet are told to write 未定 rather than
  // being blocked — a blank field cannot be told apart from "we never asked".
  if (!name || !email || !phone || !preferredDate || !guests || !hotel?.trim()) {
    return Response.json(
      { error: "必須項目（お名前・連絡先・希望日・ご宿泊先・人数）をご入力ください。" },
      { status: 400 },
    );
  }

  // Length / format guards (mirrors the client maxLength attributes).
  const invalid = validateBooking(body);
  if (invalid) {
    return Response.json({ error: invalid }, { status: 400 });
  }

  const plan = PLANS.find((p) => p.id === planId);
  const planName = plan ? plan.name : "（未選択）";

  // --- PayPal path: verify + authorize before saving --------------------
  let paymentFields: {
    payment?: "authorized";
    amount?: number;
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
      const { authorizationId, status } = await authorizeOrder(body.paypalOrderId);
      // Only a CREATED authorization is a real hold. PayPal can return DENIED
      // (card/risk declined — including self-payments) or other non-hold states;
      // in that case do NOT save a "held" booking or tell the customer it's held.
      if (status !== "CREATED") {
        return Response.json(
          {
            error:
              "カードの承認が完了しませんでした。別のカードでお試しいただくか、カード発行会社へご確認ください。",
          },
          { status: 402 },
        );
      }
      paymentFields = {
        payment: "authorized",
        // Snapshot the price actually held on the card. Later confirmation
        // emails and refunds read this instead of recomputing, so a future
        // price change can't restate what this customer was charged.
        amount: calc.amount,
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
      hotel: hotel.trim(),
      guests: Number(guests),
      spots: spots?.trim() ?? "",
      notes: notes?.trim() ?? "",
      ...paymentFields,
    });
  } catch (err) {
    console.error("Failed to save booking:", err);
    // Compensating action: if we already placed a hold on the card above but
    // couldn't save the booking, release the hold so the customer isn't left
    // with an orphaned authorization (money held with no booking on record).
    if (paymentFields.paypalAuthorizationId) {
      try {
        await voidAuthorization(paymentFields.paypalAuthorizationId);
        console.error(
          "Voided orphaned authorization after save failure:",
          paymentFields.paypalAuthorizationId,
        );
      } catch (voidErr) {
        // Best-effort. If this also fails, the hold expires on its own; log so
        // it can be reconciled manually.
        console.error("Failed to void orphaned authorization:", voidErr);
      }
    }
    return Response.json(
      { error: "送信できませんでした。時間をおいて再度お試しください。" },
      { status: 503 },
    );
  }

  const authorized = authorizedAmount != null;
  const amountStr = authorizedAmount != null ? authorizedAmount.toFixed(2) : "";

  // --- Business notification (to tour@ / owner) -------------------------
  const bizSubject = `【リクエスト予約】${name} 様／${planName}`;
  const bizText = [
    `新しいリクエスト予約が入りました。`,
    ``,
    `お名前:   ${name}`,
    `連絡先:   ${email} / ${phone}`,
    `プラン:   ${planName}`,
    `希望日時: ${preferredDate}`,
    `ご宿泊先: ${hotel.trim()}`,
    `人数:     ${guests}名${guestBreakdown ? `（${guestBreakdown}）` : ""}`,
    `行きたいスポット:`,
    spots?.trim() || "（記入なし）",
    ``,
    `その他ご要望:`,
    notes?.trim() || "（なし）",
    ``,
    authorized
      ? `お支払い: PayPalで $${amountStr} を仮押さえ済み（確定時に自動決済／お断り時に自動解除）`
      : `お支払い: 未設定（リクエストのみ）`,
    `受付ID: ${saved.id}`,
    `— Mokaru Guam サイトのリクエストフォームより`,
  ].join("\n");

  // --- Customer confirmation (reassuring; includes the cancel link) -----
  const cancel = cancelUrl(saved.id, SITE_URL);
  const custSubject = `【Mokaru Guam】リクエストを受け付けました（まだ請求されていません）`;
  const custText = [
    `${name} 様`,
    ``,
    `この度はリクエスト予約をありがとうございます。`,
    `内容を受け付けました。${authorized ? "現時点ではお支払いは仮押さえのみで、まだ請求されていません。" : "この時点ではまだ料金は発生していません。"}`,
    ``,
    `▼ ご予約内容`,
    `プラン:   ${planName}`,
    `ご希望日時: ${preferredDate}`,
    `ご宿泊先: ${hotel.trim()}`,
    `人数:     ${guests}名${guestBreakdown ? `（${guestBreakdown}）` : ""}`,
    authorized ? `お支払い（予定）: $${amountStr}（仮押さえ中）` : ``,
    ``,
    `▼ このあとの流れ`,
    `1. 48時間以内に、ガイド・車両の空き状況をご連絡します。`,
    `2. 予約が確定すると同時にお支払いが確定します。お手配できない場合は自動で解除・返金されますのでご安心ください。`,
    `3. ご不明な点は LINE でお気軽に：${LINE_URL}`,
    ``,
    `▼ キャンセルについて`,
    `下記リンクからいつでもキャンセルいただけます：`,
    cancel,
    `キャンセルポリシー：実施日の8日以上前=全額返金／7〜4日前=50%／3日前以降=返金なし。`,
    ``,
    `受付ID: ${saved.id}`,
    `— Mokaru Guam`,
  ]
    .filter((l) => l !== ``)
    .join("\n");

  const apiKey = process.env.RESEND_API_KEY;

  // Until the sending key is configured at launch, log so nothing is lost.
  if (!apiKey) {
    console.log(
      "[BOOKING — email not configured]\n--- BUSINESS ---\n" +
        bizText +
        "\n--- CUSTOMER ---\n" +
        custText,
    );
    return Response.json({ ok: true, delivered: false, authorized, amount: authorizedAmount, planId: planId ?? "" });
  }

  try {
    const resend = new Resend(apiKey);
    // Business notification.
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      bcc: OWNER_COPY_EMAIL,
      replyTo: email,
      subject: bizSubject,
      text: bizText,
    });
    // Customer confirmation (best-effort; a failure here shouldn't fail the request).
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        replyTo: CONTACT_EMAIL,
        subject: custSubject,
        text: custText,
      });
    } catch (custErr) {
      console.error("Failed to send customer confirmation:", custErr);
    }
    return Response.json({ ok: true, delivered: true, authorized, amount: authorizedAmount, planId: planId ?? "" });
  } catch (err) {
    console.error("Failed to send booking email:", err);
    // The request is already saved to the store, so report success to the user;
    // the owner can still see it in the Admin dashboard.
    return Response.json({ ok: true, delivered: false, authorized, amount: authorizedAmount, planId: planId ?? "" });
  }
}
