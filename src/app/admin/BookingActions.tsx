"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingStatus, FallbackChoice, RequestType } from "@/lib/store";
import { refundDecision } from "@/lib/refund-policy";

// 🔴 refundDecision, NOT refundRateForDate.
//
// These buttons print the refund the owner is about to give. They used to
// compute it with the tour date ladder regardless of what the booking was, so
// a restaurant cancellation offered「キャンセル（返金 100%）」and then returned
// nothing. That is worse than the same bug on the guest's page: the owner
// tells the guest they refunded it, sees no refund in PayPal, refunds by hand,
// and the books and the real balance stop agreeing.
export default function BookingActions({
  id,
  status,
  tourDate,
  // null for a charter taken before the pivot — refundDecision reads that as
  // "the rules it was booked under", which is exactly right.
  requestType,
  fallbackChoice,
}: {
  id: string;
  status: BookingStatus;
  tourDate: string;
  requestType: RequestType | null;
  fallbackChoice: FallbackChoice | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // 送客メール: the address is typed per booking. Partner and restaurant
  // addresses are not stored anywhere, deliberately — a wrong address saved
  // once would be reused silently on every booking after it.
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchTo, setDispatchTo] = useState("");
  const [sentSubject, setSentSubject] = useState<string | null>(null);
  // Proposal branch: the alternative offered, and — once the guest accepts —
  // the restaurant actually booked, so the confirmation names the right one.
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposal, setProposal] = useState("");
  const [venue, setVenue] = useState("");
  const canPropose = requestType === "restaurant" && fallbackChoice === "suggest";

  // Mails that change nothing on the booking: 送客メール and the two status
  // mails. One path, so all three report failure and success the same way.
  async function sendNote(
    action: "dispatch" | "status-waiting" | "status-proposal",
    extra: Record<string, string>,
    question: string,
  ) {
    if (!confirm(question)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "送信に失敗しました。もう一度お試しください。");
        return;
      }
      // No refresh: nothing about the booking changed. What the owner needs
      // is proof of what went out, so the subject stays on screen.
      setSentSubject(data.subject ?? "送信しました");
      setDispatchOpen(false);
      setProposalOpen(false);
    } catch {
      setErr("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "confirm" | "decline" | "cancel" | "cancel-full") {
    if (action === "confirm" && venue.trim()) {
      if (!confirm(`「${venue.trim()}」で確定します。\nお客様への確定メールにはこのお店の名前が載ります。実行しますか？`)) return;
    }
    if (action === "cancel") {
      const { rate, tier } = refundDecision(requestType, tourDate, "policy");
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
        // venue only rides along on confirm, and only when typed.
        body: JSON.stringify(
          action === "confirm" && venue.trim()
            ? { id, action, venue: venue.trim() }
            : { id, action },
        ),
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
    // whitespace-pre-line: the expired-hold refusal puts the /repay link on its
    // own line, and a collapsed newline would run it into the sentence before
    // it — exactly where it has to be selectable to be copied.
    <span className="mt-1 block max-w-[14rem] whitespace-pre-line break-all text-[11px] font-medium text-rose-600">
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
        {/* Pre-pivot charters were ours to run; there is nobody to send them to. */}
        {requestType !== null &&
          (dispatchOpen ? (
            <span className="mt-1.5 inline-flex gap-1.5">
              <input
                type="email"
                value={dispatchTo}
                onChange={(e) => setDispatchTo(e.target.value)}
                placeholder="提携先・お店のメール"
                maxLength={254}
                className="w-44 rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
              <button
                onClick={() =>
                  sendNote(
                    "dispatch",
                    { to: dispatchTo.trim() },
                    `送客メールを送ります。\n送信先：${dispatchTo.trim()}\n\n（オーナーにもBCCで届きます）`,
                  )
                }
                disabled={busy || !dispatchTo.trim()}
                className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 disabled:opacity-50"
              >
                送信
              </button>
            </span>
          ) : (
            <button
              onClick={() => setDispatchOpen(true)}
              disabled={busy}
              className="mt-1.5 text-[11px] font-medium text-sky-700 underline underline-offset-2 disabled:opacity-50"
            >
              送客メールを送る
            </button>
          ))}
        {/* §8 #3 — the 48-hour status. 確定 and お断り already send their own. */}
        {requestType !== null && (
          <button
            onClick={() =>
              sendNote(
                "status-waiting",
                {},
                "お客様に「お手配を進めています（返答待ち）」の状況メールを送ります。",
              )
            }
            disabled={busy}
            className="mt-1 text-[11px] font-medium text-slate-500 underline underline-offset-2 disabled:opacity-50"
          >
            状況メール：返答待ち
          </button>
        )}
        {canPropose &&
          (proposalOpen ? (
            <span className="mt-1.5 inline-flex flex-col items-end gap-1">
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder={"提案するお店と時間\n例：Proa Tumon 18:30"}
                maxLength={500}
                rows={2}
                className="w-56 rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
              <button
                onClick={() =>
                  sendNote(
                    "status-proposal",
                    { proposal: proposal.trim() },
                    `満席のため、次のお店を提案するメールを送ります。\n\n${proposal.trim()}\n\n返事の期限は2日後として記載されます。`,
                  )
                }
                disabled={busy || !proposal.trim()}
                className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:opacity-50"
              >
                提案メールを送信
              </button>
            </span>
          ) : (
            <button
              onClick={() => setProposalOpen(true)}
              disabled={busy}
              className="mt-1 text-[11px] font-medium text-amber-700 underline underline-offset-2 disabled:opacity-50"
            >
              状況メール：満席→提案
            </button>
          ))}
        {/* 🔴 After the guest accepts a proposal. Leave blank when the first
            choice is the one booked — otherwise the confirmation names the
            restaurant that was full. */}
        {canPropose && (
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="提案先で確定する場合の店名"
            maxLength={200}
            className="mt-1.5 w-52 rounded-md border border-slate-200 px-2 py-1 text-[11px]"
          />
        )}
        {sentSubject && (
          <span className="mt-1 block max-w-[16rem] break-all text-[11px] text-emerald-700">
            送信済み：{sentSubject}
          </span>
        )}
        {errNote}
      </span>
    );
  }

  if (status === "confirmed") {
    const { rate } = refundDecision(requestType, tourDate, "policy");
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
