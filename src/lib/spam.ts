
// Abuse protection for the public booking endpoints.
//
// This is the SERVER-SIDE guard. Client-side maxLength / required attributes
// improve UX but can be bypassed, so every rule here is enforced again on the
// server. Three layers:
//   1. Honeypot   — a hidden field real users never see. Bots that
//                   fill every input trip it and are silently dropped.
//   2. Length caps — reject oversized fields (spam / DB bloat / abuse).
//   3. Rate limit  — best-effort per-IP throttle to curb rapid repeat submits.

import "server-only";
import { daysUntilTour } from "./pricing";

// Maximum accepted length per free-text field (characters).
// 🔴 Every free-text field the form accepts must appear here, with the same
// number as its maxLength attribute. The three fields stage 4 added went in
// with a client-side limit and no server one at all — and the tour path needs
// no payment, so anyone could post an arbitrarily large partnerName straight to
// the API. It saves, and then it is printed into the owner's notification mail.
// Resend's free tier is 100 mails a day across three businesses and this
// Supabase project is shared with DaDeal; neither has room for that.
export const FIELD_LIMITS = {
  name: 100,
  email: 200,
  phone: 60,
  preferredDate: 100,
  hotel: 200,
  spots: 1000,
  notes: 1000,
  partnerName: 200,
  budgetHint: 100,
  cuisineHint: 100,
} as const;

// Simple, permissive email shape check (full validation is impractical; this
// just rejects obvious garbage before we try to email the address).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BookingInput {
  name?: string;
  email?: string;
  phone?: string;
  preferredDate?: string;
  hotel?: string;
  guests?: number | string;
  adults?: number | string;
  children4to11?: number | string;
  children0to3?: number | string;
  spots?: string;
  notes?: string;
  partnerName?: string;
  budgetHint?: string;
  cuisineHint?: string;
  mg_field_2?: string; // honeypot — must stay empty for real users
}

// Honeypot: real users never see or fill this hidden field. A non-empty value
// means an automated bot filled every input on the page.
//
// 🔴 The field is NOT called "company" any more, and the name matters.
// A hidden input named `company` under a label reading「会社名」is precisely
// what a password manager or a browser's address autofill reaches for, and a
// trip here is silent and unrecoverable: the request is dropped with no record
// kept anywhere. `mg_field_2` means nothing to an autofill heuristic.
export function isBot(body: { mg_field_2?: unknown }): boolean {
  return (
    typeof body.mg_field_2 === "string" && body.mg_field_2.trim().length > 0
  );
}

// Returns a user-facing error message if the input violates a length/format
// rule, or null if it passes. (Presence of required fields is checked by the
// caller so it can keep its existing message.)
export function validateBooking(b: BookingInput): string | null {
  const lengthChecks: [unknown, number, string][] = [
    [b.name, FIELD_LIMITS.name, "お名前"],
    [b.email, FIELD_LIMITS.email, "メールアドレス"],
    [b.phone, FIELD_LIMITS.phone, "連絡先"],
    [b.preferredDate, FIELD_LIMITS.preferredDate, "希望日時"],
    [b.hotel, FIELD_LIMITS.hotel, "ご宿泊先"],
    [b.spots, FIELD_LIMITS.spots, "行きたいスポット"],
    [b.notes, FIELD_LIMITS.notes, "ご要望"],
    [b.partnerName, FIELD_LIMITS.partnerName, "お店・ツアー名"],
    [b.budgetHint, FIELD_LIMITS.budgetHint, "ご予算の目安"],
    [b.cuisineHint, FIELD_LIMITS.cuisineHint, "お料理の種類"],
  ];
  for (const [val, max, label] of lengthChecks) {
    if (typeof val === "string" && val.length > max) {
      return `${label}が長すぎます（${max}文字以内でご入力ください）。`;
    }
  }

  if (typeof b.email === "string" && b.email && !EMAIL_RE.test(b.email)) {
    return "メールアドレスの形式が正しくありません。";
  }

  // REMOVED on the pivot branch — see MokaruGuam/pivot-oct1-design.md §7-2.
  //
  // A check used to live here rejecting any preferredDate after 2026-09-30,
  // because the site was still selling charter tours nobody would run. It was
  // right when it was added and it stays on `main` until this branch merges on
  // the night of 2026-09-30.
  //
  // It cannot survive the merge. It never looked at the request type, and from
  // 2026-10-01 every date the business handles is after the cutoff — the
  // partner tours we arrange and the restaurant tables we book are all in
  // October and later. Keeping it would reject 100% of the new business on its
  // first day, with a message about a service that no longer exists.
  //
  // What it protected against goes away by itself at the same moment: the
  // charter plans are removed from the site, so there is nothing left to sell.
  //
  // 🔴 A LOWER bound is a different question, and there has never been one.
  // Removing the cutoff was right; leaving the date open at both ends was not.
  // A mistyped year reaches PayPal and puts $10 on the card for a meal that
  // already happened — nothing is charged, because the owner declines it, but
  // the guest's money is held for a request that was never arrangeable.
  // Measured in Guam calendar days, like every other date rule here.
  if (typeof b.preferredDate === "string" && b.preferredDate) {
    const days = daysUntilTour(b.preferredDate);
    // null = unparseable, which stays allowed: preferredDate has carried
    // free text like「7/20 午後」on older bookings and this is not the place to
    // start rejecting it.
    if (days != null && days < 0) {
      return "ご希望日が過去の日付です。日付をご確認ください。";
    }
  }

  if (b.guests !== undefined) {
    const g = Number(b.guests);
    if (!Number.isFinite(g) || g < 1 || g > 7) {
      return "ご参加人数は1〜7名でご入力ください。";
    }
  }

  // 🔴 Each group on its own, not only the total.
  //
  // The route derives `guests` by adding the three together, so checking the
  // sum alone accepts any combination that lands in range — adults:-5 with
  // children4to11:10 totals 5 and passes. It then reaches the owner's
  // notification as「大人-5名・子供(4-11歳)10名」, and the party size we give
  // the restaurant is a number nobody can act on.
  for (const [value, label] of [
    [b.adults, "大人"],
    [b.children4to11, "子供(4-11歳)"],
    [b.children0to3, "子供(0-3歳)"],
  ] as [unknown, string][]) {
    if (value === undefined) continue;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 7) {
      return `${label}の人数が正しくありません。`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Best-effort in-memory rate limiting.
//
// NOTE: on serverless (Vercel) each running instance has its own memory, so
// this is NOT a strict global limit — it curbs rapid repeat submissions hitting
// the same warm instance and adds friction for naive bots. For a hard global
// limit, back this with a shared store (e.g. Upstash Redis) later.
// ---------------------------------------------------------------------------
const hits = new Map<string, number[]>();

// Returns true if the request is ALLOWED, false if it exceeded the limit.
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return recent.length <= limit;
}

// Extracts the best-guess client IP from proxy headers (Vercel sets these).
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
