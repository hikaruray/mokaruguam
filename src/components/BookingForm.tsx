"use client";

import { useCallback, useRef, useState } from "react";
import {
  PLANS,
  priceFor,
  isPeakDate,
  START_TIMES,
  TIME_BANDS,
  endTimeFor,
  startTimesForPlan,
} from "@/lib/pricing";
import { PAYPAL_ENABLED } from "@/lib/config";
import PaypalCheckout from "./PaypalCheckout";

type State = "idle" | "sending" | "sent" | "error";

interface FormValues {
  name: string;
  email: string;
  phone: string;
  planId: string;
  tourDate: string;      // ISO date (YYYY-MM-DD) — drives peak-season pricing
  startTime: string;     // e.g. "9:00" (plan-linked, from START_TIMES)
  preferredDate: string; // combined "YYYY-MM-DD 9:00" saved to the store
  guests: number;
  spots: string;
  notes: string;
}

const DEFAULT_PLAN = "middle";

export default function BookingForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false); // true when the request was authorized
  // Payment step (PayPal only): holds the validated form data.
  const [payStep, setPayStep] = useState<FormValues | null>(null);
  // Live total + peak flag for the current plan/guest/date selection (display).
  const [total, setTotal] = useState<number>(() => priceFor(PLANS[1], 4));
  const [peak, setPeak] = useState(false);
  // Controlled: plan drives the start-time options; start time resets if the
  // new plan doesn't offer the currently-selected time.
  const [planId, setPlanId] = useState<string>(DEFAULT_PLAN);
  const [startTime, setStartTime] = useState<string>("");
  const savedValues = useRef<FormValues | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === planId) ?? PLANS[1];

  function onPlanChange(newPlanId: string) {
    setPlanId(newPlanId);
    // Reset the start time if it isn't valid for the new plan.
    if (startTime && !startTimesForPlan(newPlanId).includes(startTime)) {
      setStartTime("");
    }
  }

  function recalcTotal(form: HTMLFormElement) {
    const fd = new FormData(form);
    const guests = Number(fd.get("guests") || 0);
    const isPeak = isPeakDate(String(fd.get("tourDate") || ""));
    setPeak(isPeak);
    setTotal(priceFor(selectedPlan, Math.max(1, guests || 1), isPeak));
  }

  function readForm(form: HTMLFormElement): FormValues {
    const fd = new FormData(form);
    const tourDate = String(fd.get("tourDate") || "");
    return {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      planId,
      tourDate,
      startTime,
      preferredDate: [tourDate, startTime].filter(Boolean).join(" "),
      guests: Number(fd.get("guests") || 0),
      spots: String(fd.get("spots") || ""),
      notes: String(fd.get("notes") || ""),
    };
  }

  // Finalize: POST to /api/booking (optionally with the PayPal order id).
  const finalize = useCallback(
    async (values: FormValues, paypalOrderId?: string) => {
      setState("sending");
      setError("");
      try {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, paypalOrderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "送信に失敗しました。時間をおいて再度お試しください。");
          setState("error");
          return;
        }
        setPaid(Boolean(data.authorized));
        setState("sent");
      } catch {
        setError("通信エラーが発生しました。時間をおいて再度お試しください。");
        setState("error");
      }
    },
    [],
  );

  // Request-only submit (no PayPal): send immediately.
  function onSubmitRequestOnly(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    finalize(readForm(e.currentTarget));
  }

  // PayPal path: validate the form, then move to the payment step.
  function onProceedToPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = readForm(e.currentTarget);
    savedValues.current = values;
    setError("");
    setPayStep(values);
  }

  // Called by PaypalCheckout to create the AUTHORIZE order (server-priced).
  const createOrder = useCallback(async (): Promise<string> => {
    const v = savedValues.current;
    if (!v) throw new Error("no form values");
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: v.planId,
        guests: v.guests,
        tourDate: v.tourDate,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(data.error || "order failed");
    }
    return data.id as string;
  }, []);

  const onApproved = useCallback(
    (orderId: string) => {
      if (savedValues.current) finalize(savedValues.current, orderId);
    },
    [finalize],
  );

  const onPaypalError = useCallback((message: string) => {
    setError(message);
  }, []);

  // --- Confirmation ---------------------------------------------------------
  if (state === "sent") {
    return (
      <div className="rounded-2xl bg-white p-6 text-ink">
        <div className="text-lg font-bold text-brand">リクエストを受け付けました</div>
        {paid ? (
          <p className="mt-2 text-sm text-muted">
            お支払いは<b>仮押さえ</b>の状態です。ガイド・車両の空きを確認し、
            <b>7日以内</b>にご連絡します。予約確定時にお支払いが確定し、お手配できない場合は
            <b>自動で解除（返金）</b>されます。
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            ガイド・車両の空き状況を確認し、<b>7日以内</b>にご連絡します。
            この時点ではまだ料金は発生しません。折り返しのご連絡をお待ちください。
          </p>
        )}
      </div>
    );
  }

  // --- Payment step (PayPal only) ------------------------------------------
  if (payStep) {
    const plan = PLANS.find((p) => p.id === payStep.planId) ?? PLANS[1];
    const isPeak = isPeakDate(payStep.tourDate);
    const amount = priceFor(plan, Math.max(1, payStep.guests || 1), isPeak);
    return (
      <div className="rounded-2xl bg-white p-6 text-ink">
        <div className="text-base font-bold">お支払い（全額前払い）</div>
        <div className="mt-3 rounded-xl bg-sand p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">
              {plan.name}／{payStep.guests}名
              {isPeak && (
                <span className="ml-1 rounded bg-[#fff3d6] px-1.5 py-0.5 text-[11px] font-bold text-[#9a6a00]">
                  繁忙期料金
                </span>
              )}
            </span>
            <span className="text-lg font-bold text-brand">${amount.toFixed(2)}</span>
          </div>
          {(payStep.tourDate || payStep.startTime) && (
            <p className="mt-1 text-xs text-muted">
              {payStep.tourDate}
              {payStep.startTime &&
                ` ${payStep.startTime} 開始（〜${endTimeFor(payStep.startTime, plan.durationHours)}）`}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            お支払いはこの時点で<b>仮押さえ</b>されます。予約が確定すると決済が確定し、
            お手配できない場合は<b>自動で解除</b>されます。
          </p>
        </div>

        <div className="mt-4">
          <PaypalCheckout
            createOrder={createOrder}
            onApproved={onApproved}
            onError={onPaypalError}
          />
        </div>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        {state === "sending" && (
          <p className="mt-3 text-center text-sm text-muted">予約を確定しています…</p>
        )}

        <button
          type="button"
          onClick={() => setPayStep(null)}
          className="mt-4 w-full rounded-full border border-line px-4 py-2.5 text-sm font-medium text-muted"
        >
          ← 入力内容を修正する
        </button>
      </div>
    );
  }

  // --- Form -----------------------------------------------------------------
  return (
    <form
      onSubmit={PAYPAL_ENABLED ? onProceedToPayment : onSubmitRequestOnly}
      onChange={(e) => recalcTotal(e.currentTarget)}
      className="rounded-2xl bg-white p-6 text-ink"
    >
      <div className="text-base font-bold">リクエスト予約フォーム</div>

      <Field label="お名前" name="name" placeholder="山田 太郎" required />
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label="メールアドレス" name="email" type="email" placeholder="you@example.com" required />
        <Field label="電話 / LINE ID" name="phone" placeholder="連絡のつく番号など" required />
      </div>

      <label className="mt-3 block text-xs font-bold">ご希望プラン</label>
      <select
        name="planId"
        value={planId}
        onChange={(e) => onPlanChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
      >
        {PLANS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}（{p.hours}・${p.base}〜）
          </option>
        ))}
      </select>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <div>
          <label className="mt-3 block text-xs font-bold">ツアー実施日</label>
          <input
            type="date"
            name="tourDate"
            required
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
          />
        </div>
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

      {/* Plan-linked start time. Options switch with the plan; end time shown. */}
      <label className="mt-3 block text-xs font-bold">ご希望の開始時間</label>
      <select
        name="startTime"
        required
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
      >
        <option value="" disabled>
          開始時間をお選びください
        </option>
        {TIME_BANDS.map((band) => {
          const times = START_TIMES[planId]?.[band] ?? [];
          if (times.length === 0) return null;
          return (
            <optgroup key={band} label={band}>
              {times.map((t) => (
                <option key={t} value={t}>
                  {t} 開始（〜{endTimeFor(t, selectedPlan.durationHours)}）
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      <p className="mt-1.5 text-xs text-muted">
        選択された時間はご希望です。空き状況により前後をご提案する場合があります。
      </p>

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

      {PAYPAL_ENABLED && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-sand px-4 py-3 text-sm">
          <span className="text-muted">
            お支払い予定額（全額前払い）
            {peak && (
              <span className="ml-1 rounded bg-[#fff3d6] px-1.5 py-0.5 text-[11px] font-bold text-[#9a6a00]">
                繁忙期料金
              </span>
            )}
          </span>
          <span className="text-lg font-bold text-brand">${total.toFixed(2)}</span>
        </div>
      )}

      {state === "error" && (
        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 w-full rounded-full bg-brand px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {PAYPAL_ENABLED
          ? "お支払いに進む"
          : state === "sending"
            ? "送信中…"
            : "この内容でリクエストする"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        {PAYPAL_ENABLED
          ? "確定時に決済が確定します。お手配できない場合は自動で解除されます。"
          : "送信後、7日以内に空き状況をご連絡します。この時点では料金は発生しません。"}
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
