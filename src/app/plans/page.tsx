import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { PLANS, EXTRA_GUEST_SURCHARGE, perPerson } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "料金・プラン詳細",
  description:
    "グアム完全貸切ガイドチャーターの料金・プラン。3時間$170／5時間$250／8時間$345／ワンデー$500（1台あたり）。5〜7名は+$20、繁忙期料金も掲載。人数が増えるほど1人あたりおトク。",
  alternates: { canonical: "/plans" },
  openGraph: {
    title: "料金・プラン詳細｜Mokaru Guam",
    description:
      "3時間$170〜。料金は1台あたり、人数が増えるほど1人あたりおトク。繁忙期料金も掲載。",
    url: "/plans",
    type: "website",
    images: [OG_IMAGE],
  },
};

// What's included / not included — kept general and accurate.
const INCLUDED = [
  "日本語ガイド＋専用車（完全貸切／相乗りなし）",
  "行きたいスポットに合わせたルートのご提案",
  "道中の写真撮影・おすすめ情報のご案内",
];
const NOT_INCLUDED = [
  "各施設の入場料・アクティビティ代",
  "飲食代・お買い物代",
  "ガイド指定時間を超える延長分（要相談）",
];

export default function PlansPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        title="料金・プラン詳細"
        lead="料金は1台あたり（1〜4名）。5〜7名は各プラン +$20。人数が増えるほど、1人あたりはおトクになります。"
      />

      {/* Plan detail cards */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl bg-white p-6 ${
                plan.popular ? "border-2 border-brand" : "border border-line"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold">
                  {plan.name}
                  {plan.popular && (
                    <span className="ml-2 rounded-full bg-brand px-2.5 py-0.5 align-middle text-xs font-bold text-white">
                      いちばん人気
                    </span>
                  )}
                </h2>
                <span className="text-sm text-muted">{plan.hours}</span>
              </div>
              <div className="mt-2 text-3xl font-bold text-brand">
                ${plan.base}
                <small className="text-base font-medium text-muted"> /台（1〜4名）</small>
              </div>
              <p className="mt-1 text-sm font-bold text-brand">
                4名なら1人あたり 約${perPerson(plan, 4)}／ 5名なら 約$
                {perPerson(plan, 5)}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {plan.blurb.map((b) => (
                  <li key={b}>
                    <span className="mr-1.5 font-bold text-brand">✓</span>
                    {b}
                  </li>
                ))}
                <li>
                  <span className="mr-1.5 font-bold text-brand">✓</span>
                  5〜7名は +${EXTRA_GUEST_SURCHARGE}（例：${plan.base + EXTRA_GUEST_SURCHARGE}）
                </li>
              </ul>
              <Link
                href="/#booking"
                className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                このプランでリクエスト予約
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Included / not included */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 py-12 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold">含まれるもの</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {INCLUDED.map((x) => (
                <li key={x}>
                  <span className="mr-1.5 font-bold text-brand">✓</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-bold">含まれないもの</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {NOT_INCLUDED.map((x) => (
                <li key={x}>
                  <span className="mr-1.5 font-bold text-muted">−</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Peak-season table */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-lg font-bold">繁忙期料金（1〜4名・1台あたり）</h2>
        <p className="mt-1 text-sm text-muted">
          繁忙期は GW・夏休み・シルバーウィーク・年末年始などが対象です。5〜7名は各プラン +${EXTRA_GUEST_SURCHARGE}。
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">プラン</th>
                <th className="px-4 py-3 font-medium">時間</th>
                <th className="px-4 py-3 font-medium">通常料金</th>
                <th className="px-4 py-3 font-medium">繁忙期料金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PLANS.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3 text-muted">{plan.hours}</td>
                  <td className="px-4 py-3">${plan.base}</td>
                  <td className="px-4 py-3 font-bold text-brand">${plan.peak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          ※ 繁忙期の対象期間は年により前後する場合があります。詳しくはお問い合わせください。
        </p>
      </section>

      <BookingCta />
    </PageShell>
  );
}
