import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { SPOTS, getSpot, spotHero } from "@/lib/spots";

// Pre-render every spot page at build time.
export function generateStaticParams() {
  return SPOTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spot = getSpot(slug);
  if (!spot) return { title: "スポットが見つかりません" };
  const desc = `${spot.name}（${spot.keyword}）を日本語ガイドの完全貸切チャーターでご案内。${spot.tagline}`;
  return {
    title: `${spot.name}｜グアムの人気スポット`,
    description: desc,
    alternates: { canonical: `/spots/${spot.slug}` },
    openGraph: {
      title: `${spot.name}｜Mokaru Guam`,
      description: desc,
      url: `/spots/${spot.slug}`,
      type: "article",
    },
  };
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spot = getSpot(slug);
  if (!spot) notFound();

  return (
    <PageShell>
      {/* Hero image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
        <Image
          src={spotHero(spot)}
          alt={spot.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-5xl px-5 pb-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffd7a8]">
            Popular spot
          </p>
          <h1 className="mt-1 text-3xl font-bold drop-shadow sm:text-4xl">
            {spot.name}
          </h1>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-lg font-bold text-brand">{spot.tagline}</p>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink">
          {spot.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-bold">こんな方におすすめ</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {spot.tips.map((t) => (
              <li key={t}>
                <span className="mr-1.5 font-bold text-brand">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm text-muted">
          ※ 写真はイメージ（仮）です。本番は実際のツアー写真に差し替えます。
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#booking"
            className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            このスポットを含めてリクエスト予約
          </Link>
          <Link
            href="/spots"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
          >
            ← 人気スポット一覧へ
          </Link>
        </div>
      </article>

      <BookingCta />
    </PageShell>
  );
}
