import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import { COMPANY, CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description:
    "Mokaru Guam（グアムのレストラン予約代行・ツアー手配）の特定商取引法に基づく表記。販売事業者・運営責任者・所在地・支払方法・キャンセル/返金について。",
  alternates: { canonical: "/legal" },
  robots: { index: true, follow: true },
};

// Each row is a term/description pair rendered as a definition list.
type Row = { term: string; body: React.ReactNode };

export default function LegalPage() {
  const rows: Row[] = [
    { term: "販売事業者名", body: COMPANY.legalName },
    { term: "運営責任者", body: COMPANY.operator },
    { term: "所在地", body: COMPANY.address },
    {
      term: "電話番号",
      body: (
        <>
          {COMPANY.phone}
          <span className="mt-1 block text-xs text-muted">
            お問い合わせはメールにて承ります。電話は緊急時のみ対応いたします。
          </span>
        </>
      ),
    },
    {
      term: "メールアドレス",
      body: (
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
          {CONTACT_EMAIL}
        </a>
      ),
    },
    {
      term: "お問い合わせ",
      body: (
        <>
          メール（
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          ）
        </>
      ),
    },
    {
      term: "販売価格",
      body: (
        <>
          レストラン予約代行：<b className="text-ink">1件 $10</b>
          （手配料。人数にかかわらず同額）。
          <span className="mt-1 block">
            アクティビティ・ツアーの手配：
            <b className="text-ink">当社へのお支払いはありません</b>。
          </span>
          <span className="mt-1 block text-xs text-muted">
            表示価格が総額です（別途消費税はかかりません）。
          </span>
          <Link href="/plans" className="mt-1 inline-block text-xs font-bold text-brand hover:underline">
            できること・料金を見る →
          </Link>
        </>
      ),
    },
    {
      term: "商品代金以外に必要な料金",
      body: (
        <>
          レストランのお食事代は、当日お店へ直接お支払いください。ツアー代金は、当日、実施会社へ直接お支払いください。いずれも当社の手配料には含まれません。お客様側の決済手数料はかかりません。
          <span className="mt-1 block text-xs text-muted">
            8名以上のご依頼は別途お見積りとなります。
          </span>
        </>
      ),
    },
    {
      term: "支払方法",
      body: "PayPal（クレジット／デビットカード。PayPalアカウントなしでもカード決済いただけます）。レストラン予約代行のみ。",
    },
    {
      term: "支払時期",
      body: "ご依頼時にカード情報をご入力いただきます（お預かり＝この時点では請求されません）。お席のお手配が完了した時点で手配料の決済が確定します。お取りできなかった場合はお預かりを解除し、料金は発生しません。",
    },
    {
      term: "役務の提供時期",
      body: "ご依頼後、48時間以内に手配の状況をご連絡します。手配の完了時期は、お店・実施会社の回答によります。",
    },
    {
      // 🔴 The governing statement of the refund rule. It said the tour ladder
      // applied to everything, which from 2026-10-01 describes a service that
      // no longer exists and contradicts what lib/refund-policy.ts actually
      // does to a restaurant booking. Of the ten places the ladder appeared,
      // this is the one with legal weight.
      term: "キャンセル・返金について",
      body: (
        <>
          <b className="text-ink">レストラン予約代行</b>
          ：お席のお手配が完了する前のキャンセルは、カードのお預かりを解除し、料金は発生しません。
          <b className="text-ink">
            お手配の完了後にお客様のご都合でキャンセルされる場合、手配料のご返金はいたしかねます
          </b>
          （お席を確保するという役務が完了しているためです）。お店へのキャンセルのご連絡は当社が代行します。お店側の都合・当社都合による場合は全額返金します。
          <span className="mt-2 block">
            <b className="text-ink">アクティビティ・ツアーの手配</b>
            ：当社へのお支払いがないため、当社のキャンセル料は発生しません。実施会社のキャンセル規定が適用される場合は、お手配の際にご案内します。
          </span>
          <span className="mt-2 block text-xs text-muted">
            2026年9月30日までにお申し込みいただいた貸切ガイドチャーターについては、お申し込み時のキャンセルポリシー（実施日の8日以上前＝全額返金／7〜4日前＝50%／3日前以降＝返金なし）を適用します。
          </span>
          <Link href="/guide" className="mt-1 inline-block text-xs font-bold text-brand hover:underline">
            ご依頼の流れ・キャンセルについて →
          </Link>
        </>
      ),
    },
    {
      term: "提供サービス",
      body: "グアムのレストラン予約代行、およびアクティビティ・ツアーの手配（提携する実施会社のご紹介）。",
    },
    {
      // 🔴 design §10-1, the owner's decision of 2026-09-11. The governing copy
      // lives here; /plans carries the same sentence as a summary so the guest
      // reads it where they actually choose. One source, two places — not two
      // wordings to keep in step.
      term: "手配サービスについて",
      body: "当社は手配を代行する立場であり、ツアーの実施者ではありません。ツアーに関する契約は、お客様と実施会社との間に成立します。レストランのご予約についても、当社はお席の手配を行うものであり、飲食の提供はお店が行います。",
    },
  ];

  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="特定商取引法に基づく表記"
        lead="特定商取引法に基づき、以下のとおり表記します。"
      />

      <section className="mx-auto max-w-3xl px-5 py-12">
        <dl className="overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((row, i) => (
            <div
              key={row.term}
              className={`grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <dt className="text-sm font-bold text-ink">{row.term}</dt>
              <dd className="text-sm text-muted">{row.body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PageShell>
  );
}
