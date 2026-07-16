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

// ---------------------------------------------------------------------------
// Analytics (Google Analytics 4)
// ---------------------------------------------------------------------------
// The measurement ID is NOT a secret — it ships in the page source — but it is
// read from the environment rather than hardcoded, so the value can be changed
// or removed without a code change.
//
// Where the value comes from (Next.js env load order: process.env wins, then
// .env.$(NODE_ENV)):
//   • Production  → `.env.production` in the repo (or a Vercel env var, which
//                   takes precedence if the owner later sets one).
//   • Local dev   → nothing. `next dev` runs with NODE_ENV=development and
//                   never reads `.env.production`, so no tag is rendered and
//                   local browsing cannot pollute the real GA property.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

// Vercel exposes this automatically ("production" | "preview" | "development").
// Preview deployments build with NODE_ENV=production and would otherwise pick
// up the production GA ID, so exclude them explicitly.
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV;

// Render the GA tag only with an ID present and only outside preview builds.
export const ANALYTICS_ENABLED = GA_ID !== "" && VERCEL_ENV !== "preview";

// ---------------------------------------------------------------------------
// Company / legal details (single source of truth for /about and /legal).
// ---------------------------------------------------------------------------
export const COMPANY = {
  legalName: "Mokaru Guam LLC",
  operator: "Yasushi Nishihira",
  address: "176-16 Perez Way, Tamuning, Guam 96913",
  phone: "+1 671-777-1019",
  phoneNote: "お問い合わせはメール／LINEにて承ります。電話は緊急時のみ対応。",
};

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
