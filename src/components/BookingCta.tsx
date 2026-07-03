import Link from "next/link";
import { LINE_URL } from "@/lib/config";

// Reusable booking call-to-action band for the bottom of every subpage.
// Primary = booking request (brand orange). Secondary = LINE question channel.
export default function BookingCta({
  heading = "気になったら、まずはリクエスト予約から。",
  sub = "希望日時・人数・行きたいスポットを送るだけ。空き状況を確認してご連絡します（7日以内）。この時点では料金は発生しません。",
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
            リクエスト予約・空き確認
          </Link>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[#06c755] px-6 py-3.5 text-sm font-medium text-[#06c755] transition hover:bg-[#06c755]/10"
          >
            質問・相談はLINEで
          </a>
        </div>
      </div>
    </section>
  );
}
