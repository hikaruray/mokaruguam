import Link from "next/link";
import { RESTAURANT_FEE } from "@/lib/pricing";
import { Eyebrow, SectionHeading, Sub } from "./Section";

// What the business sells, on the home page.
//
// This used to be an interactive charter price table — four time-based plans
// and a slider showing the per-person cost falling as the group grew. All of
// it described a service that ends 2026-09-30. It is not adapted here, because
// there is nothing left for it to compute: one service is a flat fee that does
// not vary with headcount, and the other has no price of ours at all.
//
// No client state, so this is a server component now.
export default function Pricing() {
  return (
    <section id="price" className="mx-auto max-w-5xl px-5 py-16">
      <Eyebrow>What we do</Eyebrow>
      <SectionHeading>できること・料金</SectionHeading>
      <Sub>
        ふたつだけです。レストランのご予約と、アクティビティ・ツアーのお手配。
      </Sub>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-brand bg-white p-6">
          <h3 className="text-lg font-bold">レストランの予約代行</h3>
          <div className="mt-2 text-4xl font-bold text-brand">
            ${RESTAURANT_FEE}
            <small className="text-base font-medium text-muted"> /1件</small>
          </div>
          <p className="mt-1 text-sm font-bold text-brand">
            人数にかかわらず同額
          </p>
          <ul className="mt-3.5 space-y-1.5 text-sm text-muted">
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              <b className="text-ink">お取りできなければ0円</b>
            </li>
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              満席なら代わりのお店を1件までご提案
            </li>
            <li>
              <span className="mr-1.5 font-bold text-muted">−</span>
              お食事代は当日、お店へ直接
            </li>
          </ul>
          <Link
            href="/reserve?type=restaurant"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            レストランの予約を依頼する
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6">
          <h3 className="text-lg font-bold">アクティビティ・ツアーの手配</h3>
          <div className="mt-2 text-4xl font-bold text-brand">$0</div>
          <p className="mt-1 text-sm font-bold text-brand">
            当社へのお支払いはありません
          </p>
          <ul className="mt-3.5 space-y-1.5 text-sm text-muted">
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              提携先のツアーを代わりに手配します
            </li>
            <li>
              <span className="mr-1.5 font-bold text-brand">✓</span>
              やりたいことだけ書いてもOK
            </li>
            <li>
              <span className="mr-1.5 font-bold text-muted">−</span>
              ツアー代金は当日、実施会社へ直接
            </li>
          </ul>
          <Link
            href="/reserve?type=tour"
            className="mt-5 inline-block rounded-full border border-brand px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
          >
            ツアーの手配を依頼する
          </Link>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        提携先のツアー一覧や詳しい規定は{" "}
        <Link href="/plans" className="font-bold text-brand hover:underline">
          できること・料金のページ
        </Link>{" "}
        をご覧ください。8名以上のご依頼は別途お見積りとなります。
      </p>
    </section>
  );
}
