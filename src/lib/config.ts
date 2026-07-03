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

// LINE official account URL (placeholder — replace with the real @id link).
export const LINE_URL = "https://line.me/R/ti/p/@mokaruguam";

// VELTRA listing URL (placeholder — replace with the actual listing URL).
export const VELTRA_URL =
  "https://www.veltra.com/jp/beach_resort/guam/a/195030";
