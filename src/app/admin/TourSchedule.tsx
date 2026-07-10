"use client";

import { useMemo, useState } from "react";
import type { BookingStatus, PaymentStatus } from "@/lib/store";

// One row of the schedule table. `amount` is the server-computed charge for the
// booking; `refundAmount` is what was refunded (if any).
export interface ScheduleRow {
  id: string;
  name: string;
  planName: string;
  preferredDate: string;
  amount: number;
  status: BookingStatus;
  payment: PaymentStatus;
  refundAmount: number | null;
}

// Booking-state label (予約ステータス).
function bookingLabel(r: ScheduleRow): { text: string; cls: string } {
  if (r.status === "confirmed") return { text: "確定", cls: "bg-emerald-100 text-emerald-700" };
  if (r.status === "declined") return { text: "お断り", cls: "bg-rose-100 text-rose-700" };
  if (r.status === "cancelled") return { text: "キャンセル", cls: "bg-slate-200 text-slate-600" };
  if (r.payment === "authorized") return { text: "仮押さえ", cls: "bg-sky-100 text-sky-700" };
  return { text: "確認待ち", cls: "bg-amber-100 text-amber-700" };
}

// Net money the business actually keeps (金額ステータス / 受取額).
function received(r: ScheduleRow): { text: string; value: number } {
  switch (r.payment) {
    case "captured":
      return { text: `受取 $${r.amount.toFixed(2)}`, value: r.amount };
    case "refunded": {
      const net = Math.max(0, r.amount - (r.refundAmount ?? 0));
      return {
        text:
          net === 0
            ? "$0.00（全額返金）"
            : `受取 $${net.toFixed(2)}（返金後）`,
        value: net,
      };
    }
    case "authorized":
      return { text: `仮押さえ $${r.amount.toFixed(2)}`, value: 0 };
    case "voided":
      return { text: "$0.00（解除）", value: 0 };
    default:
      return { text: "—", value: 0 };
  }
}

// Parse the "YYYY-MM-DD ..." tour date to a local Date (date-only).
function tourDate(preferredDate: string): Date | null {
  const m = preferredDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

const MONEY_STATES: PaymentStatus[] = ["captured", "refunded"];

export default function TourSchedule({ rows }: { rows: ScheduleRow[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const withDate = rows.map((r) => ({ r, d: tourDate(r.preferredDate) }));
    const up = withDate
      .filter(({ d }) => !d || d.getTime() >= today.getTime())
      .sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity));
    const pa = withDate
      .filter(({ d }) => d && d.getTime() < today.getTime())
      .sort((a, b) => (b.d?.getTime() ?? 0) - (a.d?.getTime() ?? 0));
    return { upcoming: up, past: pa };
  }, [rows]);

  const list = tab === "upcoming" ? upcoming : past;

  // Group rows by "YYYY年M月" (based on tour date), preserving list order.
  const groups = useMemo(() => {
    const map = new Map<string, typeof list>();
    for (const item of list) {
      const key = item.d
        ? `${item.d.getFullYear()}年${item.d.getMonth() + 1}月`
        : "日付未設定";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [list]);

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-slate-900">ツアー予定表（月別）</h2>
      <p className="mt-1 text-sm text-slate-500">
        ツアー実施日の順に表示します。「受取額」は決済確定分（返金後の手取り）です。
      </p>

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
        <button
          onClick={() => setTab("upcoming")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            tab === "upcoming"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          今後の予定（{upcoming.length}）
        </button>
        <button
          onClick={() => setTab("past")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            tab === "past"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          過去（{past.length}）
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ツアー予定日</th>
              <th className="px-4 py-3 font-medium">お客様</th>
              <th className="px-4 py-3 font-medium">コース</th>
              <th className="px-4 py-3 text-right font-medium">金額</th>
              <th className="px-4 py-3 font-medium">予約状況</th>
              <th className="px-4 py-3 text-right font-medium">受取額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {tab === "upcoming" ? "今後の予定はありません。" : "過去の記録はありません。"}
                </td>
              </tr>
            ) : (
              groups.map(([month, items]) => {
                // Monthly subtotal of money actually kept.
                const monthNet = items
                  .filter(({ r }) => MONEY_STATES.includes(r.payment))
                  .reduce((sum, { r }) => sum + received(r).value, 0);
                return (
                  <FragmentRows key={month} month={month} monthNet={monthNet} items={items} />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRows({
  month,
  monthNet,
  items,
}: {
  month: string;
  monthNet: number;
  items: { r: ScheduleRow; d: Date | null }[];
}) {
  return (
    <>
      <tr className="bg-slate-50/70">
        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-slate-600">
          {month}
        </td>
        <td className="px-4 py-2 text-right text-xs font-bold text-emerald-700">
          受取合計 ${monthNet.toFixed(2)}
        </td>
      </tr>
      {items.map(({ r, d }) => {
        const bl = bookingLabel(r);
        const rec = received(r);
        const timePart = r.preferredDate.replace(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*/, "");
        return (
          <tr key={r.id} className="hover:bg-slate-50">
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {d
                ? `${d.getMonth() + 1}/${d.getDate()}`
                : "日付未設定"}
              {timePart && <span className="ml-1 text-xs text-slate-400">{timePart}</span>}
            </td>
            <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
            <td className="px-4 py-3 text-slate-600">{r.planName}</td>
            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
              ${r.amount.toFixed(2)}
            </td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${bl.cls}`}>
                {bl.text}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
              {rec.text}
            </td>
          </tr>
        );
      })}
    </>
  );
}
