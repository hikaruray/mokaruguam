import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/images";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import BookingForm from "@/components/BookingForm";
import { CONTACT_EMAIL } from "@/lib/config";
import { RESTAURANT_FEE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "手配を依頼する",
  description:
    "グアムのレストラン予約代行・ツアー手配のご依頼ページ。お店やツアー名とご希望日時を送るだけ。48時間以内に手配の状況をご連絡します。レストランは1件$10、お取りできなければ料金はいただきません。",
  alternates: { canonical: "/reserve" },
  openGraph: {
    title: "手配を依頼する｜Mokaru Guam",
    description: "お店の名前とご希望日時を送るだけ。48時間以内に状況をご連絡します。",
    url: "/reserve",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function ReservePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Reserve"
        title="手配を依頼する"
        lead="ご希望のお店・ツアーと日時をお送りください。グアム在住の日本人スタッフが、お客様に代わって手配します。"
      />

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
          {/* How the request works */}
          <div>
            <h2 className="text-lg font-bold">ご依頼の流れ</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px]">
              <li>
                ご依頼の種類（レストラン／ツアー）と、ご希望日時・人数をお送りください。レストランのみ、手配料 $
                {RESTAURANT_FEE} をカードに
                <span className="font-bold text-brand">
                  お預かりします（この時点では請求されません）。
                </span>
              </li>
              <li>
                お店・実施会社に空き状況を確認し、
                <span className="font-bold text-ink">48時間以内に状況</span>
                をご連絡します。
              </li>
              <li>
                お席・ご予約が取れた時点で、レストランは手配料のお支払いが確定します。
                <span className="font-bold text-ink">
                  お取りできなかった場合、料金はいただきません。
                </span>
              </li>
            </ol>

            <div className="mt-5 rounded-2xl border border-line bg-sand p-4 text-sm text-muted">
              <p>
                <b className="text-ink">ツアーの手配は、当社へのお支払いはありません。</b>
                ツアー代金は当日、実施会社へ直接お支払いください。
              </p>
              <p className="mt-2">
                レストランの手配料は、
                <b className="text-ink">お手配の完了後はご返金の対象外</b>
                となります（お店へのキャンセルのご連絡は当社が代行します）。詳しくは{" "}
                <Link href="/guide" className="font-bold text-brand hover:underline">
                  ご依頼の流れ・キャンセルについて
                </Link>{" "}
                をご確認ください。
              </p>
            </div>

            <div className="mt-5 text-sm text-muted">
              <p className="font-bold text-ink">ご不明な点は</p>
              <p className="mt-1">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-bold text-brand hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                までお気軽にご相談ください。8名以上のご依頼もこちらで承ります。
              </p>
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
