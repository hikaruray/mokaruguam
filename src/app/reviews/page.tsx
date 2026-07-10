import type { Metadata } from "next";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { ALL_REVIEWS } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "お客様の声",
  description:
    "グアム完全貸切ガイドチャーターをご利用いただいたお客様の声。VELTRAに寄せられた実際の高評価レビューをご紹介します。日本語ガイド・南部の絶景・柔軟な対応など。",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "お客様の声｜Mokaru Guam",
    description: "完全貸切だから自分たちのペースで。ご家族・カップル・ご友人からの実際の声。",
    url: "/reviews",
    type: "website",
  },
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="tracking-widest text-[#ffb400]" aria-label={`${rating}点`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Reviews"
        title="お客様の声"
        lead="完全貸切だから、自分たちのペースで。VELTRA に寄せられた実際のお客様の声をご紹介します。"
      />

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_REVIEWS.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              className="flex flex-col rounded-2xl border border-line bg-white p-5"
            >
              <Stars rating={r.rating} />
              <p className="mt-2 text-sm font-bold">{r.title}</p>
              <p className="my-2 flex-1 text-sm text-muted">{r.body}</p>
              <div className="text-xs font-medium text-muted">
                {r.name} 様／{r.meta}
              </div>
              <span className="mt-1 inline-block text-[11px] font-bold text-brand">
                VELTRA レビューより
              </span>
            </div>
          ))}
        </div>
      </section>

      <BookingCta
        heading="あなたも「自分たちだけ」の一日を。"
        sub="行きたいスポットを送るだけ。まずはリクエスト予約から。"
      />
    </PageShell>
  );
}
