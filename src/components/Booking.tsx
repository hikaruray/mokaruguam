import BookingForm from "./BookingForm";
import { LINE_URL } from "@/lib/config";

export default function Booking() {
  return (
    <section id="booking" className="bg-ink-dark text-white">
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            まずは「リクエスト予約」から。
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px]">
            <li>希望日時・人数・行きたいスポットを送ってリクエスト</li>
            <li>
              ガイド・車両の空きを確認してお返事（7日以内）。
              <b>この時点ではまだ請求されません</b>
            </li>
            <li>
              予約が確定したら、そのままお支払い（全額前払い）。あとは当日を待つだけ！
            </li>
          </ol>
          <p className="mt-4 text-[13.5px] opacity-90">
            お支払いは全額前払い（確定時）。キャンセルは実施日の
            <b>8日前まで全額返金</b>／7〜4日前50%／3日前以降は返金なし。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#06c755] px-5 py-3 text-sm font-bold text-white"
            >
              質問・相談はLINEで
            </a>
          </div>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}
