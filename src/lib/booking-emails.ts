// Customer-facing email copy for booking status changes.
//
// Pure builders: each returns { subject, text } from a booking (+ context) so
// the wording lives in one place and is easy to review/tweak. Sending is done
// by lib/email.ts. Tone: reassuring and unambiguous about money — the customer
// should always know exactly whether they were charged / refunded.

import {
  requestTypeOf,
  chargedAmount,
  refLabel,
  guestBreakdownLabel,
  type BookingRequest,
} from "./store";
import { CONTACT_EMAIL } from "./config";
import { GUAM_UTC_OFFSET_HOURS } from "./pricing";

// Booking confirmed (予約確定 → payment captured for a restaurant, or the
// arrangement simply agreed for a tour).
//
// 🔴 The payment line is a branch, not wording. It used to print
// 「お支払い: $X（決済確定済み）」unconditionally, so a partner-tour
// arrangement — free to the guest, and by design carrying no amount — told the
// guest in writing that they had been charged. Never state a figure on a path
// where no money moved.
export function confirmedEmail(
  b: BookingRequest,
  amount: number,
): { subject: string; text: string } {
  const isRestaurant = requestTypeOf(b) === "restaurant";
  // Pre-pivot charter bookings keep exactly the line they always had.
  const isLegacyCharter = b.requestType === null;

  const paymentLine = isRestaurant
    ? [`手配料:     $${amount.toFixed(2)}（お支払い済み）`]
    : isLegacyCharter
      ? [`お支払い:   $${amount.toFixed(2)}（決済確定済み）`]
      : // Partner tour: we arranged it, the operator is paid on the day.
        [`お支払い:   当社へのお支払いはございません（ツアー代金は当日、実施会社へお支払いください）`];

  const closingLine = isLegacyCharter
    ? `開始時間の少し前にお集まりください。当日を楽しみにお待ちしております。`
    : isRestaurant
      ? `当日は直接お店へお越しください。お席はお名前で承っております。`
      : `当日の集合場所・持ち物は、実施会社のご案内に従ってください。`;

  return {
    subject: isLegacyCharter
      ? "【Mokaru Guam】ご予約が確定しました"
      : "【Mokaru Guam】お手配が完了しました",
    text: [
      `${b.name} 様`,
      ``,
      `この度はMokaru Guamをご利用いただきありがとうございます。`,
      isLegacyCharter
        ? `ご予約が確定しました。当日は日本語ガイドがご案内いたします。`
        : `ご予約のお手配が完了しました。`,
      ``,
      `▼ ご予約内容`,
      `${isLegacyCharter ? "プラン:    " : "お手配先:  "} ${b.partnerName || b.planName}`,
      `ご希望日時: ${b.preferredDate}`,
      ...(b.hotel ? [`ご宿泊先:   ${b.hotel}`] : []),
      `人数:       ${b.guests}名`,
      ...paymentLine,
      ``,
      closingLine,
      `ご不明な点や当日のご連絡は ${CONTACT_EMAIL} までご返信ください。`,
      ``,
      `受付番号: ${refLabel(b)}`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}

// A replacement hold was taken after the first one expired (/repay).
//
// 🔴 This email must not read like a confirmation. Nothing is arranged yet at
// the moment it is sent: under design §6-4-1 the hold has to exist BEFORE we
// ring the restaurant, so at this point we have the guest's money on hold and
// no table. Wording that implied otherwise would have them turn up to a seat
// nobody reserved.
export function reauthorizedEmail(
  b: BookingRequest,
  amount: number,
): { subject: string; text: string } {
  return {
    subject: "【Mokaru Guam】お支払い手続きを承りました（お手配はこれからです）",
    text: [
      `${b.name} 様`,
      ``,
      `お支払いのお手続きをいただき、ありがとうございます。`,
      `手配料 $${amount.toFixed(2)} をカードにお預かり（仮押さえ）しました。この時点ではまだ請求されていません。`,
      ``,
      `▼ ご依頼の内容`,
      ...(b.partnerName ? [`お手配先:   ${b.partnerName}`] : []),
      `ご希望日時: ${b.preferredDate}`,
      `人数:       ${b.guests}名`,
      ``,
      `▼ このあとの流れ`,
      `1. これからお店へお席の確保をご依頼します。`,
      `2. お席が取れた時点で手配料のお支払いが確定し、確定のご連絡をお送りします。`,
      `3. お席をご用意できなかった場合は、仮押さえを解除します。ご請求は発生しません。`,
      ``,
      `受付番号: ${refLabel(b)}`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}

// The same event, told to the owner — this is the go-ahead to ring the
// restaurant, and nothing else tells them it arrived.
export function reauthorizedOwnerEmail(
  b: BookingRequest,
  amount: number,
): { subject: string; text: string } {
  return {
    subject: `【再オーソリ成立】${b.name} 様／${b.partnerName || "レストラン予約代行"}`,
    text: [
      `カードのお預かりを取り直せました。お店への予約はここから進めてください。`,
      ``,
      `お名前:   ${b.name}`,
      `連絡先:   ${b.email} / ${b.phone}`,
      `お手配先: ${b.partnerName || "（未記入）"}`,
      `希望日時: ${b.preferredDate}`,
      `人数:     ${b.guests}名`,
      `手配料:   $${amount.toFixed(2)}（仮押さえ中・未請求）`,
      ``,
      `お席が取れたら管理画面で「確定」を押すと手配料が確定します。`,
      `取れなかった場合は「お断り」で仮押さえを解除してください。`,
      ``,
      `受付番号: ${refLabel(b)}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// The 48-hour status mail (design §8 #3)
// ---------------------------------------------------------------------------
// The acknowledgement promises「48時間以内に状況をご連絡します」— the STATE, not
// the result. There are three states to report, and one of them already has a
// mail: 確定 is confirmedEmail. These are the other two.
//
// Both are sent by hand from the admin screen and change nothing about the
// booking. Neither may say anything that sounds like a result.

// Still waiting on the restaurant or operator.
export function waitingEmail(b: BookingRequest): { subject: string; text: string } {
  const isRestaurant = requestTypeOf(b) === "restaurant";
  return {
    subject: "【Mokaru Guam】ご依頼の状況のお知らせ（お手配を進めています）",
    text: [
      `${b.name} 様`,
      ``,
      `ご依頼をいただきありがとうございます。現在の状況をお知らせします。`,
      ``,
      isRestaurant
        ? `お店へご予約をお願いしており、お返事を待っているところです。`
        : `実施会社へ空き状況を確認しており、お返事を待っているところです。`,
      `お返事がありしだい、あらためてご連絡します。`,
      ``,
      `▼ お支払いについて`,
      isRestaurant
        ? `手配料はカードにお預かり（仮押さえ）したままで、まだご請求していません。お席が取れた時点で確定します。`
        : `当社へのお支払いはございません。`,
      ``,
      `▼ ご依頼の内容`,
      `お手配先:   ${b.partnerName}`,
      `ご希望日時: ${b.preferredDate}`,
      `人数:       ${b.guests}名`,
      `受付番号:   ${refLabel(b)}`,
      ``,
      `ご不明な点は ${CONTACT_EMAIL} までご返信ください。`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}

// First choice full; proposing the one alternative the guest asked for.
//
// 🔴 Two sentences in here are load-bearing, both from design §6-4-1:
//
//  1. THE REPLY DEADLINE, as a date. A PayPal hold lives about three days. A
//     guest who answers on day five has let it expire, and the order the owner
//     chose on 2026-09-11 is: get a live hold first, THEN book the table. So
//     the deadline is not politeness; it is the hold's lifetime, told to the
//     one person who can keep it alive.
//
//  2. "CARD DETAILS MAY BE ASKED FOR AGAIN AFTER YOU REPLY, AND WE BOOK ONLY
//     ONCE THAT IS DONE." Without it, a guest who replies「それでお願いします」
//     reasonably believes the table is theirs. It is not — and v2 of the design
//     showed that booking first is how a table ends up held for $0.
//
// Asserted in check:gates by content, because a later tidy-up that shortens
// this mail is exactly how either sentence would quietly go.
export function proposalEmail(
  b: BookingRequest,
  proposal: string,
  now: Date = new Date(),
): { subject: string; text: string } {
  const replyBy = guamDateLabel(now, 2);
  return {
    subject: "【Mokaru Guam】ご希望のお店が満席でした（代わりのご提案）",
    text: [
      `${b.name} 様`,
      ``,
      `ご依頼をいただきありがとうございます。`,
      `誠に恐れ入りますが、ご希望のお店「${b.partnerName}」は、ご希望のお日にち・お時間で満席でした。`,
      ``,
      `お申し込みの際に「満席の場合はおすすめを提案してほしい」とご選択いただいていましたので、代わりに次のお店をご提案します。`,
      ``,
      `▼ ご提案`,
      proposal,
      ``,
      `▼ お返事のお願い`,
      `${replyBy}までに、このメールへのご返信でお知らせください。`,
      `・このお店でよい場合：「提案のお店でお願いします」`,
      `・見送る場合：「キャンセルします」（手配料はいただきません）`,
      ``,
      `※ ご返事をいただいたあと、カードのお手続きを再度お願いする場合があります（その際はご案内のリンクをお送りします）。`,
      `お手続きが済んでから、お店へご予約を入れます。ご返事の時点ではまだお席は確保されていませんので、ご注意ください。`,
      `お返事が${replyBy}を過ぎますと、カードのお預かりが一度無効になり、再度のご入力が必要になります。`,
      ``,
      `▼ お支払いについて`,
      `現時点でご請求は発生していません。お席が取れなかった場合・見送られた場合も、手配料はいただきません。`,
      ``,
      `▼ ご依頼の内容`,
      `ご希望日時: ${b.preferredDate}`,
      `人数:       ${b.guests}名`,
      `受付番号:   ${refLabel(b)}`,
      ``,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}

// "10月17日（土）" for the Guam calendar date `days` from `now`.
function guamDateLabel(now: Date, days: number): string {
  const guam = new Date(now.getTime() + GUAM_UTC_OFFSET_HOURS * 3600_000);
  const d = new Date(
    Date.UTC(guam.getUTCFullYear(), guam.getUTCMonth(), guam.getUTCDate() + days),
  );
  const dow = "日月火水木金土"[d.getUTCDay()];
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${dow}）`;
}

// The request we send the partner operator or restaurant (design §8 #7).
//
// 🔴 THE SUBJECT LINE IS A FORMAT, NOT WORDING.
//
//   [Mokaru] 予約依頼 / Joe's Jet Ski / 2026-10-15 / 山田 / #0012
//
// The commission is 20% of bookings WE sent, reconciled at month end against
// the partner's own records. That reconciliation is a search for「[Mokaru]」in
// their inbox, and then pointing at one booking at a time by its number. Every
// field in the subject is there so that list can be read without opening a
// single mail. Change the order or the separators and last month's mails and
// this month's stop lining up. check:gates asserts the exact string.
//
// What is deliberately NOT in this mail: the guest's email address and phone
// number. The partner answers us (reply-to is our address), we answer the
// guest. That keeps the booking in our records — which is what the commission
// rests on — and keeps a guest's contact details out of an inbox they never
// agreed to be in.
//
// Bilingual because the recipients are. Gently Blue is a Japanese shop; Joe's
// Jet Ski and almost every restaurant in Tumon work in English.
export function partnerDispatchEmail(b: BookingRequest): {
  subject: string;
  text: string;
} {
  const isRestaurant = requestTypeOf(b) === "restaurant";
  const company = partnerCompany(b.partnerName);
  // "2026-10-15 18:00" -> "2026-10-15". The form always sends the date first.
  const day = b.preferredDate.trim().split(/\s+/)[0] || b.preferredDate;
  // Family name only: the full name is in the body, and the subject is a list
  // someone scans.
  // U+3000 is the full-width space most Japanese keyboards type between names.
  const surname = b.name.trim().split(/[\s　]+/)[0] || b.name;
  const ref = refLabel(b);

  return {
    subject: `[Mokaru] 予約依頼 / ${company} / ${day} / ${surname} / ${ref}`,
    text: [
      `${company} ご担当者様 / Dear ${company} team,`,
      ``,
      `いつもお世話になっております。Mokaru Guam です。`,
      `下記の内容でご予約をお願いできますでしょうか。`,
      `We would like to request the following booking.`,
      ``,
      `受付番号 / Reference:   ${ref}`,
      isRestaurant
        ? `お店 / Restaurant:      ${b.partnerName}`
        : `ご依頼 / Activity:      ${b.partnerName}`,
      `希望日時 / Date & time: ${b.preferredDate}`,
      `人数 / Guests:          ${b.guests}名 / ${b.guests} guest(s)`,
      // The ages are the point for a partner: dives and jet skis have limits.
      // Old rows have no split, and saying nothing beats guessing "all adults".
      ...(b.adults != null
        ? [
            `内訳 / Breakdown:       ${guestBreakdownLabel(b)} / ${[
              `${b.adults} adult(s)`,
              b.children4to11 ? `${b.children4to11} child(ren) aged 4-11` : "",
              b.children0to3 ? `${b.children0to3} child(ren) aged 0-3` : "",
            ]
              .filter(Boolean)
              .join(", ")}`,
          ]
        : []),
      `お名前 / Guest name:    ${b.name}`,
      ...(b.hotel ? [`ご滞在先 / Hotel:       ${b.hotel}`] : []),
      ...(b.notes ? [`ご要望 / Requests:      ${b.notes}`] : []),
      ``,
      `空き状況を、このメールへのご返信でお知らせください。`,
      `お客様へのご連絡は当社から行います。`,
      `Please reply to this email with availability. We will pass the answer on to the guest.`,
      ``,
      `お問い合わせの際は受付番号 ${ref} をお伝えください。`,
      `Please quote ${ref} in any correspondence about this booking.`,
      ``,
      `— Mokaru Guam`,
      `${CONTACT_EMAIL}`,
    ].join("\n"),
  };
}

// The company part of a partnerName. Requests from /plans arrive as
// 「company／activity」(partnerRequestLabel); anything typed by hand is used
// whole. The subject needs the company, the body keeps the full string.
export function partnerCompany(partnerName: string): string {
  return partnerName.split("／")[0].trim() || partnerName.trim();
}

// Booking declined (お断り → authorization voided, no charge).
//
// 🔴 Branches, like confirmedEmail. It used not to, and so told a restaurant
// guest their table had fallen through「ガイド・車両の都合により」— citing a
// guide and a vehicle the company stopped having on 2026-09-30. This is the one
// message that arrives when we have failed at something, and explaining that
// failure with a reason that cannot be true is the worst place to do it. Email
// cannot be taken back.
export function declinedEmail(b: BookingRequest): {
  subject: string;
  text: string;
} {
  const isRestaurant = requestTypeOf(b) === "restaurant";
  const isLegacyCharter = b.requestType === null;

  const reason = isRestaurant
    ? `誠に恐れ入りますが、ご希望のお日にち・お時間でお席をご用意できませんでした。`
    : isLegacyCharter
      ? `誠に恐れ入りますが、ご希望の日時はガイド・車両の都合によりお手配ができませんでした。`
      : `誠に恐れ入りますが、実施会社の空き状況によりお手配ができませんでした。`;

  const moneyLine = isRestaurant
    ? `手配料はいただきません。カードのお預かりは解除しており、ご請求は発生しておりません。`
    : isLegacyCharter
      ? `カードの仮押さえは解除しており、ご請求は発生しておりません。ご安心ください。`
      : `当社へのお支払いはもとより発生しておりません。ご請求は一切ございません。`;

  const nextLine = isRestaurant
    ? `別のお店・別のお時間であればお取りできる場合がございます。よろしければご返信ください。`
    : `別の日程や他の実施会社であればご案内できる場合がございます。よろしければご返信ください。`;

  return {
    subject: "【Mokaru Guam】ご依頼についてのお知らせ",
    text: [
      `${b.name} 様`,
      ``,
      `この度はご依頼をいただきありがとうございました。`,
      reason,
      ``,
      `▼ お支払いについて`,
      moneyLine,
      ``,
      nextLine,
      ``,
      `▼ 対象のご依頼`,
      `${isLegacyCharter ? "プラン:    " : "お手配先:  "} ${b.partnerName || b.planName}`,
      `ご希望日時: ${b.preferredDate}`,
      ...(b.hotel ? [`ご滞在先:   ${b.hotel}`] : []),
      `受付番号:   ${refLabel(b)}`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}

// Booking cancelled. Wording depends on whether/what was charged, driven by the
// post-cancel payment state + refund result, so the customer is never left
// wondering about money.
export function cancelledEmail(
  b: BookingRequest,
  refund: { rate: number; amount: number } | null,
): { subject: string; text: string } {
  let moneyLines: string[];
  if (refund && refund.rate > 0) {
    // Refund issued (full or partial).
    moneyLines = [
      `▼ 返金について`,
      `キャンセルポリシーに基づき、返金率 ${Math.round(refund.rate * 100)}%（$${refund.amount.toFixed(2)}）で返金手続きを行いました。`,
      `ご利用の決済方法に、数営業日でご返金が反映されます。`,
    ];
  } else if (b.payment === "captured" && requestTypeOf(b) === "restaurant") {
    // Charged, no refund — but for a completely different reason than a tour,
    // so it must not cite the tour's 3-day rule. The arrangement fee bought the
    // act of getting the table, and that work is done. We still tell the
    // restaurant ourselves: leaving the guest to do it means a no-show in our
    // name, which costs more than the $10.
    moneyLines = [
      `▼ 手配料について`,
      `お席のお手配が完了しているため、手配料 $${chargedAmount(b).toFixed(2)} のご返金はいたしかねます。あらかじめご了承ください。`,
      ``,
      `▼ お店へのご連絡`,
      `キャンセルのご連絡は、当社からお店へお伝えします。お客様からご連絡いただく必要はございません。`,
    ];
  } else if (b.payment === "captured") {
    // Charged, but 0% refund tier — the charge stands. Tours only.
    moneyLines = [
      `▼ 返金について`,
      `キャンセルポリシー（実施日の3日前以降）により、今回はご返金の対象外です。`,
      `お支払い済みの料金はそのままとなります。あらかじめご了承ください。`,
    ];
  } else {
    // Hold released (voided) or request-only — never actually charged.
    moneyLines = [
      `▼ お支払いについて`,
      `ご請求は発生しておりません（カードの仮押さえがあった場合も解除済みです）。ご安心ください。`,
    ];
  }

  return {
    subject: "【Mokaru Guam】ご予約のキャンセルを承りました",
    text: [
      `${b.name} 様`,
      ``,
      `ご予約のキャンセルを承りました。`,
      ``,
      `▼ 対象のご予約`,
      `プラン:     ${b.planName}`,
      `ご希望日時: ${b.preferredDate}`,
      ...(b.hotel ? [`ご宿泊先:   ${b.hotel}`] : []),
      `人数:       ${b.guests}名`,
      `受付番号:   ${refLabel(b)}`,
      ``,
      ...moneyLines,
      ``,
      `またのご利用を心よりお待ちしております。ご不明な点は ${CONTACT_EMAIL} までご返信ください。`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}
