"use client";

import { useCallback, useState } from "react";
import PaypalCheckout from "@/components/PaypalCheckout";
import { PAYPAL_ENABLED } from "@/lib/config";

type State = "idle" | "saving" | "done" | "error";

// The payment half of /repay. Deliberately the same two-step shape as the
// booking form: the server creates the AUTHORIZE order (so the amount is never
// the browser's to choose), PayPal collects the card, and the approved order id
// comes back here to be turned into a hold on the server.
export default function RepayForm({
  token,
  amount,
}: {
  token: string;
  amount: number;
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const createOrder = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/booking/repay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(data.error || "order failed");
    }
    return data.id as string;
  }, [token]);

  const onApproved = useCallback(
    async (paypalOrderId: string) => {
      setState("saving");
      setError("");
      try {
        const res = await fetch("/api/booking/repay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, paypalOrderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          // 🔴 The hold may well exist at this point even though saving it
          // failed, so never invite an immediate retry: that is how one table
          // ends up with two holds. The server releases what it could not
          // record; the guest is told to wait and, if in doubt, to ask us.
          setError(
            data.error ||
              "お手続きを完了できませんでした。時間をおいて再度お試しください。",
          );
          setState("error");
          return;
        }
        setState("done");
      } catch {
        setError("通信エラーが発生しました。時間をおいて再度お試しください。");
        setState("error");
      }
    },
    [token],
  );

  if (state === "done") {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm">
        <div className="text-lg font-bold text-emerald-700">
          お手続きを承りました
        </div>
        <p className="mt-2 text-emerald-800">
          手配料 ${amount.toFixed(2)} をお預かり（仮押さえ）しました。まだ請求されていません。
        </p>
        <p className="mt-2 text-emerald-800">
          これからお店へお席の確保をご依頼します。結果はメールでご連絡します。お席をご用意できなかった場合は仮押さえを解除し、料金は発生しません。
        </p>
      </div>
    );
  }

  if (!PAYPAL_ENABLED) {
    // Our configuration, not their card — say which, and do not leave them
    // pressing a button that cannot work.
    return (
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-muted">
        ただいまオンラインでのお手続きを受け付けられません。お手数ですがメールでご連絡ください。
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5">
      <p className="text-sm font-bold text-ink">
        手配料 ${amount.toFixed(2)} のお支払い手続き
      </p>
      <div className="mt-4">
        <PaypalCheckout
          createOrder={createOrder}
          onApproved={onApproved}
          onError={(message) => {
            setError(message);
            setState("error");
          }}
        />
      </div>
      {state === "saving" && (
        <p className="mt-3 text-center text-sm text-muted">処理中…</p>
      )}
      {state === "error" && (
        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}
