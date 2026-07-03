"use client";

import { useState } from "react";
import { PLANS } from "@/lib/pricing";

type State = "idle" | "sending" | "sent" | "error";

export default function BookingForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      planId: String(fd.get("planId") || ""),
      preferredDate: String(fd.get("preferredDate") || ""),
      guests: Number(fd.get("guests") || 0),
      spots: String(fd.get("spots") || ""),
      notes: String(fd.get("notes") || ""),
    };

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました。時間をおいて再度お試しください。");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl bg-white p-6 text-ink">
        <div className="text-lg font-bold text-brand">リクエストを受け付けました</div>
        <p className="mt-2 text-sm text-muted">
          ガイド・車両の空き状況を確認し、<b>7日以内</b>にご連絡します。
          この時点ではまだ料金は発生しません。折り返しのご連絡をお待ちください。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 text-ink">
      <div className="text-base font-bold">リクエスト予約フォーム</div>

      <Field label="お名前" name="name" placeholder="山田 太郎" required />
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label="メールアドレス" name="email" type="email" placeholder="you@example.com" required />
        <Field label="電話 / LINE ID" name="phone" placeholder="連絡のつく番号など" required />
      </div>

      <label className="mt-3 block text-xs font-bold">ご希望プラン</label>
      <select
        name="planId"
        defaultValue="middle"
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
      >
        {PLANS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}（{p.hours}・${p.base}〜）
          </option>
        ))}
      </select>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label="ご希望日・時間帯" name="preferredDate" placeholder="例：7/20 午後" required />
        <div>
          <label className="mt-3 block text-xs font-bold">ご参加人数</label>
          <input
            type="number"
            name="guests"
            min={1}
            max={7}
            defaultValue={4}
            required
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <label className="mt-3 block text-xs font-bold">行きたいスポット（自由記入）</label>
      <textarea
        name="spots"
        placeholder="例：恋人岬、スペイン広場、エメラルドバレー…"
        className="mt-1.5 min-h-[78px] w-full resize-y rounded-lg border border-line px-3 py-2.5 text-sm"
      />

      <label className="mt-3 block text-xs font-bold">その他ご要望（任意）</label>
      <textarea
        name="notes"
        placeholder="お子様連れ・記念日・食事の希望など"
        className="mt-1.5 min-h-[56px] w-full resize-y rounded-lg border border-line px-3 py-2.5 text-sm"
      />

      {state === "error" && (
        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 w-full rounded-full bg-[#06c755] px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-50"
      >
        {state === "sending" ? "送信中…" : "この内容でリクエストする"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        送信後、7日以内に空き状況をご連絡します。この時点では料金は発生しません。
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mt-3 block text-xs font-bold">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
      />
    </div>
  );
}
