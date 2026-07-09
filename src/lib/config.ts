// Site-wide configuration.
//
// Email sending is enabled by setting RESEND_API_KEY in the environment
// (Vercel). Until then, booking requests are logged server-side so nothing is
// lost during development.

export const SITE_NAME = "Mokaru Guam";
export const SITE_NAME_JA = "グアム完全貸切ガイドチャーター｜Mokaru Guam";

// Single source of truth for the site's public origin. Used for OGP and links.
//   • Vercel preview/prod: https://mokaruguam.vercel.app
//   • Custom domain later:  https://www.mokaruguam.com
// Falls back to localhost for local development.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

// Business contact — where booking requests are delivered.
export const CONTACT_EMAIL = "tour@mokaruguam.com";

// Owner always receives a copy (BCC) for record-keeping.
export const OWNER_COPY_EMAIL = "ynishihira@gmail.com";

// Verified sending address (set up at launch with the domain's DNS records).
export const FROM_EMAIL = "Mokaru Guam <tour@mokaruguam.com>";

// LINE official account URL.
export const LINE_URL = "https://lin.ee/OfniH2h";

// VELTRA listing URL.
export const VELTRA_URL =
  "https://www.veltra.com/jp/beach_resort/guam/a/195030";

// Public PayPal client id (safe to expose to the browser). When empty, the
// booking form runs request-only (no online payment). The secret lives only on
// the server (see lib/paypal.ts). NEXT_PUBLIC_ vars are inlined at build time.
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
export const PAYPAL_ENABLED = PAYPAL_CLIENT_ID.length > 0;
