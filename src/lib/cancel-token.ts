// Signed self-service links (no DB column needed).
//
// Two kinds, both `base64url(bookingId).base64url(hmacSHA256(...))`:
//   /cancel/[token] — cancel your own booking      (hmac over the id)
//   /repay/[token]  — re-enter payment after a hold expired (hmac over
//                     "repay:" + the id, so the two are not interchangeable)
//
// The HMAC is keyed by a server-only secret, so a customer can act on their own
// booking from an emailed link, but cannot forge a token for someone else's.
//
// Secret resolution (server-only), first non-empty wins:
//   CANCEL_TOKEN_SECRET  → dedicated secret (recommended in production)
//   ADMIN_PASSWORD       → reuse the existing admin secret if that's all set
//   dev fallback constant → keeps local dev / build working without config
//
// The token carries no expiry of its own; validity is bounded by the booking's
// state (already-cancelled / past-date are handled by the cancel route).

import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return (
    process.env.CANCEL_TOKEN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "mokaru-dev-cancel-secret" // dev fallback only; set a real secret in prod
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

// 🔴 DO NOT CHANGE WHAT THIS SIGNS.
//
// Every acknowledgement email ever sent carries a link built from it. Mixing a
// purpose string in here — the obvious way to scope a token — would change the
// signature of every booking id at once and invalidate every cancellation link
// already sitting in a guest's inbox. A second purpose gets a second function
// (see signRepay below), never a modification of this one.
function sign(bookingId: string): string {
  return createHmac("sha256", secret()).update(bookingId).digest("hex");
}

// The re-authorisation link (/repay) signs the same booking id under a
// different purpose, so the two links cannot stand in for each other: a repay
// link cannot cancel a booking and a cancel link cannot re-authorise a card,
// because neither signature verifies under the other's function.
function signRepay(bookingId: string): string {
  return createHmac("sha256", secret())
    .update(`repay:${bookingId}`)
    .digest("hex");
}

function makeToken(bookingId: string, signer: (id: string) => string): string {
  return `${b64url(bookingId)}.${b64url(signer(bookingId))}`;
}

function verifyToken(
  token: string,
  signer: (id: string) => string,
): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  let bookingId: string;
  let providedSig: string;
  try {
    bookingId = fromB64url(parts[0]).toString("utf8");
    providedSig = fromB64url(parts[1]).toString("utf8");
  } catch {
    return null;
  }
  if (!bookingId) return null;

  const expected = signer(bookingId);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return bookingId;
}

// Build the token for a booking id.
export function makeCancelToken(bookingId: string): string {
  return makeToken(bookingId, sign);
}

// Verify a token and return the booking id, or null if invalid/tampered.
export function verifyCancelToken(token: string): string | null {
  return verifyToken(token, sign);
}

// Same, for the re-authorisation link.
export function makeRepayToken(bookingId: string): string {
  return makeToken(bookingId, signRepay);
}

export function verifyRepayToken(token: string): string | null {
  return verifyToken(token, signRepay);
}

// Absolute cancel URL for a booking (used in emails).
export function cancelUrl(bookingId: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/cancel/${makeCancelToken(bookingId)}`;
}

// Absolute re-authorisation URL. Sent when a hold died before we could capture
// it — the guest re-enters payment, and only then do we go and book the table.
export function repayUrl(bookingId: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/repay/${makeRepayToken(bookingId)}`;
}
