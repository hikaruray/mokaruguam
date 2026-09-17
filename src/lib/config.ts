// Site-wide configuration.
//
// Email sending is enabled by setting RESEND_API_KEY in the environment
// (Vercel). Until then, booking requests are logged server-side so nothing is
// lost during development.

export const SITE_NAME = "Mokaru Guam";
// Renders in <title> on every page, so it is the single line that describes the
// business to search results. Rewritten 2026-09-11: the charter service ends
// 2026-09-30 and the business becomes booking arrangement (partner activities +
// restaurant reservations).
export const SITE_NAME_JA = "グアムのレストラン予約代行・ツアー手配｜Mokaru Guam";

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
  phoneNote: "お問い合わせはメールにて承ります。電話は緊急時のみ対応。",
};

// Owner always receives a copy (BCC) for record-keeping.
export const OWNER_COPY_EMAIL = "ynishihira@gmail.com";

// Verified sending address (set up at launch with the domain's DNS records).
export const FROM_EMAIL = "Mokaru Guam <tour@mokaruguam.com>";

// LINE official account URL.
//
// 2026-09-11: LINE was removed as a customer-facing channel (the pivot runs on
// email only). The constant STAYS because the privacy policy still describes
// how past LINE enquiries are handled — the account continues to exist, so
// deleting that clause would be less accurate than keeping it. What was removed
// is every CTA, button and email line inviting a NEW enquiry through it.
//
// ✅ As of 2026-09-12 the removal is complete. The only remaining reference in
// the application is the privacy policy clause above, which is deliberate
// (design §10-3). Legacy articles under lib/legacy-* still contain LINE links
// in their body text; those are stage 6 and are not this constant's business.
//
// 🔴 DO NOT re-add a LINE call to action anywhere.
//
// 🔴 AND DO NOT TRUST A LIST OF LINE NUMBERS IN THIS COMMENT.
// There used to be one here — file paths with line numbers, kept as the work
// list for the removal. By the time anyone read it, it named a file that had
// been clean for a day and pointed at lines that had all moved. A list like
// that produces both failures at once: work believed outstanding that is
// finished, and work still outstanding that is not on the list. If you need to
// know where LINE appears, ask the code:
//
//   grep -rn "LINE_URL\|lin\.ee" src/
//
// 🔴 Grep the SOURCE, not the build output. Email bodies and the dynamic
// /cancel route never appear in the rendered HTML, so a build-output grep
// answers "0 occurrences" while a guest is still being pointed at LINE.
export const LINE_URL = "https://lin.ee/OfniH2h";

// VELTRA listing URL.
export const VELTRA_URL =
  "https://www.veltra.com/jp/beach_resort/guam/a/195030";

// Public PayPal client id (safe to expose to the browser). When empty, the
// booking form runs request-only (no online payment). The secret lives only on
// the server (see lib/paypal.ts). NEXT_PUBLIC_ vars are inlined at build time.
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
export const PAYPAL_ENABLED = PAYPAL_CLIENT_ID.length > 0;

// ---------------------------------------------------------------------------
// Partner tour cancellation terms
// ---------------------------------------------------------------------------
// Owner confirmed with BOTH operators on 2026-09-18 (Joe's Jet Ski and Gently
// Blue gave identical terms):
//
//   • the guest is never charged for cancelling — no fee at any notice period
//   • a no-show costs the guest nothing either
//   • they want to be told by 3 days before, so the slot can be resold
//   • they notify us when a guest does not turn up
//
// 🔴 What a no-show costs is OUR side: a guest who never turns up pays the
// operator nothing, so there is no 20% for us. The day-before reminder is not a
// courtesy feature — it is the only thing standing between a forgotten booking
// and zero revenue on it.
//
// 🔴 These words belong to the PARTNER TOUR path ONLY. The restaurant path
// charges a $10 arrangement fee that is NOT refunded once the table is actually
// booked (design §9-6), so letting this copy reach a restaurant mail would
// promise a refund we do not give — the same class of mistake as the tour
// refund ladder leaking into restaurant wording. booking-emails.ts branches on
// requestTypeOf() and check:gates asserts the two never mix.
//
// 🔵 Stating "no fee" plainly is deliberate, not a disclaimer. A guest who
// believes cancelling will cost them money is precisely the guest who says
// nothing and fails to appear. A cancellation the operator can resell is worth
// more to us than a silent empty seat.
export const PARTNER_CANCEL_NOTICE_DAYS = 3;

// For the confirmation mail and the public pages: stated before the deadline,
// so "no fee" is not read as conditional on meeting it.
export const PARTNER_CANCEL_POLICY = `キャンセル料は発生しません。ご都合が悪くなった場合は、実施日の${PARTNER_CANCEL_NOTICE_DAYS}日前までにご連絡ください。`;

// For the day-before reminder, which by definition arrives INSIDE the 3-day
// window. Repeating the deadline there would read as "too late now" and produce
// the no-show we are writing to prevent.
// It sits under the heading「▼ ご都合が悪くなった場合」, so it must not repeat
// that phrase back at the reader.
export const PARTNER_CANCEL_POLICY_REMINDER = `キャンセル料は発生しませんので、遠慮なくお手続きください。`;
