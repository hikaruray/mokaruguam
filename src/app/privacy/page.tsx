import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import { COMPANY, CONTACT_EMAIL, LINE_URL, GA_ID } from "@/lib/config";

// Privacy policy.
//
// WHY THIS PAGE EXISTS
// The site takes a name, email and phone number at /reserve and charges a card,
// and until 2026-07-19 had no privacy policy at all — /legal covers 特定商取引法
// and nothing else. The old WordPress site had one; it was deliberately NOT
// reused, because it described a different stack (no Supabase, no Resend, no
// PayPal, no GA4) and republishing it would have been another "we say we do X
// but actually do Y" problem, which is exactly what the rest of this site spent
// 07-19 cleaning up.
//
// EVERY CLAIM BELOW WAS READ OUT OF THE CODE, NOT ASSUMED:
//   fields           BookingForm.tsx — note the guest count is three fields
//                    (adults / children4to11 / children0to3), so this page says
//                    so rather than rounding it to "人数"; it is information
//                    about children and should be named plainly
//   what is stored   store.ts (bookings insert)
//   who is emailed   email.ts (to / bcc OWNER_COPY_EMAIL / replyTo)
//   card handling    paypal.ts — we send amount + description only; the card is
//                    entered on PayPal's hosted page and never reaches us
//   IP use           spam.ts — in-memory rate limit, never persisted
//   analytics        config.ts — GA_ID, and ANALYTICS_ENABLED excludes previews
//   cancel links     cancel-token.ts — HMAC of the booking id
//
// If any of those change, this page is wrong and must change with them.
//
// RETENTION: 7 years after the tour date (owner decision, 2026-07-19), to match
// accounting/tax record-keeping. NOTE: there is no automated deletion in the
// code — this is a manual commitment today. See MokaruGuam/todo.md.
//
// NOT LEGAL ADVICE: drafted from the implementation, not by a lawyer, for a
// Guam company serving mostly Japanese customers. It should be reviewed before
// it is relied on.

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "Mokaru Guam（グアム完全貸切ガイドチャーター）のプライバシーポリシー。取得する情報、利用目的、保存期間、外部サービスへの提供、クレジットカード情報の取り扱いについて。",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const UPDATED = "2026年7月19日";

type Section = { heading: string; body: React.ReactNode };

