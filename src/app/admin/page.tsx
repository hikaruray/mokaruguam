import { listBookings, type BookingStatus } from "@/lib/store";
import BookingActions from "./BookingActions";

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

export default async function AdminPage() {
  const bookings = await listBookings();
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-slate-50 px-4 py-10 text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900">
        Mokaru Guam 予約管理
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        リクエスト予約の確認・確定/お断り・キャンセルを行います。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="リクエスト総数" value={bookings.length} />
        <Stat label="確認待ち" value={pending} highlight={pending > 0} />
        <Stat label="確定済み" value={confirmed} />
        <Stat
          label="お断り/キャンセル"
          value={bookings.filter((b) => b.status === "declined" || b.status === "cancelled").length}
        />
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
              bookings.map((b) => (
                <tr key={b.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.guests}名</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(b.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p className="font-medium">{b.planName}</p>
                    <p className="text-xs text-slate-400">希望：{b.preferredDate}</p>
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
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BookingActions id={b.id} status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        ※ 決済（Stripe）は将来フェーズのため未実装です。現在は確定/お断り/キャンセルの
        状態管理のみ行います。ローカルではJSON、本番ではSupabaseに保存されます。
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
