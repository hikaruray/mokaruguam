import type { Metadata } from "next";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { VELTRA_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "お客様の声",
  description:
    "グアム完全貸切ガイドチャーターをご利用いただいたお客様の声。VELTRAに寄せられた高評価レビューをご紹介予定です（掲載許諾を確認のうえ差し替え）。",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "お客様の声｜Mokaru Guam",
    description: "完全貸切だから自分たちのペースで。ご家族・カップル・ご友人からの声。",
    url: "/reviews",
    type: "website",
  },
};

// PLACEHOLDER reviews — real VELTRA reviews replace these once transcription
// permission is confirmed. Kept consistent with the homepage Reviews section.
const REVIEWS = [
  {
    text: "子連れでも安心でした。行きたい場所を伝えるだけで完璧なルートに。ガイドさんの写真も最高！",
    who: "40代・ご家族／5時間プラン",
  },
  {
    text: "相乗りがないので自分たちのペースで回れました。エメラルドバレーは一生の思い出です。",
    who: "30代・カップル／8時間プラン",
  },
  {
    text: "初めてのグアムで不安でしたが、日本語で何でも聞けて安心。また利用します。",
    who: "20代・ご友人同士／3時間プラン",
  },
  {
    text: "南部の絶景を巡るコースにしてもらいました。歴史や文化の解説も丁寧で勉強になりました。",
    who: "50代・ご夫婦／ワンデープラン",
  },
  {
    text: "行きたいカフェや写真スポットをわがままに詰め込みましたが、上手に回してくれました。",
    who: "20代・女子旅／5時間プラン",
  },
  {
    text: "貸切なので小さな子どもがいても気兼ねなく、休憩も自由に取れて助かりました。",
    who: "30代・ご家族／3時間プラン",
  },
];

export default function ReviewsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Reviews"
        title="お客様の声"
        lead="完全貸切だから、自分たちのペースで。ご利用いただいたお客様からの声をご紹介します。"
      />

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-6 inline-block rounded-lg border border-[#ffe1a1] bg-[#fff3d6] px-3 py-1.5 text-xs text-[#9a6a00]">
          ※ 実際の口コミ文面・お名前は、VELTRA
          への掲載許諾を確認のうえ差し替えます（現在は仮の文章です）。
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-5">
              <div className="tracking-widest text-[#ffb400]">★★★★★</div>
              <p className="my-3 text-sm">「{r.text}」</p>
              <div className="text-xs font-medium text-muted">{r.who}</div>
              <span className="mt-1 inline-block text-[11px] font-bold text-brand">
                VELTRA レビューより（予定）
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          VELTRA の掲載ページでも、実際のレビューをご覧いただけます。{" "}
          <a
            href={VELTRA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand hover:underline"
          >
            VELTRAで口コミを見る →
          </a>
        </p>
      </section>

      <BookingCta
        heading="あなたも「自分たちだけ」の一日を。"
        sub="行きたいスポットを送るだけ。まずはリクエスト予約から。"
      />
    </PageShell>
  );
}
