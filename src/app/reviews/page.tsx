import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { ALL_REVIEWS } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "お客様の声",
  description:
    "2026年9月まで実施していた貸切ガイドツアーへ、VELTRAに寄せられたお客様の声です。日本語ガイド・南部の絶景・柔軟な対応など。",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "お客様の声｜Mokaru Guam",
    description: "2026年9月まで実施していた貸切ガイドツアーへの、ご家族・カップル・ご友人からの実際の声。",
    url: "/reviews",
    type: "website",
    images: [OG_IMAGE],
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
        lead="2026年9月まで実施していた貸切ガイドツアーへ、VELTRA に寄せられたお客様の声です。現在はレストラン予約代行・ツアー手配サービスとして営業しています。"
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
