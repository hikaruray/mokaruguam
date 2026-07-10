// Customer-facing email copy for booking status changes.
//
// Pure builders: each returns { subject, text } from a booking (+ context) so
// the wording lives in one place and is easy to review/tweak. Sending is done
// by lib/email.ts. Tone: reassuring and unambiguous about money — the customer
// should always know exactly whether they were charged / refunded.

import type { BookingRequest } from "./store";
import { LINE_URL } from "./config";

// Booking confirmed (予約確定 → payment captured).
export function confirmedEmail(
  b: BookingRequest,
  amount: number,
): { subject: string; text: string } {
  return {
    subject: "【Mokaru Guam】ご予約が確定しました",
    text: [
      `${b.name} 様`,
      ``,
      `この度はMokaru Guamをご利用いただきありがとうございます。`,
      `ご予約が確定しました。当日は日本語ガイドがご案内いたします。`,
      ``,
      `▼ ご予約内容`,
      `プラン:     ${b.planName}`,
      `ご希望日時: ${b.preferredDate}`,
      `人数:       ${b.guests}名`,
      `お支払い:   $${amount.toFixed(2)}（決済確定済み）`,
      ``,
      `開始時間の少し前にお集まりください。当日を楽しみにお待ちしております。`,
      `ご不明な点や当日のご連絡は LINE でお気軽に：${LINE_URL}`,
      ``,
      `受付ID: ${b.id}`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}

// Booking declined (お断り → authorization voided, no charge).
export function declinedEmail(b: BookingRequest): {
  subject: string;
  text: string;
} {
  return {
    subject: "【Mokaru Guam】ご予約についてのお知らせ",
    text: [
      `${b.name} 様`,
      ``,
      `この度はリクエスト予約をいただきありがとうございました。`,
      `誠に恐れ入りますが、ご希望の日時はガイド・車両の都合によりお手配ができませんでした。`,
      ``,
      `▼ お支払いについて`,
      `カードの仮押さえは解除しており、ご請求は発生しておりません。ご安心ください。`,
      ``,
      `別の日程であればご案内できる場合がございます。ぜひ LINE よりお気軽にご相談ください：${LINE_URL}`,
      ``,
      `▼ 対象のリクエスト`,
      `プラン:     ${b.planName}`,
      `ご希望日時: ${b.preferredDate}`,
      `受付ID:     ${b.id}`,
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
  } else if (b.payment === "captured") {
    // Charged, but 0% refund tier — the charge stands.
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
      `人数:       ${b.guests}名`,
      `受付ID:     ${b.id}`,
      ``,
      ...moneyLines,
      ``,
      `またのご利用を心よりお待ちしております。ご不明な点は LINE でお気軽に：${LINE_URL}`,
      `— Mokaru Guam`,
    ].join("\n"),
  };
}
