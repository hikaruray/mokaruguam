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
            アクティビティ・ツアーの手配（提携先）：
            <b className="text-ink">当社へのお支払いはありません</b>。
          </span>
          {/* 2026-10-19. The one service here that is charged when it fails —
              stated where the price is, not only under cancellation. */}
          <span className="mt-1 block">
            掲載のないツアーのお問い合わせ・予約代行：<b className="text-ink">1件 $25</b>
            （代行料。人数にかかわらず同額。実施会社とのやりとり最大3回分）。
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
          レストランのお食事代は、当日お店へ直接お支払いください。ツアー代金は、実施会社へ直接お支払いください（お問い合わせ・予約代行の場合、支払い方法は実施会社によります）。いずれも当社の手配料・代行料には含まれません。お客様側の決済手数料はかかりません。
          <span className="mt-1 block text-xs text-muted">
            8名以上のご依頼は別途お見積りとなります。
          </span>
        </>
      ),
    },
    {
      term: "支払方法",
      body: "PayPal（クレジット／デビットカード。PayPalアカウントなしでもカード決済いただけます）。レストラン予約代行、およびお問い合わせ・予約代行のみ。",
    },
    {
      term: "支払時期",
      body: (
        <>
          ご依頼時にカード情報をご入力いただきます（お預かり＝この時点では請求されません）。
          <span className="mt-1 block">
            レストラン予約代行：お席のお手配が完了した時点で手配料の決済が確定します。お取りできなかった場合はお預かりを解除し、料金は発生しません。
          </span>
          <span className="mt-1 block">
            お問い合わせ・予約代行：<b className="text-ink">1回目のご報告をお送りした時点</b>で代行料の決済が確定します。
          </span>
        </>
      ),
    },
    {
      term: "役務の提供時期",
      body: "ご依頼後、48時間以内に手配の状況をご連絡します。手配の完了時期は、お店・実施会社の回答によります。お問い合わせ・予約代行は、実施会社とのやりとり（当社が問い合わせ、返事を受け取り、お客様にご報告するまでを1回とします）を最大3回行った時点、またはそれ以前にご依頼が完了した時点で役務の提供を終えます。実施会社から返事がない間は回数に含みません。",
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
            ：当社へのお支払いがないため、当社のキャンセル料は発生しません。
            <b className="text-ink">実施会社のキャンセル料も発生しません</b>
            （提携2社に確認済み）。ご都合が悪くなった場合は、実施日の3日前までにご連絡ください。
          </span>
          {/* 🔴 2026-10-19 (owner decisions 09-18 and 10-19). The sentence
              「予約の成立を保証するものではありません」is what the fee rests on
              when no booking comes of it — this is the page with legal weight. */}
          <span className="mt-2 block">
            <b className="text-ink">掲載のないツアーのお問い合わせ・予約代行</b>
            ：本サービスは<b className="text-ink">ご予約の成立を保証するものではありません</b>。1回目のご報告をお送りする前のキャンセルは、カードのお預かりを解除し、料金は発生しません。
            <b className="text-ink">
              1回目のご報告をお送りしたあとは、ご予約に至らなかった場合も含め、代行料のご返金はいたしかねます
            </b>
            （実施会社への問い合わせという役務の提供が始まっているためです）。当社都合で役務を提供できなかった場合は全額返金します。ツアーそのもののキャンセル・返金は実施会社の規定に従い、その内容は1回目のご報告でお知らせします。参加条件（年齢・体重・持病・妊娠中など）の可否は実施会社の判断に従います。事前のカード決済が必要なツアーは、当社はお客様のカード情報をお預かりしないため、確認結果のご報告までとなります。
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
      body: "グアムのレストラン予約代行、アクティビティ・ツアーの手配（提携する実施会社のご紹介）、および提携していない実施会社のツアーのお問い合わせ・予約代行。",
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
