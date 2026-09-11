import Link from "next/link";

// Reusable call-to-action band for the bottom of every subpage.
//
// 2026-09-11: the LINE secondary button was removed with the pivot (email is
// the only channel). The default copy now describes the arrangement service
// rather than a charter booking. See the note on LINE_URL in config.ts.
//
// "48時間以内に状況をご連絡します" is deliberate — we promise a STATUS, not a
// result. The restaurant may not answer within 48 hours, and a promise of
// "確定のご連絡" would be broken by the shop's own pace, not ours.
export default function BookingCta({
  heading = "気になったら、手配を依頼するだけ。",
  sub = "ご希望の日時・人数・お店やツアー名を送るだけ。48時間以内に状況をご連絡します。この時点では料金は発生しません。",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <section className="bg-ink-dark text-white">
      <div className="mx-auto max-w-5xl px-5 py-14 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] opacity-90">{sub}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/reserve"
            className="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            手配を依頼する
          </Link>
          <Link
            href="/plans"
            className="rounded-full border border-white/40 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            できること・料金を見る
          </Link>
        </div>
      </div>
    </section>
  );
}
