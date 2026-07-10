import { Eyebrow, SectionHeading, Sub } from "./Section";
import { FEATURED_REVIEWS } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="tracking-widest text-[#ffb400]" aria-label={`${rating}点`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </div>
  );
}

export default function Reviews() {
  return (
    <section id="reviews" className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <Eyebrow>Reviews</Eyebrow>
        <SectionHeading>お客様の声</SectionHeading>
        <Sub>VELTRA に寄せられた実際のお客様の声をご紹介します。</Sub>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_REVIEWS.map((r) => (
            <div key={r.name} className="rounded-2xl border border-line p-5">
              <Stars rating={r.rating} />
              <p className="mt-2 text-sm font-bold">{r.title}</p>
              <p className="my-2 line-clamp-5 text-sm text-muted">{r.body}</p>
              <div className="text-xs font-medium text-muted">
                {r.name} 様／{r.meta}
              </div>
              <span className="mt-1 inline-block text-[11px] font-bold text-brand">
                VELTRA レビューより
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <a
            href="/reviews"
            className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:text-brand"
          >
            お客様の声をもっと見る →
          </a>
        </div>
      </div>
    </section>
  );
}
