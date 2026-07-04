// Signed self-service cancellation tokens (no DB column needed).
//
// A token is `base64url(bookingId).base64url(hmacSHA256(bookingId))`. The HMAC
// is keyed by a server-only secret, so a customer can cancel their own booking
// from an emailed link, but cannot forge a token for someone else's booking.
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

function sign(bookingId: string): string {
  return createHmac("sha256", secret()).update(bookingId).digest("hex");
}

// Build the token for a booking id.
export function makeCancelToken(bookingId: string): string {
  return `${b64url(bookingId)}.${b64url(sign(bookingId))}`;
}

// Verify a token and return the booking id, or null if invalid/tampered.
export function verifyCancelToken(token: string): string | null {
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

  const expected = sign(bookingId);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return bookingId;
}

// Absolute cancel URL for a booking (used in emails).
export function cancelUrl(bookingId: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/cancel/${makeCancelToken(bookingId)}`;
}
