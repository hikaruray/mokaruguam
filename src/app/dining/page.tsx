import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { OG_IMAGE } from "@/lib/images";
import { RESTAURANT_FEE } from "@/lib/pricing";
import { RESTAURANTS, RESTAURANTS_CHECKED_ON } from "@/lib/restaurants";

// Not /restaurants: that URL is a 2025 legacy article that still draws search
// traffic, and after the 2026-07-16 DNS switch 404'd 125 of them, no live URL
// gets taken over without the owner deciding to.
export const metadata: Metadata = {
  title: "Mokaruおすすめのレストラン",
  description: `グアム在住のMokaruスタッフがおすすめするレストラン。ステーキ・シーフード・ハワイアンなど。予約は日本語で代行します（1件$${RESTAURANT_FEE}、お取りできなければ料金はいただきません）。`,
  alternates: { canonical: "/dining" },
  openGraph: {
    title: "Mokaruおすすめのレストラン｜Mokaru Guam",
    description: `グアム在住スタッフのおすすめ。予約は日本語で代行（1件$${RESTAURANT_FEE}）。`,
    url: "/dining",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function DiningPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Mokaru's picks"
        title="Mokaruおすすめのレストラン"
        lead="グアムに住む私たちが、実際に通っているお店です。気になるお店があれば、予約は日本語のまま当社が代わりに入れます。"
      />

      <section className="mx-auto max-w-5xl px-5 pt-10">
        <div className="rounded-2xl border-2 border-brand bg-white p-5 text-sm">
          <p>
            <b>予約の代行は1件 ${RESTAURANT_FEE}</b>（人数にかかわらず同額）。
            <b className="text-brand">お取りできなかった場合、料金はいただきません。</b>
          </p>
          <p className="mt-1 text-muted">
            お食事代は当日、お店へ直接お支払いください。
            <Link href="/guide" className="ml-1 font-bold text-brand hover:underline">
              キャンセルについて →
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {RESTAURANTS.map((r) => (
            <div
              key={r.id}
              id={r.id}
              className="flex scroll-mt-24 flex-col rounded-2xl border border-line bg-white p-6"
            >
              <p className="text-xs font-bold text-brand">{r.genre}</p>
              <h2 className="mt-1 text-lg font-bold">{r.name}</h2>
              <p className="text-sm text-muted">{r.nameJa}</p>
              <p className="mt-2 text-xs text-muted">📍 {r.area}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink">{r.blurb}</p>
              {r.bookingNote && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  ! {r.bookingNote}
                </p>
              )}
              {/* Pushes the button to the card's bottom so a row lines up. */}
              <div className="flex-1" />
              {/* 🔴 Our form, never the restaurant's own booking page — see
                  lib/restaurants.ts. `partner` is the form's「ご希望のお店」. */}
              <Link
                href={`/reserve?type=restaurant&partner=${encodeURIComponent(r.name)}`}
                className="mt-4 inline-block self-start rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                このお店の予約を依頼する
              </Link>
            </div>
          ))}

          <div className="flex flex-col rounded-2xl border border-dashed border-line bg-sand p-6">
            <h2 className="text-lg font-bold">ほかのお店も承ります</h2>
            <p className="mt-2 text-sm text-muted">
              ここに載っていないお店でも、グアムのレストランならご依頼いただけます。お店が決まっていなければ、ご予算と食べたいものを書いてお送りください。
            </p>
            <Link
              href="/reserve?type=restaurant"
              className="mt-4 inline-block self-start rounded-full border border-brand px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
            >
              お店を指定して依頼する
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted">
          お店の場所・ジャンルは {RESTAURANTS_CHECKED_ON} 時点で確認したものです。営業時間や定休日は変わることがあるため、ご依頼をいただいてからお店に確認します。
          当社は掲載店から紹介料・広告料を受け取っていません。
        </p>
      </section>

      <BookingCta />
    </PageShell>
  );
}
