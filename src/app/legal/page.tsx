import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import { COMPANY, CONTACT_EMAIL, LINE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description:
    "Mokaru Guam（グアム完全貸切ガイドチャーター）の特定商取引法に基づく表記。販売事業者・運営責任者・所在地・支払方法・キャンセル/返金について。",
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
            お問い合わせはメール／LINEにて承ります。電話は緊急時のみ対応いたします。
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
          ）／
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            LINE公式アカウント
          </a>
        </>
      ),
    },
    {
      term: "販売価格",
      body: (
        <>
          各プランページに表示（3時間 $170〜／5時間 $250〜／8時間 $345〜／ワンデー
          $500〜、USD）。
          <span className="mt-1 block text-xs text-muted">
            表示価格が総額です（別途消費税はかかりません）。
          </span>
          <Link href="/plans" className="mt-1 inline-block text-xs font-bold text-brand hover:underline">
            料金・プランを見る →
          </Link>
        </>
      ),
    },
    {
      term: "商品代金以外に必要な料金",
      body: "5〜7名は各プラン +$20／繁忙期（GW・夏休み・シルバーウィーク・年末年始）は別料金です。お客様側の決済手数料はかかりません。",
    },
    {
      term: "支払方法",
      body: "PayPal（クレジット／デビットカード。PayPalアカウントなしでもカード決済いただけます）。",
    },
    {
      term: "支払時期",
      body: "リクエスト予約時にカード情報をご入力いただきます（仮押さえ＝この時点では請求されません）。予約確定と同時に全額の決済が確定します。お手配できない場合は自動で解除されます。",
    },
    {
      term: "役務の提供時期",
      body: "予約確定後、お客様がご指定の日時にツアーを実施します。",
    },
    {
      term: "キャンセル・返金について",
      body: (
        <>
          実施日基準（グアム時間）。8日以上前＝全額返金／7〜4日前＝50%返金／3日前以降（当日・無連絡含む）＝返金なし。天候不良・当社都合による中止＝全額返金または無料日程変更。
          <Link href="/guide" className="mt-1 inline-block text-xs font-bold text-brand hover:underline">
            予約の流れ・キャンセルポリシー →
          </Link>
        </>
      ),
    },
    {
      term: "提供サービス",
      body: "グアムの完全貸切ガイドチャーター（日本語ガイド＋専用車）。",
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
