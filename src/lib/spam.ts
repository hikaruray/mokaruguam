
// Abuse protection for the public booking endpoints.
//
// This is the SERVER-SIDE guard. Client-side maxLength / required attributes
// improve UX but can be bypassed, so every rule here is enforced again on the
// server. Three layers:
//   1. Honeypot   — a hidden "company" field real users never see. Bots that
//                   fill every input trip it and are silently dropped.
//   2. Length caps — reject oversized fields (spam / DB bloat / abuse).
//   3. Rate limit  — best-effort per-IP throttle to curb rapid repeat submits.

import "server-only";

// Maximum accepted length per free-text field (characters).
export const FIELD_LIMITS = {
  name: 100,
  email: 200,
  phone: 60,
  preferredDate: 100,
  hotel: 200,
  spots: 1000,
  notes: 1000,
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
  spots?: string;
  notes?: string;
  company?: string; // honeypot — must stay empty for real users
}

// Honeypot: real users never see or fill the hidden "company" field. A
// non-empty value means an automated bot filled every input on the page.
export function isBot(body: { company?: unknown }): boolean {
  return typeof body.company === "string" && body.company.trim().length > 0;
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

  if (b.guests !== undefined) {
    const g = Number(b.guests);
    if (!Number.isFinite(g) || g < 1 || g > 7) {
      return "ご参加人数は1〜7名でご入力ください。";
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
