import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";

export const metadata: Metadata = {
  title: "よくある質問（FAQ）",
  description:
    "グアムのレストラン予約代行・ツアー手配のよくある質問。手配料はいくら？取れなかったら？英語ができなくても大丈夫？渡航前に頼める？キャンセルは？を先回りでご案内します。",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "よくある質問｜Mokaru Guam",
    description: "ご依頼前の疑問を先回りで解消。手配料は？取れなかったら？などにお答えします。",
    url: "/faq",
    type: "website",
    images: [OG_IMAGE],
  },
};

// 🔴 These answers are published as FAQPage structured data (JSON-LD below), so
// search results quote them directly. Every one of the previous eight described
// the charter — its per-vehicle pricing, its 4/7-seat capacity, its Japanese
// guide, its date-based refund ladder — none of which exists from 2026-10-01.
// A wrong answer here is not just an out-of-date page; it is an out-of-date
// page that Google reads aloud.
//
// Anything about money must agree with lib/refund-policy.ts and /legal.
const FAQS: { q: string; a: string }[] = [
  {
    q: "何をしてもらえるサービスですか？",
    a: "グアムのレストランのご予約と、アクティビティ・ツアーのお手配を代行します。グアム在住の日本人スタッフが、お客様に代わってお店や実施会社とやり取りします。渡航前に、日本語だけで手配が終わります。",
  },
  {
    q: "料金はいくらですか？",
    a: "レストランの予約代行は1件 $10（手配料）です。人数にかかわらず同額で、お食事代は当日お店へ直接お支払いください。アクティビティ・ツアーの手配は、当社へのお支払いはありません。ツアー代金は当日、実施会社へお支払いください。",
  },
  {
    q: "お店の予約が取れなかった場合はどうなりますか？",
    a: "料金はいただきません。ご依頼時にカードへお預かり（仮押さえ）しますが、お取りできなかった場合は解除しますので、請求は発生しません。",
  },
  {
    q: "第1希望のお店が満席だったら？",
    a: "ご依頼の際に「キャンセルする」か「別のお店を提案してほしい」かをお選びいただきます。ご提案をご希望の場合は、現地スタッフのおすすめを1件までご提案し、ご承諾いただいてからお席をお取りします。",
  },
  {
    q: "英語ができなくても大丈夫ですか？",
    a: "はい。やり取りはすべて日本語で承ります。お店・実施会社とのやり取りは当社が行いますので、お客様が英語で連絡いただく必要はありません。",
  },
  {
    q: "いつまでに依頼すればよいですか？",
    a: "お早めにご依頼いただくほど、ご希望のお店・お時間が取りやすくなります。ご依頼後、48時間以内に手配の状況をご連絡します。お店の回答そのものはお店の都合によりますので、結果をお約束するものではありません。",
  },
  {
    q: "何名まで依頼できますか？",
    a: "1〜7名まで、フォームからご依頼いただけます。8名以上は別途お見積りとなりますので、メールでご相談ください。",
  },
  {
    q: "キャンセルはできますか？",
    a: "レストランの予約代行は、お席のお手配が完了する前であればお預かりを解除し、料金は発生しません。お手配の完了後にお客様のご都合でキャンセルされる場合は、手配料のご返金はいたしかねます（お席を確保する作業が完了しているためです）。お店へのキャンセルのご連絡は当社が代行します。ツアーの手配は当社へのお支払いがないため、当社のキャンセル料は発生しません。",
  },
  {
    q: "当日、現地でガイドは同行しますか？",
    a: "同行しません。当社は手配を代行する立場です。レストランへは直接お越しください（お席はお名前で承っています）。ツアーは実施会社のご案内に従ってください。",
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
        lead="ご依頼前によくいただくご質問をまとめました。ここにない疑問は、メールでお気軽にご相談ください。"
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
          できること・料金は{" "}
          <Link href="/plans" className="font-bold text-brand hover:underline">
            できること・料金のページ
          </Link>
          、グアムの見どころは{" "}
          <Link href="/spots" className="font-bold text-brand hover:underline">
            人気スポットのページ
          </Link>{" "}
          もあわせてご覧ください。
        </p>
      </section>

      <BookingCta
        heading="疑問が解消したら、手配のご依頼へ。"
        sub="お店の名前とご希望日時を送るだけ。あとは現地の日本人スタッフが手配します。"
      />
    </PageShell>
  );
}
