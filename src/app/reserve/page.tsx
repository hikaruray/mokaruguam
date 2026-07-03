import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingForm from "@/components/BookingForm";
import { LINE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "リクエスト予約",
  description:
    "グアム完全貸切ガイドチャーターのリクエスト予約ページ。希望日時・人数・行きたいスポットを送るだけ。空き状況を確認して7日以内にご連絡します。この時点では料金は発生しません。",
  alternates: { canonical: "/reserve" },
  openGraph: {
    title: "リクエスト予約｜Mokaru Guam",
    description: "行きたいスポットを送るだけ。空き状況を確認してご連絡します（7日以内）。",
    url: "/reserve",
    type: "website",
  },
};

export default function ReservePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Reserve"
        title="リクエスト予約"
        lead="Mokaru Guam はリクエスト予約制です。まずはご希望をお送りください。空き状況を確認してご連絡します。"
      />

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
          {/* How the request works */}
          <div>
            <h2 className="text-lg font-bold">リクエスト予約の流れ</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px]">
              <li>
                希望日時・人数・行きたいスポットを送ってリクエスト。お支払いは全額前払いで、
                <span className="font-bold text-brand">この時点では仮押さえ（まだ引き落とされません）。</span>
              </li>
              <li>ガイド・車両の空きを確認し、7日以内にお返事します。</li>
              <li>予約が確定するとお支払いが確定します。お手配できない場合は自動で解除（返金）されます。あとは当日を待つだけ。</li>
            </ol>

            <div className="mt-5 rounded-2xl border border-line bg-sand p-4 text-sm text-muted">
              お申し込み前に、
              <Link href="/guide" className="font-bold text-brand hover:underline">
                予約の流れ・キャンセルポリシー
              </Link>
              をご確認ください。キャンセルは実施日の8日以上前で全額返金、7〜4日前は50%、3日前以降は返金なしとなります。
            </div>

            <div className="mt-5 text-sm text-muted">
              <p className="font-bold text-ink">ご不明な点は</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <a
                  href={LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#06c755] px-4 py-2 text-sm font-medium text-[#06c755] hover:bg-[#06c755]/10"
                >
                  質問・相談はLINEで
                </a>
              </div>
            </div>
          </div>

          {/* Reuse the existing BookingForm (same component/store as the homepage). */}
          <div>
            <BookingForm />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
