import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { CONTACT_EMAIL, COMPANY } from "@/lib/config";

export const metadata: Metadata = {
  title: "会社案内・運営者情報",
  description:
    "Mokaru Guam は、グアム唯一の完全貸切ガイドチャーターサービス。日本語ガイド＋専用車で、行きたい場所を自由に。運営: Mokaru Guam LLC。お問い合わせは tour@mokaruguam.com。",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "会社案内・運営者情報｜Mokaru Guam",
    description: "グアム唯一の完全貸切ガイドチャーター。日本語ガイドがあなただけの一日をご案内します。",
    url: "/about",
    type: "website",
  },
};

// Company info table — real values from the owner. Rows that are still unknown
// (e.g. registration/licence numbers) are simply omitted rather than fabricated.
const INFO: { label: string; value: string }[] = [
  { label: "サービス名", value: "Mokaru Guam（モカルグアム）" },
  { label: "正式社名", value: COMPANY.legalName },
  { label: "運営責任者", value: COMPANY.operator },
  { label: "所在地", value: COMPANY.address },
  { label: "電話番号", value: `${COMPANY.phone}（緊急時のみ）` },
  { label: "事業内容", value: "グアムの完全貸切ガイドチャーターサービス" },
  { label: "対応エリア", value: "グアム" },
  { label: "予約方法", value: "自社サイトのリクエスト予約（LINEでのご相談も可）" },
  { label: "お問い合わせ", value: CONTACT_EMAIL },
  { label: "ガイド言語", value: "日本語" },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About us"
        title="会社案内・運営者情報"
        lead="Mokaru Guam は、グアムで数少ない完全貸切のガイドチャーターサービスです。決まったコースに合わせるのではなく、あなたの「行きたい」に合わせてご案内します。"
      />

      {/* Intro / positioning — grounded in overview.md */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink">
          <p>
            私たちは、日本語ガイドと専用車による<strong>完全貸切</strong>のツアーを提供しています。他のお客様との相乗りはなく、ご家族・グループだけの時間をお過ごしいただけます。
          </p>
          <p>
            グアムで同種の完全貸切ガイドチャーターを提供しているのは当社のみです。定番の観光スポットから南部の自然まで、ご希望を組み合わせて、あなただけのプランをおつくりします。
          </p>
          <p>
            ご予約は<strong>自社サイトのリクエスト予約</strong>を中心に承っています。ご不明な点は
            LINE でもお気軽にご相談ください。
          </p>
        </div>
      </section>

      {/* Info table */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h2 className="text-lg font-bold">運営者情報</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-line">
                {INFO.map((row) => (
                  <tr key={row.label} className="align-top">
                    <th className="w-40 bg-sand px-4 py-3 text-left font-medium text-muted">
                      {row.label}
                    </th>
                    <td className="px-4 py-3">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            取引条件の詳細は{" "}
            <Link href="/legal" className="font-bold text-brand hover:underline">
              特定商取引法に基づく表記
            </Link>{" "}
            をご覧ください。
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/plans" className="rounded-full border border-line bg-white px-5 py-2.5 font-medium hover:text-brand">
            料金・プラン
          </Link>
          <Link href="/guide" className="rounded-full border border-line bg-white px-5 py-2.5 font-medium hover:text-brand">
            予約の流れ・キャンセル
          </Link>
          <Link href="/legal" className="rounded-full border border-line bg-white px-5 py-2.5 font-medium hover:text-brand">
            特定商取引法に基づく表記
          </Link>
          <Link href="/reserve" className="rounded-full bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-dark">
            リクエスト予約
          </Link>
        </div>
      </section>

      <BookingCta />
    </PageShell>
  );
}
