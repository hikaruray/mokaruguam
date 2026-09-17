import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";

export const metadata: Metadata = {
  title: "ご依頼の流れ・キャンセルについて",
  description:
    "グアムのレストラン予約代行・ツアー手配のご依頼の流れとキャンセルについて。48時間以内に状況をご連絡。レストランは1件$10で、お取りできなければ料金はいただきません。ツアーの手配は当社へのお支払いなし。",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "ご依頼の流れ・キャンセルについて｜Mokaru Guam",
    description: "ご依頼から手配完了までの流れと、キャンセルの扱いをご案内します。",
    url: "/guide",
    type: "website",
    images: [OG_IMAGE],
  },
};

// 🔴 The steps describe what we now actually do. Step 2 used to say we check
// ガイド・車両の空き — we own neither from 2026-10-01. Step 3 said payment is
// taken in full on confirmation, which was the charter's rule; the arrangement
// fee is captured when the table is held, and a tour is never charged at all.
const STEPS = [
  {
    n: "1",
    title: "ご依頼",
    body: "ご依頼の種類（レストラン／ツアー）とご希望日時・人数をお送りください。レストランのみ、手配料 $10 をカードにお預かりします（この時点では請求されません）。",
  },
  {
    n: "2",
    title: "状況のご連絡（48時間以内）",
    body: "お店・実施会社に空き状況を確認し、48時間以内に「状況」をご連絡します。お店の回答そのものはお店の都合によりますので、結果のお約束ではありません。",
  },
  {
    n: "3",
    title: "お手配の完了",
    body: "お席・ご予約が取れた時点でお手配完了のご連絡をします。レストランは、このタイミングで手配料のお支払いが確定します。",
  },
  {
    n: "4",
    title: "当日",
    body: "レストランへは直接お越しください（お席はお名前で承っています）。ツアーは実施会社のご案内に従ってください。お食事代・ツアー代金は当日、お店・実施会社へお支払いください。",
  },
];

// 🔴 Two services, two rules. There is no shared date ladder any more.
//
// The old table applied the tour ladder (8日/7〜4日/3日) to everything. Applied
// to an arrangement fee it is simply wrong: the $10 buys the act of getting the
// table, and once the table is held that work is finished and cannot be resold,
// so the day of the meal has no bearing on it. This page and
// lib/refund-policy.ts have to say the same thing — the last time the wording
// changed without the code, the fee was silently refunded in full on most
// bookings.
const CANCEL_ROWS = [
  {
    when: "レストラン：お手配が完了する前",
    fee: "0%",
    refund: "お預かりを解除（料金は発生しません）",
  },
  {
    when: "レストラン：お手配の完了後（お客様のご都合）",
    fee: "100%",
    refund: "手配料の返金なし",
  },
  {
    when: "レストラン：お店側の都合・当社都合",
    fee: "0%",
    refund: "全額返金",
  },
  {
    when: "ツアー手配：すべての場合",
    fee: "0%",
    refund: "当社・実施会社ともにキャンセル料はありません",
  },
];

export default function GuidePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="ご依頼の流れ・キャンセルについて"
        lead="Mokaru Guam は、グアムのレストラン予約とアクティビティの手配を代行します。ご依頼からお手配完了までの流れと、キャンセルの扱いをご案内します。"
      />

      {/* Booking flow */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <h2 className="text-lg font-bold">ご依頼の流れ</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-sand p-5 text-sm text-muted">
          <p>
            <span className="font-bold text-ink">
              レストラン予約代行のお支払い：
            </span>{" "}
            手配料は<b>1件 $10</b>（人数にかかわらず同額）。ご依頼時にカードへ
            <b>お預かり</b>（この時点では引き落とされません）、
            <b>お席が取れた時点でお支払いが確定</b>します。
            <b>お取りできなかった場合はお預かりを解除</b>し、料金は発生しません。
            お食事代は当日、お店へ直接お支払いください。
          </p>
          <p className="mt-2">
            <span className="font-bold text-ink">
              アクティビティ・ツアーの手配：
            </span>{" "}
            <b>当社へのお支払いはありません。</b>
            ツアー代金は当日、実施会社へ直接お支払いください。
          </p>
          <p className="mt-2">
            クレジットカード（PayPalアカウント不要）またはPayPalでお支払いいただけます。
          </p>
          <p className="mt-2 text-xs">
            8名以上のご依頼は別途お見積りとなります。メールでご相談ください。
          </p>
        </div>
      </section>

      {/* Cancellation policy */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h2 className="text-lg font-bold">キャンセルについて</h2>
          <p className="mt-1 text-sm text-muted">
            キャンセルの扱いは、ご依頼の種類によって異なります。手配料は「お席を取る」という作業に対する料金のため、
            <b className="text-ink">日付ではなく、お手配が完了しているかどうか</b>
            で決まります。
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ご依頼の種類・タイミング</th>
                  <th className="px-4 py-3 font-medium">キャンセル料</th>
                  <th className="px-4 py-3 font-medium">返金</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {CANCEL_ROWS.map((r) => (
                  <tr key={r.when}>
                    <td className="px-4 py-3">{r.when}</td>
                    <td className="px-4 py-3 font-bold text-brand">{r.fee}</td>
                    <td className="px-4 py-3 text-muted">{r.refund}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-1.5 text-xs text-muted">
            <li>
              ※ お手配の完了後にキャンセルされる場合も、
              <b className="text-ink">お店へのご連絡は当社が代行します。</b>
              お客様からご連絡いただく必要はありません。
            </li>
            <li>
              ※ 第1希望のお店が満席だった場合、ご依頼時のご希望に応じて、代わりのお店を
              <b className="text-ink">1件まで</b>ご提案します。ご承諾いただいてからお席をお取りします。
            </li>
            <li>
              ※ アクティビティ・ツアーは、
              <b className="text-ink">実施会社のキャンセル料も発生しません</b>
              （提携2社に確認済み）。
            </li>
            <li>
              ※ キャンセルのご連絡は、実施日の
              <b className="text-ink">3日前まで</b>
              にお願いいたします。実施会社が枠を他のお客様にご案内できるためで、遅れた場合も料金は発生しません。
            </li>
            <li>
              ※ 2026年9月30日までにお申し込みいただいた貸切ガイドチャーターについては、お申し込み時のキャンセルポリシー（実施日の8日以上前＝全額返金／7〜4日前＝50%／3日前以降＝返金なし）を適用します。
            </li>
          </ul>
        </div>
      </section>

      {/* Cross-link to reserve */}
      <section className="mx-auto max-w-4xl px-5 py-10 text-center">
        <p className="text-sm text-muted">
          内容をご確認のうえ、
          <Link href="/reserve" className="font-bold text-brand hover:underline">
            ご依頼フォーム
          </Link>
          からお申し込みください。
        </p>
      </section>

      <BookingCta />
    </PageShell>
  );
}
