import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { CONTACT_EMAIL, COMPANY } from "@/lib/config";

export const metadata: Metadata = {
  title: "会社案内・運営者情報",
  description:
    "Mokaru Guam は、グアムのレストラン予約代行・アクティビティ手配サービス。グアム在住の日本人スタッフが代わりに手配します。運営: Mokaru Guam LLC。お問い合わせは tour@mokaruguam.com。",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "会社案内・運営者情報｜Mokaru Guam",
    description: "グアムのレストラン予約代行・アクティビティ手配。渡航前に日本語で手配できます。",
    url: "/about",
    type: "website",
    images: [OG_IMAGE],
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
  {
    label: "事業内容",
    value:
      "グアムのレストラン予約代行／アクティビティ・ツアーの手配（提携する実施会社のご紹介）",
  },
  { label: "対応エリア", value: "グアム" },
  { label: "ご依頼方法", value: "自社サイトのご依頼フォーム（メール）" },
  { label: "お問い合わせ", value: CONTACT_EMAIL },
  // 🔴 「ガイド言語」is deleted, not translated: we no longer supply a guide.
  // Leaving the row would answer a question about a service that ended.
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About us"
        title="会社案内・運営者情報"
        lead="Mokaru Guam は、グアムのレストラン予約とアクティビティの手配を代行します。グアム在住の日本人スタッフが、お客様に代わってお店や実施会社とやり取りします。"
      />

      {/* Intro / positioning */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink">
          <p>
            人気のお店ほど、予約に英語での電話が必要だったり、現地の事情を知らないと取りにくかったりします。私たちは、その一手間を
            <strong>お客様に代わって引き受ける</strong>サービスです。
          </p>
          <p>
            レストランのご予約は<strong>1件 $10</strong>の手配料。お席をお取りできなかった場合、料金はいただきません。アクティビティ・ツアーは提携する実施会社をご紹介・手配し、
            <strong>当社へのお支払いはありません</strong>（ツアー代金は当日、実施会社へお支払いください）。
          </p>
          <p>
            当社は手配を代行する立場であり、ツアーの実施者ではありません。ツアーに関する契約は、お客様と実施会社との間に成立します。
          </p>
          <p>
            {/* 2026-09-30 まで運行していた貸切ツアーの実績は /reviews に出典つきで
                残してある。ここで触れるのは沿革として事実だから。 */}
            2026年9月30日までは、日本語ガイドと専用車による貸切ツアーを運行していました。当時のお客様の声は
            <Link href="/reviews" className="font-bold text-brand hover:underline">お客様の声</Link>のページに、出典つきで掲載しています。
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
            できること・料金
          </Link>
          <Link href="/guide" className="rounded-full border border-line bg-white px-5 py-2.5 font-medium hover:text-brand">
            ご依頼の流れ・キャンセル
          </Link>
          <Link href="/legal" className="rounded-full border border-line bg-white px-5 py-2.5 font-medium hover:text-brand">
            特定商取引法に基づく表記
          </Link>
          <Link href="/reserve" className="rounded-full bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-dark">
            手配を依頼する
          </Link>
        </div>
      </section>

      <BookingCta />
    </PageShell>
  );
}
