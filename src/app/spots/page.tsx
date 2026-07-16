import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import Image from "next/image";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { SPOTS, spotThumb } from "@/lib/spots";

export const metadata: Metadata = {
  title: "人気スポット",
  description:
    "グアムの人気スポットを日本語ガイドがご案内。恋人岬・スペイン広場・アプガン砦・エメラルドバレー・スロウウォークコーヒー。完全貸切だから行きたい場所を自由に組み合わせられます。",
  alternates: { canonical: "/spots" },
  openGraph: {
    title: "人気スポット｜Mokaru Guam",
    description: "定番から南部の自然まで。あなたの行きたい場所を自由に組み合わせて。",
    url: "/spots",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function SpotsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Popular spots"
        title="人気スポット"
        lead="定番から穴場まで。完全貸切だから、あなたの「行きたい」を自由に組み合わせてプランを作れます。"
      />

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SPOTS.map((spot) => (
            <Link
              key={spot.slug}
              href={`/spots/${spot.slug}`}
              className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={spotThumb(spot)}
                  alt={spot.name}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h2 className="font-bold group-hover:text-brand">{spot.name}</h2>
                <p className="mt-1 text-sm text-muted">{spot.tagline}</p>
                <span className="mt-2 inline-block text-xs font-bold text-brand">
                  詳しく見る →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BookingCta
        heading="行きたいスポットが決まったら、リクエスト予約へ。"
        sub="スポットを組み合わせて送るだけ。時間内に回れるかもご案内します。"
      />
    </PageShell>
  );
}
