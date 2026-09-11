import { Resend } from "resend";
import {
  FROM_EMAIL,
  CONTACT_EMAIL,
  OWNER_COPY_EMAIL,
  SITE_URL,
} from "@/lib/config";
import { addBooking, refLabel } from "@/lib/store";
import { PLANS, amountForRequest } from "@/lib/pricing";
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
    // "tour" | "restaurant". Never defaulted here — see amountForRequest.
    requestType?: string;
    // The partner operator, or the restaurant (first choice).
    partnerName?: string;
    // Restaurant only: what to do if that first choice is full, and the hints
    // used to make an alternative proposal a good one.
    fallbackChoice?: string;
    budgetHint?: string;
    cuisineHint?: string;
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
    mg_field_2?: string; // honeypot — see isBot() for why it is named this
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  // Honeypot: a bot filled the hidden field. Pretend success so it doesn't
  // retry, but save nothing and send nothing.
  //
  // 🔴 Never drop a request that carries an approved PayPal order.
  //
  // A bot cannot produce one: it is minted by our server and only becomes an
  // approved order after a human completes PayPal's own flow. So its presence
  // is proof of a real guest — and on the restaurant path, a guest who has
  // ALREADY approved paying $10 by the time execution reaches this line. The
  // silent drop then leaves them certain they paid and booked, and us with no
  // request, no record and nothing to act on. Let it through to the real gates.
  if (isBot(body) && !body.paypalOrderId) {
    // 🔴 And say so. Autofill can trip this on a real person, and until now
    // that produced no evidence anywhere — the guest saw a success screen and
    // the booking simply never existed. Without a line in the log there is no
    // way to learn it is happening.
    console.error("[honeypot] dropped a booking request", {
      requestType: body.requestType,
      email: body.email,
      hasPaypalOrder: false,
    });
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

  // --- Gate 0: a new request must say which kind it is ------------------
  //
  // The database allows request_type to be NULL, but only because the four
  // bookings taken before the pivot have no answer to give. A request arriving
  // today always has one, so a missing value here means the form did not send
  // it — a bug, not an old row.
  //
  // Letting it through would fail OPEN. Everything downstream reads a missing
  // type as "tour" (requestTypeOf), and a tour costs the guest nothing, so a
  // restaurant booking whose type went missing would skip the $10 entirely and
  // slip past the authorisation check below. Refusing costs one error message;
  // accepting silently gives the arrangement away.
  const requestType =
    body.requestType === "tour" || body.requestType === "restaurant"
      ? body.requestType
      : null;
  if (requestType === null) {
    return Response.json(
      { error: "ご依頼の種類を選択してください。" },
      { status: 400 },
    );
  }

  // --- Gate 0b: a restaurant request must be arrangeable -----------------
  //
  // Two questions whose answers we cannot get later without stopping the work
  // and emailing the guest — and that pause is the one that outlives a PayPal
  // hold (design §6-4). Asking now costs a form field; asking later costs the
  // hold, and the guest a trip through /repay.
  //
  // WHICH RESTAURANT: we are about to hold $10 for the act of getting a table.
  // Not knowing where means we cannot start, and refunding is worse for
  // everyone than refusing before any money moves.
  //
  // WHAT IF IT IS FULL: the terms allow exactly one alternative proposal, and
  // whether the guest wants one at all changes what we do the moment we find
  // out. A missing answer is not a neutral default either way — "cancel" gives
  // up a booking they might have wanted, "suggest" spends their money on a
  // restaurant they did not choose.
  const partnerName = body.partnerName?.trim() ?? "";
  const fallbackChoice =
    body.fallbackChoice === "cancel" || body.fallbackChoice === "suggest"
      ? body.fallbackChoice
      : null;

  if (requestType === "restaurant") {
    if (!partnerName) {
      return Response.json(
        { error: "ご希望のお店（第1希望）をご入力ください。" },
        { status: 400 },
      );
    }
    if (fallbackChoice === null) {
      return Response.json(
        { error: "満席だった場合のご希望をお選びください。" },
        { status: 400 },
      );
    }
  }
  // 🔴 Not required on a tour, and that asymmetry is deliberate. Arranging a
  // partner activity moves no money, so an incomplete request costs one email
  // to ask what they meant — while refusing it turns away a free enquiry on the
  // strength of a form field. The gates get strict exactly where money does.

  const plan = PLANS.find((p) => p.id === planId);
  // The charter plans go away on 2026-10-01, so most requests from then on
  // carry no plan at all. Naming the row by what it IS beats「（未選択）」,
  // which is what the Admin list and every email would otherwise display.
  const planName = plan
    ? plan.name
    : requestType === "restaurant"
      ? "レストラン予約代行"
      : "ツアー手配";

  // --- PayPal path: verify + authorize before saving --------------------
  let paymentFields: {
    payment?: "authorized";
    amount?: number;
    paypalOrderId?: string;
    paypalAuthorizationId?: string;
  } = {};
  let authorizedAmount: number | null = null;

  if (body.paypalOrderId && isPaypalConfigured()) {
    // Must be the SAME function the create-order route used. If the two ever
    // disagree, the equality check below rejects every order the browser just
    // approved — the guest sees a failure on a card that was fine.
    const calc = amountForRequest(
      requestType, // validated by gate 0, not the raw body value
      planId,
      Number(guests),
      preferredDate,
    );
    if (!calc) {
      return Response.json(
        { error: "この内容ではお支払いは発生しません。" },
        { status: 400 },
      );
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

  // --- Gate 1: a restaurant request without a hold is not a request -----
  //
  // Everything above only runs when the browser sent an approved order id. If
  // it did not — the field was missing, the client skipped the PayPal step, the
  // request was posted directly — execution simply falls through to here with
  // no authorisation, and this used to save the booking and answer
  // {"ok":true,"authorized":false}. That is not theoretical: it was reproduced
  // against production on 2026-09-11 on the first try.
  //
  // A tour could survive that, because a tour was always going to be charged
  // later or not at all. The $10 cannot: there is no later. Once the request is
  // saved we go and get the table, and the only moment we could have taken the
  // fee has passed. So the failure has to happen here, before anything is
  // stored and before any work is promised.
  if (requestType === "restaurant" && !paymentFields.paypalAuthorizationId) {
    if (!isPaypalConfigured()) {
      // Not the guest's fault — say so, and do not imply their card failed.
      return Response.json(
        {
          error: `ただいまレストランのご予約代行を受け付けられません。お手数ですが ${CONTACT_EMAIL} までご連絡ください。`,
        },
        { status: 503 },
      );
    }
    return Response.json(
      { error: "お支払い情報を確認できませんでした。お手数ですが、もう一度お試しください。" },
      { status: 402 },
    );
  }

  let saved;
  try {
    saved = await addBooking({
      name,
      email,
      phone,
      requestType,
      partnerName,
      fallbackChoice,
      budgetHint: body.budgetHint?.trim() ?? "",
      cuisineHint: body.cuisineHint?.trim() ?? "",
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
    `種類:     ${requestType === "restaurant" ? "レストラン予約代行" : "ツアー手配"}`,
    // Only when an actual charter plan was chosen. Without the guard this
    // repeats the line above word for word on every post-pivot request, since
    // planName falls back to the name of the request type.
    ...(plan ? [`プラン:   ${planName}`] : []),
    ...(partnerName
      ? [
          `${requestType === "restaurant" ? "第1希望の店" : "提携先・ツアー"}: ${partnerName}`,
        ]
      : []),
    // 🔴 The owner acts on this the moment the restaurant says no, so it has to
    // be in the mail that arrives with the request — not only in the Admin
    // screen they may not have open.
    ...(requestType === "restaurant"
      ? [
          `満席の場合: ${
            fallbackChoice === "suggest"
              ? "別のお店を提案してほしい（提案は1件まで）"
              : "キャンセル（料金は請求しない）"
          }`,
          ...(body.budgetHint?.trim()
            ? [`ご予算の目安: ${body.budgetHint.trim()}`]
            : []),
          ...(body.cuisineHint?.trim()
            ? [`お料理の種類: ${body.cuisineHint.trim()}`]
            : []),
        ]
      : []),
    `希望日時: ${preferredDate}`,
    `ご宿泊先: ${hotel.trim()}`,
    `人数:     ${guests}名${guestBreakdown ? `（${guestBreakdown}）` : ""}`,
    // The wishlist field belonged to the charter, where the guest chose where
    // the car went. The form stopped asking at stage 4; the column stays for
    // the bookings that did answer, so print it only when there is an answer.
    ...(spots?.trim() ? [``, `行きたいスポット:`, spots.trim()] : []),
    ``,
    `その他ご要望:`,
    notes?.trim() || "（なし）",
    ``,
    authorized
      ? `お支払い: PayPalで $${amountStr} を仮押さえ済み（確定時に自動決済／お断り時に自動解除）`
      : `お支払い: 未設定（リクエストのみ）`,
    `受付番号: ${refLabel(saved)}`,
    `— Mokaru Guam サイトのリクエストフォームより`,
  ].join("\n");

  // --- Customer acknowledgement (design §8, mail #1) --------------------
  //
  // 🔴 This is sent to EVERY request, immediately. Three things it used to say
  // were wrong from 2026-10-01, and each was a written promise:
  //
  //   「ガイド・車両の空き状況をご連絡します」— we own neither any more. What
  //   we check is whether the shop or the partner has room.
  //
  //   「実施日の8日以上前=全額返金…」— that is the TOUR ladder. A restaurant
  //   guest was handed a written promise of a full refund 8 days out, which
  //   contradicts the terms, the cancel route and lib/refund-policy.ts all at
  //   once. The audit found the same defect on two screens; this is the copy
  //   of it that arrives by email and cannot be corrected afterwards.
  //
  //   「LINE でお気軽に」— the pivot runs on email only.
  //
  // 🔴 「48時間以内に状況を」is deliberate: a STATUS, not a result. The shop
  // answers on its own schedule and we must not promise theirs.
  const cancel = cancelUrl(saved.id, SITE_URL);
  const isRestaurant = requestType === "restaurant";
  const custSubject = isRestaurant
    ? `【Mokaru Guam】ご依頼を受け付けました（まだ請求されていません）`
    : `【Mokaru Guam】ご依頼を受け付けました`;

  const flow = isRestaurant
    ? [
        `1. これからお店にお席の空きを確認します。48時間以内に状況をご連絡します。`,
        `2. お席が取れた時点で手配料 $${amountStr} のお支払いが確定します。`,
        `3. お取りできなかった場合、料金はいただきません（カードのお預かりを解除します）。`,
        `4. お食事代はお店で直接お支払いください。`,
      ]
    : [
        `1. これから実施会社に空き状況を確認します。48時間以内に状況をご連絡します。`,
        `2. 当社へのお支払いはありません。ツアー代金は当日、実施会社へお支払いください。`,
        `3. お手配できなかった場合も、料金は一切発生しません。`,
      ];

  // The cancellation line differs by what was bought, for the same reason the
  // cancel page and the Admin buttons now differ: the arrangement fee buys the
  // act of getting the table, and that work cannot be resold once it is done.
  const cancelLines = isRestaurant
    ? [
        `▼ キャンセルについて`,
        `下記リンクからキャンセルいただけます：`,
        cancel,
        `お席のお手配が完了したあとのキャンセルは、手配料のご返金はいたしかねます。お店へのご連絡は当社が代行しますので、お客様からご連絡いただく必要はありません。`,
      ]
    : [
        `▼ キャンセルについて`,
        `下記リンクからキャンセルいただけます：`,
        cancel,
        `当社へのお支払いがないため、キャンセル料も発生しません。実施会社の規定がある場合は、お手配の際にご案内します。`,
      ];

  const custText = [
    `${name} 様`,
    ``,
    `この度はご依頼をありがとうございます。内容を受け付けました。`,
    authorized
      ? `現時点では手配料のお預かり（仮押さえ）のみで、まだ請求されていません。`
      : `この時点では料金は発生していません。`,
    ``,
    `▼ ご依頼の内容`,
    `種類:     ${isRestaurant ? "レストランの予約代行" : "アクティビティ・ツアーの手配"}`,
    ...(partnerName
      ? [`${isRestaurant ? "お店:     " : "お手配先: "}${partnerName}`]
      : []),
    `ご希望日時: ${preferredDate}`,
    `ご滞在先: ${hotel.trim()}`,
    `人数:     ${guests}名${guestBreakdown ? `（${guestBreakdown}）` : ""}`,
    ...(authorized ? [`手配料:   $${amountStr}（お預かり中・未請求）`] : []),
    ``,
    `▼ このあとの流れ`,
    ...flow,
    ``,
    ...cancelLines,
    ``,
    `ご不明な点は ${CONTACT_EMAIL} までご返信ください。`,
    `受付番号: ${refLabel(saved)}`,
    `— Mokaru Guam`,
  ].join("\n");

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
