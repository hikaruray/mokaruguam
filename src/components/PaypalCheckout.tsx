"use client";

import { useEffect, useRef, useState } from "react";
import { PAYPAL_CLIENT_ID } from "@/lib/config";

// Minimal typings for the parts of the PayPal JS SDK we use.
interface PaypalNamespace {
  Buttons: (opts: unknown) => { render: (sel: HTMLElement) => Promise<void> };
  CardFields: (opts: unknown) => {
    isEligible: () => boolean;
    NumberField: () => { render: (sel: HTMLElement) => Promise<void> };
    ExpiryField: () => { render: (sel: HTMLElement) => Promise<void> };
    CVVField: () => { render: (sel: HTMLElement) => Promise<void> };
    submit: () => Promise<void>;
  };
}
declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

let sdkPromise: Promise<void> | null = null;

// Standard PayPal Checkout (the PayPal Buttons: "Pay with PayPal" + guest card
// via PayPal's own hosted flow) works with the account's live "PayPal payments"
// permission. The Advanced Card Fields path (direct card entry on our own page)
// additionally requires PayPal's separate "Advanced Card Payments" (ACDC)
// approval, which is still pending. Keep it OFF until approved, then flip this
// to true to re-enable on-page card fields.
const USE_ADVANCED_CARD = false;

// Load the PayPal JS SDK once. intent=authorize (hold, not charge).
function loadSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.paypal) return resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": PAYPAL_CLIENT_ID,
      currency: "USD",
      intent: "authorize",
      components: USE_ADVANCED_CARD ? "buttons,card-fields" : "buttons",
    });
    s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.body.appendChild(s);
  });
  return sdkPromise;
}

export interface PaypalCheckoutProps {
  // Server creates the AUTHORIZE order and returns its id.
  createOrder: () => Promise<string>;
  // Buyer approved; hand the order id back to the parent to finalize.
  onApproved: (orderId: string) => void;
  onError: (message: string) => void;
}

// Renders Advanced Card Fields (buyer needs no PayPal account) when eligible,
// otherwise falls back to the PayPal Buttons (which include guest card pay).
export default function PaypalCheckout({
  createOrder,
  onApproved,
  onError,
}: PaypalCheckoutProps) {
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"loading" | "card" | "buttons" | "failed">(
    "loading",
  );
  const [submitting, setSubmitting] = useState(false);
  const cardFieldsRef = useRef<ReturnType<PaypalNamespace["CardFields"]> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    loadSdk()
      .then(async () => {
        if (cancelled) return;
        const paypal = window.paypal;
        if (!paypal) throw new Error("PayPal SDK unavailable");

        // Advanced Card Fields (direct card entry on our page) — only when the
        // account is approved for Advanced Card Payments (ACDC). Disabled for now.
        if (USE_ADVANCED_CARD) {
          const cardFields = paypal.CardFields({
            createOrder: () => createOrder(),
            onApprove: (data: { orderID: string }) => onApproved(data.orderID),
            onError: () => onError("カード情報の処理でエラーが発生しました。"),
          });

          if (cardFields.isEligible() && cardWrapRef.current) {
            cardFieldsRef.current = cardFields;
            const nEl = cardWrapRef.current.querySelector<HTMLElement>("#pp-card-number");
            const eEl = cardWrapRef.current.querySelector<HTMLElement>("#pp-card-expiry");
            const cEl = cardWrapRef.current.querySelector<HTMLElement>("#pp-card-cvv");
            if (nEl && eEl && cEl) {
              await cardFields.NumberField().render(nEl);
              await cardFields.ExpiryField().render(eEl);
              await cardFields.CVVField().render(cEl);
              if (!cancelled) setMode("card");
              return;
            }
          }
        }

        // Standard PayPal Buttons: "Pay with PayPal" + guest Debit/Credit Card
        // via PayPal's hosted flow (works with live PayPal payments; no ACDC).
        if (buttonsRef.current) {
          await paypal
            .Buttons({
              createOrder: () => createOrder(),
              onApprove: (data: { orderID: string }) => onApproved(data.orderID),
              onError: () => onError("決済処理でエラーが発生しました。"),
            })
            .render(buttonsRef.current);
          if (!cancelled) setMode("buttons");
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setMode("failed");
          onError("決済の読み込みに失敗しました。");
        }
      });

    return () => {
      cancelled = true;
    };
    // createOrder/onApproved/onError are stable from the parent (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCard() {
    if (!cardFieldsRef.current) return;
    setSubmitting(true);
    try {
      await cardFieldsRef.current.submit(); // triggers onApprove on success
    } catch {
      onError("カードの承認に失敗しました。内容をご確認ください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {mode === "loading" && (
        <p className="py-4 text-center text-sm text-muted">決済フォームを読み込み中…</p>
      )}

      {/* Advanced Card Fields (hosted) */}
      <div className={mode === "card" ? "block" : "hidden"} ref={cardWrapRef}>
        <label className="mt-1 block text-xs font-bold">カード番号</label>
        <div id="pp-card-number" className="mt-1.5 rounded-lg border border-line px-1" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mt-3 block text-xs font-bold">有効期限</label>
            <div id="pp-card-expiry" className="mt-1.5 rounded-lg border border-line px-1" />
          </div>
          <div>
            <label className="mt-3 block text-xs font-bold">CVV</label>
            <div id="pp-card-cvv" className="mt-1.5 rounded-lg border border-line px-1" />
          </div>
        </div>
        <button
          type="button"
          onClick={submitCard}
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-brand px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "処理中…" : "カードで支払って予約リクエスト"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          カード情報は PayPal が安全に処理します（PayPalアカウントは不要）。
        </p>
      </div>

      {/* Buttons fallback */}
      <div className={mode === "buttons" ? "block" : "hidden"}>
        <div ref={buttonsRef} />
        <p className="mt-2 text-center text-xs text-muted">
          PayPal またはカード（ゲスト）でお支払いいただけます。
        </p>
      </div>

      {mode === "failed" && (
        <p className="py-3 text-center text-sm text-rose-600">
          決済フォームを読み込めませんでした。時間をおいて再度お試しください。
        </p>
      )}
    </div>
  );
}
