import {
  listBookings,
  chargedAmount,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/store";
import BookingActions from "./BookingActions";
import TourSchedule, { type ScheduleRow } from "./TourSchedule";
import { repayUrl } from "@/lib/cancel-token";
import { SITE_URL } from "@/lib/config";

// Always read the latest data so new requests show immediately.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "確認待ち",
  confirmed: "確定",
  declined: "お断り",
  cancelled: "キャンセル",
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  none: "決済なし",
  authorized: "仮押さえ",
  captured: "決済確定",
  voided: "解除済み",
  refunded: "返金済み",
  // A hold that died before it could be captured. Must read differently from
  // 仮押さえ at a glance: the money is NOT waiting, and confirming will fail.
  expired: "仮押さえ期限切れ",
};

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  none: "bg-slate-100 text-slate-500",
  authorized: "bg-sky-100 text-sky-700",
  captured: "bg-emerald-100 text-emerald-700",
  voided: "bg-slate-200 text-slate-600",
  refunded: "bg-violet-100 text-violet-700",
  // Amber, not the sky blue of 仮押さえ — this one needs action.
  expired: "bg-amber-100 text-amber-800",
};

export default async function AdminPage() {
  const bookings = await listBookings();
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  // What each booking was actually charged (snapshotted at request time), so
  // the revenue totals stay correct after a price change.
  const amountOf = (b: (typeof bookings)[number]) => chargedAmount(b);
  // Money actually received (captured and not refunded).
  const receivedTotal = bookings
    .filter((b) => b.payment === "captured")
    .reduce((sum, b) => sum + amountOf(b), 0);
  // Money refunded back to customers.
  const refundedTotal = bookings
    .filter((b) => b.payment === "refunded")
    .reduce((sum, b) => sum + (b.refundAmount ?? 0), 0);
  // Rows for the monthly tour-schedule table (past / upcoming tabs).
  const scheduleRows: ScheduleRow[] = bookings.map((b) => ({
    id: b.id,
    name: b.name,
    planName: b.planName,
    preferredDate: b.preferredDate,
    amount: amountOf(b),
    status: b.status,
    payment: b.payment,
    refundAmount: b.refundAmount,
  }));

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-slate-50 px-4 py-10 text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900">
        Mokaru Guam 予約管理
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        リクエスト予約の確認・確定/お断り・キャンセルを行います。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="リクエスト総数" value={bookings.length} />
        <Stat label="確認待ち" value={pending} highlight={pending > 0} />
        <Stat label="確定済み" value={confirmed} />
        <Stat
          label="お断り/キャンセル"
          value={bookings.filter((b) => b.status === "declined" || b.status === "cancelled").length}
        />
        <Stat label="入金合計（確定分）" value={`$${receivedTotal.toFixed(2)}`} money />
        <Stat label="返金合計" value={`$${refundedTotal.toFixed(2)}`} muted />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">お客様</th>
              <th className="px-4 py-3 font-medium">プラン / 希望</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">連絡先</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  まだリクエストはありません。
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const amount = amountOf(b);
                return (
                <tr key={b.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.guests}名</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(b.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p className="font-medium">{b.partnerName || b.planName}</p>
                    <p className="text-xs text-slate-400">希望：{b.preferredDate}</p>
                    {/* 🔴 The answer the owner needs the moment the restaurant
                        says no. Without it on screen the arrangement stops and
                        turns into an email exchange — the wait that outlives
                        the hold and sends the booking through /repay. */}
                    {b.fallbackChoice && (
                      <p
                        className={`mt-1 text-xs font-medium ${
                          b.fallbackChoice === "suggest"
                            ? "text-amber-700"
                            : "text-slate-500"
                        }`}
                      >
                        満席なら：
                        {b.fallbackChoice === "suggest"
                          ? "別の店を提案（1件まで）"
                          : "キャンセル（請求しない）"}
                      </p>
                    )}
                    {(b.budgetHint || b.cuisineHint) && (
                      <p className="text-xs text-slate-500">
                        {[b.budgetHint, b.cuisineHint].filter(Boolean).join("／")}
                      </p>
                    )}
                    {/* Where to drive on the day. Blank for bookings taken
                        before 2026-08-30, when the field did not exist. */}
                    {b.hotel && (
                      <p className="text-xs font-medium text-slate-500">
                        宿泊先：{b.hotel}
                      </p>
                    )}
                    {b.spots && (
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        行きたい：{b.spots}
                      </p>
                    )}
                    {b.notes && (
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        備考：{b.notes}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    <p>{b.email}</p>
                    <p className="text-xs text-slate-400">{b.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status]}`}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>
                    <span
                      className={`mt-1 block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_STYLE[b.payment]}`}
                    >
                      {PAYMENT_LABEL[b.payment]}
                    </span>
                    {b.payment === "authorized" && (
                      <span className="mt-1 block text-[11px] font-semibold text-sky-700">
                        仮押さえ ${amount.toFixed(2)}
                      </span>
                    )}
                    {b.payment === "captured" && (
                      <span className="mt-1 block text-[11px] font-semibold text-emerald-700">
                        入金 ${amount.toFixed(2)}
                      </span>
                    )}
                    {/* A dead hold is only actionable if the way back is in
                        reach. Printing the link here means the owner can copy
                        it into a reply without going to look for it. */}
                    {b.payment === "expired" && (
                      <span className="mt-1 block max-w-[14rem] text-[11px] text-amber-800">
                        再手続きのご案内リンク：
                        <span className="mt-0.5 block break-all font-mono text-[10px] text-slate-500">
                          {repayUrl(b.id, SITE_URL)}
                        </span>
                      </span>
                    )}
                    {b.payment === "refunded" && b.refundAmount != null && (
                      <span className="mt-1 block text-[11px] text-slate-500">
                        決済 ${amount.toFixed(2)} → 返金 ${b.refundAmount.toFixed(2)}
                        {b.refundRate != null && `（${Math.round(b.refundRate * 100)}%）`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BookingActions
                      id={b.id}
                      status={b.status}
                      tourDate={b.preferredDate}
                      requestType={b.requestType}
                    />
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        ※ 決済は PayPal（仮押さえ→確定）。「確定」で仮押さえをキャプチャ（決済確定）、「お断り」で
        仮押さえを解除（voided）。
        {/* 🔴 二経路で規則が違う。片方だけ書くと、もう片方で必ず誤操作になる。 */}
        <br />
        ※ 確定済みの「キャンセル」の返金は依頼の種類で変わります。
        <b>ツアー・2026-09-30以前の貸切</b>は実施日基準
        （8日以上前=全額／7〜4日前=50%／3日前以降=返金なし）。
        <b>レストラン予約代行</b>はお席のお手配が完了した時点で
        <b>返金なし</b>（手配料は席を取る作業に対する料金で、日付では変わりません）。
        お店都合・自社都合で取りやめる場合は「全額返金でキャンセル」を使ってください
        （種類・日付に関わらず全額返金）。
        <br />
        ※ PayPal未設定の環境では状態管理のみ行います。ローカルではJSON、本番ではSupabaseに保存されます。
      </p>

      <TourSchedule rows={scheduleRows} />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  money,
  muted,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  money?: boolean; // received-money card (emerald)
  muted?: boolean; // refunded-money card (slate)
}) {
  const border = highlight
    ? "border-amber-200 bg-amber-50"
    : money
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-white";
  const valueColor = money ? "text-emerald-700" : muted ? "text-slate-500" : "text-slate-900";
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${border}`}>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
