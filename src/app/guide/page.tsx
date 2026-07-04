import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";

export const metadata: Metadata = {
  title: "予約の流れ・キャンセルポリシー",
  description:
    "グアム完全貸切ガイドチャーターの予約の流れ（リクエスト制）とキャンセルポリシー。空き確認は48時間以内、全額前払い。キャンセルは実施日基準で8日以上前は全額返金・7〜4日前50%・3日前以降は返金なし。",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "予約の流れ・キャンセルポリシー｜Mokaru Guam",
    description: "リクエスト予約の流れとキャンセル規定をわかりやすくご案内します。",
    url: "/guide",
    type: "website",
  },
};

// Steps mirror booking-payment-design.md exactly.
const STEPS = [
  {
    n: "1",
    title: "リクエスト予約",
    body: "希望日時・人数・行きたいスポットを送ってリクエストします。この時点では料金は発生しません。",
  },
  {
    n: "2",
    title: "空き状況の確認・お返事",
    body: "ガイド・車両の空きを確認し、48時間以内にご連絡します。お手配できない場合は、その旨をご連絡します。",
  },
  {
    n: "3",
    title: "予約の確定",
    body: "お手配可能な場合、予約が確定します。お支払いは全額前払いです（確定時）。",
  },
  {
    n: "4",
    title: "当日ツアー",
    body: "あとは当日を待つだけ。日本語ガイド＋専用車で、あなただけのグアムをお楽しみください。",
  },
];

// Cancellation policy — numbers/conditions must match booking-payment-design.md
// exactly. Basis: the tour date, Guam time (UTC+10).
const CANCEL_ROWS = [
  { when: "実施日の8日以上前", fee: "0%", refund: "全額返金" },
  { when: "実施日の7〜4日前", fee: "50%", refund: "50%返金" },
  {
    when: "実施日の3日前・2日前・前日・当日／無連絡不参加",
    fee: "100%",
    refund: "返金なし",
  },
  {
    when: "天候不良・当社都合による中止",
    fee: "0%",
    refund: "全額返金 または 無料で日程変更",
  },
];

export default function GuidePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="予約の流れ・キャンセルポリシー"
        lead="Mokaru Guam はリクエスト予約制です。お申し込みからツアー当日までの流れと、キャンセル規定をご案内します。"
      />

      {/* Booking flow */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <h2 className="text-lg font-bold">予約の流れ</h2>
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
            <span className="font-bold text-ink">お支払いについて：</span>{" "}
            お支払いは全額前払いです。リクエスト時にカード等で
            <b>仮押さえ</b>（この時点では引き落とされません）、
            <b>予約確定時にお支払いが確定</b>します。お手配できない場合は
            <b>自動で解除（返金）</b>されます。
          </p>
          <p className="mt-2">
            クレジットカード（PayPalアカウント不要）またはPayPalでお支払いいただけます。
          </p>
        </div>
      </section>

      {/* Cancellation policy */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h2 className="text-lg font-bold">キャンセルポリシー</h2>
          <p className="mt-1 text-sm text-muted">
            キャンセル料は実施日を基準に、下記のとおり計算します（グアム時間・UTC+10）。全額前払いのため、キャンセル時は該当分を返金します。
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">タイミング（実施日まで）</th>
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
            <li>※ 上記は実施日を基準としたグアム時間（UTC+10）で判定します。</li>
            <li>※ 天候不良・当社都合による中止の場合は、全額返金または無料での日程変更に対応します。</li>
            <li>※ キャンセルのご連絡は、できるだけ早めにお願いいたします。</li>
          </ul>
        </div>
      </section>

      {/* Cross-link to reserve */}
      <section className="mx-auto max-w-4xl px-5 py-10 text-center">
        <p className="text-sm text-muted">
          内容をご確認のうえ、
          <Link href="/reserve" className="font-bold text-brand hover:underline">
            リクエスト予約ページ
          </Link>
          からお申し込みください。
        </p>
      </section>

      <BookingCta />
    </PageShell>
  );
}
