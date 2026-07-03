"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingStatus } from "@/lib/store";

export default function BookingActions({
  id,
  status,
}: {
  id: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "confirm" | "decline" | "cancel") {
    if (action === "cancel" && !confirm("この予約をキャンセルにしますか？")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "pending") {
    return (
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
    );
  }

  if (status === "confirmed") {
    return (
      <button
        onClick={() => act("cancel")}
        disabled={busy}
        className="rounded-md bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-50"
      >
        キャンセル
      </button>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}
