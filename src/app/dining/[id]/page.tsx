import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { OG_IMAGE } from "@/lib/images";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/structured-data";
import { RESTAURANT_FEE } from "@/lib/pricing";
import {
  RESTAURANTS,
  RESTAURANTS_CHECKED_ON,
  RESTAURANT_FACTS_CHECKED_ON,
  getRestaurant,
} from "@/lib/restaurants";

// One page per restaurant on /dining (2026-10-15, search plan B).
//
// WHY: people search for a restaurant by name plus「予約」, and /dining is one
// page for seven names. Each store page answers that query: what the place is,
// what the owner thinks of it, anything that decides whether it can be booked,
// and how booking through us works.
//
// 🔴 Same rules as /dining: every button goes to OUR form, never the
// restaurant's booking page, and the page links nowhere outside the site (the
// sources are named, not linked — one of them is a booking site).
export function generateStaticParams() {
  return RESTAURANTS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = getRestaurant(id);
  if (!r) return { title: "ページが見つかりません" };
  const desc = `グアムの${r.nameJa}（${r.name}）の予約を、日本語で代行します。${r.genre}・${r.area}。予約の代行は1件$${RESTAURANT_FEE}、お取りできなければ料金はいただきません。`;
  return {
    title: `${r.nameJa}の予約（グアム）｜日本語で代行`,
    description: desc,
    alternates: { canonical: `/dining/${r.id}` },
    openGraph: {
      title: `${r.nameJa}（グアム）｜Mokaru Guam`,
      description: desc,
      url: `/dining/${r.id}`,
      type: "article",
      images: [OG_IMAGE],
    },
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = getRestaurant(id);
  if (!r) notFound();

  const requestHref = `/reserve?type=restaurant&partner=${encodeURIComponent(r.name)}`;
  const others = RESTAURANTS.filter((x) => x.id !== r.id);

  return (
    <PageShell>
      {/* Breadcrumb only — no Restaurant markup, see lib/structured-data.ts. */}
      <JsonLd
        data={breadcrumbLd([
          { name: "おすすめレストラン", path: "/dining" },
          { name: r.nameJa, path: `/dining/${r.id}` },
        ])}
      />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Restaurant ／ {r.genre}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{r.name}</h1>
          <p className="mt-2 text-muted">
            {r.nameJa}（グアム）
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-5 py-12">
        {/* The owner's words, signed as ours — see lib/restaurants.ts. */}
        <div className="rounded-lg bg-brand/10 px-4 py-3">
          <p className="text-xs font-bold text-brand">Mokaruのひとこと</p>
          <p className="mt-1 text-lg font-bold leading-snug text-ink">{r.pick}</p>
        </div>

        {r.bookingNote && (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            ! {r.bookingNote}
          </p>
        )}

        <div className="mt-6 rounded-2xl border-2 border-brand bg-white p-5">
          <h2 className="text-sm font-bold">このお店の予約を、日本語で代行します</h2>
          <p className="mt-2 text-sm">
            <b>予約の代行は1件 ${RESTAURANT_FEE}</b>（人数にかかわらず同額）。
            <b className="text-brand">お取りできなかった場合、料金はいただきません。</b>
          </p>
          <p className="mt-1 text-xs text-muted">
            お手配の完了後にお客様のご都合でキャンセルされる場合のご返金はいたしかねます。お食事代は当日、お店へ直接お支払いください。
            <Link href="/guide" className="ml-1 font-bold text-brand hover:underline">
              キャンセルについて →
            </Link>
          </p>
          <Link
            href={requestHref}
            className="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            このお店の予約を依頼する
          </Link>
        </div>

        <h2 className="mt-10 text-xl font-bold">どんなお店か</h2>
        <p className="mt-3 leading-relaxed">{r.blurb}</p>
        <p className="mt-3 text-sm text-muted">📍 {r.area}</p>

        {r.facts && r.facts.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-bold">予約の前に知っておきたいこと</h2>
            <ul className="mt-3 space-y-3">
              {r.facts.map((f) => (
                <li key={f.text} className="rounded-lg border border-line bg-white px-4 py-3">
                  <p className="leading-relaxed">{f.text}</p>
                  <p className="mt-1 text-xs text-muted">出典：{f.source}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mt-10 text-xl font-bold">Mokaruに予約を頼むと</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
          <li>
            <Link href={requestHref} className="font-bold text-brand hover:underline">
              依頼フォーム
            </Link>
            から、ご希望の日時と人数を送ってください。お店の名前は入力済みです。手配料 ${RESTAURANT_FEE} はカードにお預かりするだけで、この時点では請求されません。
          </li>
          <li>グアムにいる当社のスタッフが、お店に直接連絡してお席をお取りします。</li>
          <li>
            お席が取れたら、ご予約の内容をメールでお知らせし、手配料のお支払いが確定します。お取りできなかった場合は、料金はいただきません。
          </li>
        </ol>

        <p className="mt-8 text-xs text-muted">
          お店の場所・ジャンルは {RESTAURANTS_CHECKED_ON}、「予約の前に知っておきたいこと」は {RESTAURANT_FACTS_CHECKED_ON} 時点で、出典に記した公開情報から確認したものです。営業時間や定休日は変わることがあるため、ご依頼をいただいてからお店に確認します。当社は掲載店から紹介料・広告料を受け取っていません。
        </p>

        <h2 className="mt-12 text-lg font-bold">ほかのおすすめのお店</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {others.map((o) => (
            <li key={o.id}>
              <Link
                href={`/dining/${o.id}`}
                className="block rounded-lg border border-line bg-white px-4 py-3 text-sm transition hover:border-brand"
              >
                <span className="font-bold">{o.nameJa}</span>
                <span className="ml-2 text-xs text-muted">{o.genre}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <Link href="/dining" className="text-sm font-bold text-brand hover:underline">
            ← Mokaruおすすめのレストラン一覧へ
          </Link>
        </p>
      </article>

      <BookingCta />
    </PageShell>
  );
}
