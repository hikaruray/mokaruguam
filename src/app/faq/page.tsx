import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";

export const metadata: Metadata = {
  title: "よくある質問（FAQ）",
  description:
    "グアム完全貸切ガイドチャーターのよくある質問。行きたいスポットは時間内に回れる？所要時間の考え方、人数・料金、予約の流れ、キャンセルなどを先回りでご案内します。",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "よくある質問｜Mokaru Guam",
    description: "予約前の疑問を先回りで解消。時間内に回れる？料金は？などにお答えします。",
    url: "/faq",
    type: "website",
  },
};

// Grounded in operations.md (real inbound questions). Answers avoid asserting
// specific durations, since actual time depends on the guests (per operations.md).
const FAQS: { q: string; a: string }[] = [
  {
    q: "行きたいスポットを伝えれば、時間内に回れるか確認してもらえますか？",
    a: "はい。最も多いご相談です。行きたいスポットを教えていただければ、選んだプランの時間と移動時間を照らし合わせて、時間内に回れるかをご案内します。無理のないルートもご提案します。",
  },
  {
    q: "各スポットの所要時間の目安を教えてもらえますか？",
    a: "所要時間はお客様によって過ごし方が異なるため、一律の目安の数字はお出ししていません。ご希望のスポットと滞在の仕方をうかがったうえで、回れるかどうかを個別にご案内します。",
  },
  {
    q: "どんなスポットに行けますか？",
    a: "恋人岬、スペイン広場、アプガン砦、エメラルドバレー、スロウウォークコーヒー、アサン戦争記念公園、ビジターセンターなどが人気です。定番から南部の自然まで、ご希望に合わせて組み合わせられます。",
  },
  {
    q: "料金はどのように決まりますか？",
    a: "料金は1台あたり（1〜4名）で、時間制のプランからお選びいただきます。5〜7名は各プラン +$20。人数が増えるほど1人あたりの負担は下がります。繁忙期は別料金です。詳しくは料金・プランのページをご覧ください。",
  },
  {
    q: "何名まで参加できますか？",
    a: "セダンタイプは最大4名、バンタイプは最大7名まで1台でご参加いただけます。",
  },
  {
    q: "日本語のガイドですか？",
    a: "はい。日本語ガイドがご案内します。言葉の心配なく、写真撮影やおすすめ情報まで日本語で対応します。",
  },
  {
    q: "予約はどのように進みますか？",
    a: "リクエスト予約制です。希望日時・人数・行きたいスポットをお送りいただき、ガイド・車両の空きを確認してご連絡します（7日以内）。この時点では料金は発生しません。ご不明な点は LINE でもお気軽にご相談ください。",
  },
  {
    q: "キャンセルはできますか？",
    a: "実施日の8日以上前は全額返金、7〜4日前は50%、3日前以降は返金なしを予定しています。天候不良や当社都合による中止の場合は、全額返金または無料での日程変更に対応します。",
  },
];

export default function FaqPage() {
  // FAQPage structured data (JSON-LD) for rich results in search.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="FAQ"
        title="よくある質問"
        lead="予約前によくいただくご質問をまとめました。ここにない疑問は、LINEでお気軽にご相談ください。"
      />

      <section className="mx-auto max-w-3xl px-5 py-12">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-line bg-white p-5 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-bold">
                <span>
                  <span className="mr-2 text-brand">Q.</span>
                  {f.q}
                </span>
                <span className="mt-0.5 shrink-0 text-brand transition group-open:rotate-45">
                  ＋
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          料金の詳細は{" "}
          <Link href="/plans" className="font-bold text-brand hover:underline">
            料金・プランのページ
          </Link>
          、行き先は{" "}
          <Link href="/spots" className="font-bold text-brand hover:underline">
            人気スポットのページ
          </Link>{" "}
          もあわせてご覧ください。
        </p>
      </section>

      <BookingCta
        heading="疑問が解消したら、リクエスト予約へ。"
        sub="行きたいスポットを送るだけ。時間内に回れるかもあわせてご案内します。"
      />
    </PageShell>
  );
}
