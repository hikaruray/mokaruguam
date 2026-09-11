import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { RESTAURANT_FEE } from "@/lib/pricing";
import { PARTNERS } from "@/lib/partners";

export const metadata: Metadata = {
  title: "できること・料金",
  description:
    "グアムのレストラン予約代行は1件$10、お取りできなければ料金はいただきません。アクティビティ・ツアーの手配は当社へのお支払いなし。渡航前に日本語だけで手配が終わります。",
  alternates: { canonical: "/plans" },
  openGraph: {
    title: "できること・料金｜Mokaru Guam",
    description:
      "レストラン予約代行は1件$10（取れなければ0円）。ツアーの手配は当社へのお支払いなし。",
    url: "/plans",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function PlansPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="What we do"
        title="できること・料金"
        lead="グアム在住の日本人スタッフが、お客様に代わってお店や実施会社とやり取りします。渡航前に、日本語だけで手配が終わります。"
      />

      {/* Restaurant arrangement */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="rounded-2xl border-2 border-brand bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">レストランの予約代行</h2>
            <div className="text-3xl font-bold text-brand">
              ${RESTAURANT_FEE}
              <small className="text-base font-medium text-muted"> /1件</small>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">
            ご希望のお店・日時・人数をお送りください。お店へのご予約を代行します。
            <b className="text-ink">手配料は人数にかかわらず1件 ${RESTAURANT_FEE}</b>
            です。
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              <b className="text-ink">お取りできなかった場合、料金はいただきません</b>
              （カードのお預かりを解除します）
            </li>
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              満席だった場合は、ご希望に応じて代わりのお店を1件までご提案します
            </li>
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              英語でのやり取りは不要です。すべて日本語で承ります
            </li>
            <li>
              <span className="mr-1.5 font-bold text-muted">−</span>
              お食事代は含まれません（当日、お店へ直接お支払いください）
            </li>
          </ul>
          <Link
            href="/reserve?type=restaurant"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            レストランの予約を依頼する
          </Link>
        </div>
      </section>

      {/* Partner activities */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <h2 className="text-lg font-bold">アクティビティ・ツアーの手配</h2>
          <p className="mt-1 text-sm text-muted">
            提携する実施会社のツアーを、お客様に代わって手配します。
            <b className="text-ink">当社へのお支払いはありません。</b>
            ツアー代金は当日、実施会社へ直接お支払いください。
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {PARTNERS.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-line bg-white p-6"
              >
                <p className="text-xs font-bold text-brand">{p.company}（提携先）</p>
                <h3 className="mt-1 text-lg font-bold">{p.activity}</h3>
                <p className="mt-2 text-sm text-muted">
                  所要 {p.duration} ／{" "}
                  <b className="text-ink">{p.priceFrom}</b>
                  <span className="block text-xs">（{p.priceNote}）</span>
                </p>
                <p className="mt-2 text-sm text-muted">{p.blurb}</p>
                {/* 🔴 Our own form, never the operator's booking page: the
                    commission is owed on bookings we send. */}
                <Link
                  href={`/reserve?type=tour&partner=${encodeURIComponent(p.company)}`}
                  className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  モカル経由で手配を依頼
                </Link>
                <p className="mt-2 text-xs text-muted">
                  ※ 最新の料金は手配時にご案内します。
                </p>
              </div>
            ))}

            <div className="rounded-2xl border border-dashed border-line bg-sand p-6">
              <h3 className="text-lg font-bold">ご希望のツアーはありますか？</h3>
              <p className="mt-2 text-sm text-muted">
                掲載のないツアーやアクティビティも、可能な範囲でお手配します。やりたいことをそのままお送りください（「シュノーケリング」などでも構いません）。
              </p>
              <Link
                href="/reserve?type=tour"
                className="mt-4 inline-block rounded-full border border-brand px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
              >
                やりたいことを相談する
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer — summary. The governing copy is /legal (design §10-1). */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-2xl border border-line bg-sand p-5 text-sm text-muted">
          <p>
            <b className="text-ink">手配サービスについて：</b>{" "}
            当社は手配を代行する立場であり、ツアーの実施者ではありません。ツアーに関する契約は、お客様と実施会社との間に成立します。
          </p>
          <p className="mt-2 text-xs">
            8名以上のご依頼は別途お見積りとなります。詳しい規定は{" "}
            <Link href="/legal" className="font-bold text-brand hover:underline">
              特定商取引法に基づく表記
            </Link>{" "}
            および{" "}
            <Link href="/guide" className="font-bold text-brand hover:underline">
              ご依頼の流れ・キャンセルについて
            </Link>{" "}
            をご覧ください。
          </p>
        </div>
      </section>

      <BookingCta />
    </PageShell>
  );
}
