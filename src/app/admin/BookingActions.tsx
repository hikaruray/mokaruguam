"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingStatus } from "@/lib/store";
import { refundRateForDate } from "@/lib/pricing";

export default function BookingActions({
  id,
  status,
  tourDate,
}: {
  id: string;
  status: BookingStatus;
  tourDate: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "confirm" | "decline" | "cancel" | "cancel-full") {
    if (action === "cancel") {
      const { rate, tier } = refundRateForDate(tourDate);
      const msg =
        `この予約をキャンセルします。\n` +
        `キャンセルポリシー：${tier}\n` +
        `返金率：${Math.round(rate * 100)}%\n\n` +
        `実行しますか？`;
      if (!confirm(msg)) return;
    }
    if (action === "cancel-full") {
      if (!confirm("全額返金してキャンセルします（天候・自社都合）。実行しますか？")) return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      // Surface failures. Money operations (capture / void / refund) must never
      // fail silently — the owner has to know if a charge or refund didn't go
      // through, so it can be retried instead of assumed done.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "処理に失敗しました。もう一度お試しください。");
        return;
      }
      router.refresh();
    } catch {
      setErr("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  // Small red error note shown under the action buttons on failure.
  const errNote = err ? (
    <span className="mt-1 block max-w-[10rem] text-[11px] font-medium text-rose-600">
      {err}
    </span>
  ) : null;

  if (status === "pending") {
    return (
      <span className="inline-flex flex-col items-end">
        <span className="inline-flex gap-2">
          <button
            onClick={() => act("confirm")}
            disabled={busy}
            className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            確定
          </button>
          <button
            onClick={() => act("decline")}
            disabled={busy}
            className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:opacity-50"
          >
            お断り
          </button>
        </span>
        {errNote}
      </span>
    );
  }

  if (status === "confirmed") {
    const { rate } = refundRateForDate(tourDate);
    return (
      <span className="inline-flex flex-col items-end gap-1.5">
        <button
          onClick={() => act("cancel")}
          disabled={busy}
          className="rounded-md bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-50"
        >
          キャンセル（返金 {Math.round(rate * 100)}%）
        </button>
        <button
          onClick={() => act("cancel-full")}
          disabled={busy}
          className="rounded-md px-3 py-1 text-[11px] font-medium text-slate-400 underline underline-offset-2 transition hover:text-slate-600 disabled:opacity-50"
        >
          全額返金でキャンセル
        </button>
        {errNote}
      </span>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}
