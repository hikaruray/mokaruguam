"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error";

export default function CancelConfirm({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [refund, setRefund] = useState<{ rate: number; amount: number } | null>(
    null,
  );
  const [alreadyCancelled, setAlreadyCancelled] = useState(false);

  async function onCancel() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "キャンセルに失敗しました。時間をおいて再度お試しください。");
        setState("error");
        return;
      }
      setRefund(data.refund ?? null);
      setAlreadyCancelled(Boolean(data.alreadyCancelled));
      setState("done");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm">
        <div className="text-lg font-bold text-emerald-700">
          {alreadyCancelled
            ? "この予約は既にキャンセル済みです"
            : "キャンセルを承りました"}
        </div>
        {refund && refund.rate > 0 ? (
          <p className="mt-2 text-emerald-800">
            返金率 {Math.round(refund.rate * 100)}%（$
            {refund.amount.toFixed(2)}）で返金手続きを行いました。ご利用の決済方法に反映されます。
          </p>
        ) : (
          <p className="mt-2 text-emerald-800">
            {alreadyCancelled
              ? "新たな請求や返金はありません。"
              : "手続きが完了しました。規定により返金対象がない場合、請求はそのままとなります。"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={state === "sending"}
        className="w-full rounded-full bg-rose-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
      >
        {state === "sending" ? "処理中…" : "この予約をキャンセルする"}
      </button>
      {state === "error" && (
        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
      )}
      <p className="mt-2 text-center text-xs text-muted">
        キャンセルは取り消せません。内容をご確認のうえお進みください。
      </p>
    </div>
  );
}