export default function PrivacyPage() {
  const sections: Section[] = [
    {
      heading: "1. 事業者情報",
      body: (
        <ul className="space-y-1">
          <li>事業者名：{COMPANY.legalName}</li>
          <li>運営責任者：{COMPANY.operator}</li>
          <li>所在地：{COMPANY.address}</li>
          <li>
            連絡先：
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      ),
    },
    {
      heading: "2. 取得する情報",
      body: (
        <>
          <p>
            <Link href="/reserve" className="text-brand hover:underline">
              リクエスト予約フォーム
            </Link>
            で、以下をお預かりします。
          </p>
          <ul className="mt-3 space-y-1">
            <li>お名前</li>
            <li>メールアドレス</li>
            <li>電話番号</li>
            <li>ご希望のプラン・ツアー実施日・開始時間</li>
            <li>ご参加人数（大人、お子様〔4〜11歳／0〜3歳〕の内訳）</li>
            <li>行きたいスポット（自由記述）</li>
            <li>備考（自由記述）</li>
          </ul>
          <p className="mt-3">
            備考欄には、お子様連れ・記念日・お食事のご希望など、当日のご案内に必要な範囲でご記入ください。
            <strong>ご案内に不要な情報（健康状態や信条など）は、ご記入いただく必要はありません。</strong>
          </p>
          <p className="mt-3">
            このほか、サイトの安定運用のため、送信時のIPアドレスを短時間の連続送信の制限に利用します。
            <strong>IPアドレスをデータベースに保存することはありません。</strong>
          </p>
        </>
      ),
    },
    {
      heading: "3. クレジットカード情報について",
      body: (
        <>
          <p>
            <strong>
              当社がお客様のクレジットカード番号を受け取ること・保存することは一切ありません。
            </strong>
          </p>
          <p className="mt-3">
            お支払いはPayPal社の決済画面でお手続きいただきます。カード情報はお客様からPayPal社へ直接送信され、当社のサイトやデータベースを経由しません。当社がPayPal社へお渡しするのは
            <strong>ご請求金額とサービス名のみ</strong>で、お名前や連絡先はお渡ししていません。
            当社が保存するのは、返金などの手続きに必要なPayPal社の取引番号だけです。
          </p>
        </>
      ),
    },
    {
      heading: "4. 利用目的",
      body: (
        <ul className="space-y-1">
          <li>ご予約の受付・空き状況の確認・確定のご連絡</li>
          <li>ツアー当日のご案内、および事前のご相談への回答</li>
          <li>ご請求・ご返金の手続き</li>
          <li>キャンセルのお手続き</li>
          <li>法令にもとづく記録の保存</li>
        </ul>
      ),
    },
    {
      heading: "5. 外部サービスの利用",
      body: (
        <>
          <p>
            ご予約の受付・ご連絡・ご請求のために、以下のサービスを利用しています。いずれも当社の業務を行うために必要な範囲でのみ取り扱われ、これらの事業者がお客様の情報を独自の目的で販売・共有することはありません。
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <strong>Supabase</strong>（データベース）
              <span className="mt-0.5 block text-sm text-muted">
                お預かりしたご予約内容を保管します。
              </span>
            </li>
            <li>
              <strong>Resend</strong>（メール配信）
              <span className="mt-0.5 block text-sm text-muted">
                受付・確定・キャンセルのご連絡をお送りします。
              </span>
            </li>
            <li>
              <strong>PayPal</strong>（決済）
              <span className="mt-0.5 block text-sm text-muted">
                ご請求金額とサービス名のみをお渡しします（上記3をご覧ください）。
              </span>
            </li>
            <li>
              <strong>Vercel</strong>（サイトの配信）
              <span className="mt-0.5 block text-sm text-muted">
                サイトを表示するためのサーバーです。
              </span>
            </li>
            {GA_ID !== "" && (
              <li>
                <strong>Google アナリティクス</strong>（アクセス解析）
                <span className="mt-0.5 block text-sm text-muted">
                  どのページがよく見られているかを把握するために利用しています。Cookieを使用しますが、お名前・メールアドレス・電話番号などご予約時にお預かりした情報を送信することはありません。ブラウザの設定やGoogle社の
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    className="text-brand hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    オプトアウトアドオン
                  </a>
                  で無効にできます。
                </span>
              </li>
            )}
          </ul>
          <p className="mt-3">
            LINEでお問い合わせいただいた場合、そのトーク内容はLINEヤフー株式会社のサービス上で取り扱われます。同社の取り扱いについては同社のプライバシーポリシーをご確認ください。
          </p>
        </>
      ),
    },
    {
      heading: "6. 第三者への提供",
      body: (
        <p>
          上記5に記載した業務のために必要な場合と、法令にもとづき開示が求められる場合を除き、お客様の情報を第三者へ提供することはありません。
          <strong>お客様の情報を販売することはありません。</strong>
        </p>
      ),
    },
    {
      heading: "7. 保存期間",
      body: (
        <p>
          ご予約に関する記録は、<strong>ツアー実施日から7年間</strong>
          保存し、その後は削除します。会計および税務上の記録保存にあわせた期間です。
          この期間内であっても、削除のご希望があれば、法令上の保存義務がない範囲で対応いたします（下記8）。
        </p>
      ),
    },
    {
      heading: "8. 開示・訂正・削除のご請求",
      body: (
        <p>
          お預かりしている情報の開示・訂正・削除をご希望の場合は、
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          または
          <a href={LINE_URL} className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">
            LINE
          </a>
          までご連絡ください。ご本人であることを確認のうえ対応いたします。
        </p>
      ),
    },
    {
      heading: "9. 安全管理",
      body: (
        <ul className="space-y-1">
          <li>サイトの通信はすべて暗号化（HTTPS）しています。</li>
          <li>ご予約内容を閲覧できる管理画面は、パスワードで保護しています。</li>
          <li>
            確定メールに記載するキャンセル用リンクには署名を付けており、他のお客様のご予約を操作することはできません。
          </li>
        </ul>
      ),
    },
    {
      heading: "10. 本ポリシーの変更",
      body: (
        <p>
          内容を変更する場合は、このページを更新し、末尾の日付を改めます。重要な変更がある場合は、サイト上でお知らせします。
        </p>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHero
        eyebrow="Privacy"
        title="プライバシーポリシー"
        lead="お客様からお預かりする情報を、何のために、どこで、いつまでお預かりするかを記載しています。"
      />

      <section className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-sm text-muted">最終更新：{UPDATED}</p>

        <div className="mt-8 space-y-10">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-lg font-bold">{s.heading}</h2>
              <div className="mt-3 text-[15px] leading-relaxed text-muted">{s.body}</div>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-line pt-6 text-sm text-muted">
          お取引の条件については
          <Link href="/legal" className="text-brand hover:underline">
            特定商取引法に基づく表記
          </Link>
          、キャンセル・返金については
          <Link href="/guide" className="text-brand hover:underline">
            ご予約の流れ
          </Link>
          をあわせてご覧ください。
        </p>
      </section>
    </PageShell>
  );
}
