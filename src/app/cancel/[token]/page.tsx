import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/PageShell";
import { verifyCancelToken } from "@/lib/cancel-token";
import { getBooking, requestTypeOf } from "@/lib/store";
import { daysUntilTour } from "@/lib/pricing";
import { refundDecision } from "@/lib/refund-policy";
import { LINE_URL } from "@/lib/config";
import CancelConfirm from "./CancelConfirm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "予約のキャンセル",
  robots: { index: false, follow: false },
};

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bookingId = verifyCancelToken(token);
  const booking = bookingId ? await getBooking(bookingId) : null;

  // Invalid / unknown token → generic, non-leaky message.
  if (!booking) {
    return (
      <PageShell>
        <PageHero eyebrow="Cancel" title="予約のキャンセル" />
        <section className="mx-auto max-w-2xl px-5 py-12">
          <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
            キャンセルリンクが無効か、予約が見つかりませんでした。
            お手数ですが、
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand hover:underline"
            >
              LINE
            </a>
            またはメール（tour@mokaruguam.com）までご連絡ください。
          </div>
        </section>
      </PageShell>
    );
  }

  const alreadyClosed =
    booking.status === "cancelled" || booking.status === "declined";
  // 🔴 refundDecision, NOT refundRateForDate.
  //
  // This page used to call the date ladder directly, which is the TOUR rule.
  // On a restaurant booking it printed「返金率 100%」whenever the meal was 8 or
  // more days away — almost every booking — and then the cancel route, which
  // does branch on the request type, returned zero. The guest learned it was
  // false by pressing the button.
  //
  // lib/refund-policy.ts exists because the terms were rewritten and the code
  // that moves the money was not updated with them. The code that reads the
  // amount out loud was missed the same way, one layer further out. There is
  // one decision and both sides must ask it.
  const { rate, tier } = refundDecision(
    booking.requestType,
    booking.preferredDate,
    "policy",
  );
  const days = daysUntilTour(booking.preferredDate);
  const isCaptured = booking.payment === "captured";
  const isAuthorized = booking.payment === "authorized";
  // The date ladder applies to tours and to pre-pivot charters. An arrangement
  // fee buys the act of getting the table, which is finished once the table is
  // held, so the day of the meal has no bearing on it.
  const laddered = requestTypeOf(booking) !== "restaurant";

  return (
    <PageShell>
      <PageHero eyebrow="Cancel" title="予約のキャンセル" />
      <section className="mx-auto max-w-2xl px-5 py-12">
        {/* Booking summary */}
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-bold">予約内容</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="お名前" value={`${booking.name} 様`} />
            <Row label="プラン" value={booking.planName} />
            <Row label="ご希望日時" value={booking.preferredDate} />
            <Row label="ご参加人数" value={`${booking.guests}名`} />
            <Row
              label="現在の状態"
              value={STATUS_JA[booking.status] ?? booking.status}
            />
          </dl>
        </div>

        {alreadyClosed ? (
          <div className="mt-6 rounded-2xl border border-line bg-sand p-5 text-sm text-muted">
            この予約は既に
            {booking.status === "cancelled" ? "キャンセル" : "お断り"}
            済みです。新たな手続きは不要です。ご不明な点は LINE またはメールでご連絡ください。
          </div>
        ) : (
          <>
            {/* Refund preview */}
            <div className="mt-6 rounded-2xl border border-line bg-sand p-5 text-sm">
              <h3 className="font-bold text-ink">キャンセルした場合の返金</h3>
              {isAuthorized ? (
                <p className="mt-2 text-muted">
                  現在はお支払いの<b>仮押さえ</b>のみで、まだ請求されていません。キャンセルすると
                  <b>仮押さえは解除</b>され、料金は発生しません。
                </p>
              ) : isCaptured ? (
                <div className="mt-2 text-muted">
                  {/* The days-remaining line only means something where the
                      date decides the rate. Printing it on an arrangement fee
                      implies a ladder that does not apply. */}
                  {laddered && (
                    <p>
                      実施日まで{days != null ? `${days}日` : "―"}（{tier}）。
                    </p>
                  )}
                  <p className={laddered ? "mt-1" : ""}>
                    返金率：
                    <b className="text-brand">{Math.round(rate * 100)}%</b>
                    {rate === 0 && `（${tier}）`}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-muted">
                  この予約に伴うお支払いはありません。キャンセルのみ承ります。
                </p>
              )}
              {laddered ? (
                <p className="mt-3 text-xs text-muted">
                  キャンセルポリシー：実施日の8日以上前=全額返金／7〜4日前=50%／3日前以降（当日・無連絡含む）=返金なし。
                </p>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  手配料は、お席のお手配が完了した時点でご返金の対象外となります。お店へのキャンセルのご連絡は当社が代行しますので、お客様からご連絡いただく必要はありません。
                </p>
              )}
            </div>

            <CancelConfirm token={token} />
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          ご不明な点は{" "}
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand hover:underline"
          >
            LINE
          </a>{" "}
          または{" "}
          <Link href="/guide" className="font-bold text-brand hover:underline">
            予約の流れ・キャンセルポリシー
          </Link>{" "}
          をご覧ください。
        </p>
      </section>
    </PageShell>
  );
}

const STATUS_JA: Record<string, string> = {
  pending: "確認待ち",
  confirmed: "確定",
  declined: "お断り",
  cancelled: "キャンセル済み",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
