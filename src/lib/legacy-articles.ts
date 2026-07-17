// Legacy blog articles — restored from the pre-2026-07-16 WordPress site.
//
// BACKGROUND
// The old WordPress site lived on this domain until the 2026-07-16 DNS switch,
// which turned every one of its URLs into a 404. The articles still rank
// (2,490 clicks / 53,100 impressions over 12 months), so they are served here
// at their original URLs.
//
// HOW THE URLS LINE UP (measured, not assumed)
//   https://mokaruguam.com/<slug>/      -> 308 -> www + slash
//   https://www.mokaruguam.com/<slug>/  -> 308 -> www, no slash
//   https://www.mokaruguam.com/<slug>   -> was 404, now served from here
// The permanent-redirect chain already points at the right place, so serving
// 200 at the final URL lets it carry the old ranking over. Nothing about apex
// canonicalisation or trailingSlash needs to change.
//
// WHERE THE CONTENT COMES FROM  (Phase 2-A, 2026-07-17)
// `legacy-content.json` is a snapshot of the WordPress REST output, committed
// to this repo. The build no longer talks to the old Xserver box at all:
// nothing here opens a socket, so the site builds and deploys even if that
// server is unplugged. This matters because the old host held the ONLY copy of
// this content (no Wayback snapshots), and Phase 1 left the build depending on
// it staying alive.
//
// The snapshot holds each article's RAW `content.rendered`, exactly as
// WordPress returned it. It is the owner's writing and it already ranks, so it
// is never edited — not reworded, not summarised, not "improved". cleanHtml()
// below applies the same presentational fixes it did when the content was
// fetched live, so the rendered output is byte-for-byte what production served
// before the snapshot.
//
// To refresh it (only if the old WordPress content ever changes — it has not
// since 2025-09-02), re-run the snapshot against the origin. That box routes by
// Host header: `Host: mokaruguam.com` -> 200, no override -> 404. `fetch()`
// cannot do it (undici silently drops a `host` header); only a low-level
// node:https request can set it.

import snapshot from "./legacy-content.json";

// ---------------------------------------------------------------------------
// Allow-list — the ONLY slugs this route will ever serve.
// ---------------------------------------------------------------------------
// Deliberately a hardcoded list rather than "whatever the origin returns", so
// that the set of restored URLs is auditable in code and cannot silently grow
// if the old site changes. `dynamicParams = false` in the page means anything
// not listed here 404s, so this list also guarantees the legacy route can never
// shadow a real page (/plans, /reserve, /spots, /admin, /api, …).
export const LEGACY_SLUGS = [
  "airport-shuttle", "bayviewhotel", "before-departure", "bus-rentacar",
  "business", "capitalhotel", "chose-hotel", "common-sense", "crossing-reef",
  "crowneplaza", "dive-spot", "dont-forget", "drivers", "emergencies",
  "family-friendly", "foreign-exchange", "fort-apugan", "grandplazahotel",
  "guam-budget", "guam-day-plan", "guam-holidays", "guam-jobs",
  "guam-only-gifts", "guam-souvenir", "guam-sweets", "guam-top5-sights",
  "guam-traffic", "guam-weather", "guam-weather-2", "guamplaza", "guamreef",
  "hiltonguam", "history", "honeymoon-couple", "hotel-complaint", "hoteltano",
  "how-to-live", "hp-renewal", "hyattregency", "hydration", "insurance",
  "kid-friendly", "kids-3hour-tour", "kmart-or-abc", "ladies-safety",
  "living-costs", "local-beach", "local-food", "lottehotel", "low-tide",
  "mokaru-highlights", "mokaru-support", "mokaru-vision", "night-market",
  "night-market-2", "nightmarket-troubles", "nikkohotel", "pichotel",
  "plaza-de-espana", "post-wedding-tour", "rainy-day", "restaurants",
  "rhigaroyal", "royalorchid", "safety", "shopping-malls", "simple-enlgish",
  "special-requests", "sunburn", "talafofo-falls", "tipping", "tips",
  "top3-actitivity", "touts", "transportation", "tsubakitower",
  "two-lovers-point", "visas", "westinhotel", "wifi-sim",
] as const;

// ---------------------------------------------------------------------------
// Deliberately NOT restored. Kept here as documentation so the next person
// knows these were a decision, not an oversight.
// ---------------------------------------------------------------------------
// Owner decision (2026-07-17): hold, do not revive. Left as plain 404s — NOT
// redirected or 410'd — so reviving them later stays an option.
export const EXCLUDED_BRAND = [
  "cbd-thc", "drugs", "drug-troubles", "night-life", "night-life-points",
];

// State prices for our own tours that no longer match pricing.md
// ($130/3h, $230/5h, $300/8h, $450/day vs the current $170/$250/$345/$500).
// Restoring these would publish wrong prices — the same landmine that keeps the
// old /service/price/ page out of scope.
export const EXCLUDED_STALE_PRICING = [
  "short-plan", "shortplan", "middleplanpost", "totalplanpost", "select-tour",
  "1dayplan", "1day-plan", "longplanpost", "long-plan", "long-tour",
  "about-mokaru", "linesupport",
];

// Promise perks the current business does not offer (e.g. repeater-discount
// advertises "2nd visit 10% off / 3rd 15% / up to 20% off"; 24hour-support
// promises round-the-clock cover). Reviving these invites customer disputes.
export const EXCLUDED_STALE_PROMISE = ["repeater-discount", "24hour-support"];

export type LegacySlug = (typeof LEGACY_SLUGS)[number];

const ALLOWED = new Set<string>(LEGACY_SLUGS);

export function isLegacySlug(slug: string): slug is LegacySlug {
  return ALLOWED.has(slug);
}

export interface LegacyArticle {
  slug: string;
  title: string; // plain text
  html: string; // article body, sanitised for our shell
  date: string; // ISO
  modified: string; // ISO
}

/** Shape of one entry in legacy-content.json (raw WordPress REST fields). */
interface SnapshotEntry {
  title: string; // as WP returned it (HTML-encoded)
  content: string; // RAW content.rendered — never edited
  date: string;
  modified: string;
}

const SNAPSHOT = snapshot as Record<string, SnapshotEntry>;

export function getLegacyArticle(slug: string): LegacyArticle | undefined {
  if (!ALLOWED.has(slug)) return undefined; // allow-list is the gate
  const entry = SNAPSHOT[slug];
  if (!entry) return undefined;
  return {
    slug,
    title: decodeEntities(entry.title),
    html: cleanHtml(entry.content),
    date: entry.date,
    modified: entry.modified,
  };
}

/** Minimal entity decode for titles (WP returns them HTML-encoded). */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/**
 * Prepare the WordPress body for rendering inside our own shell.
 *
 * The bodies are plain text + headings (measured: zero inline images across all
 * 99 articles, zero featured images), so this stays deliberately small.
 *  - Drop WP's own <h1>: our shell renders the title.
 *  - Rewrite absolute old links to relative, and point links that aimed at the
 *    retired plan pages at the current /plans instead of a known 404.
 *  - Strip inline styles/classes so the content inherits our typography.
 */
function cleanHtml(html: string): string {
  let out = html;

  // The old theme appends its own SNS share widget to every article body
  // (Twitter widget <script> + buttons pointing at the pre-redirect apex URL).
  // Strip it before anything else, while its class marker is still intact.
  out = out.replace(
    /<div class="[^"]*socialSet[^"]*"[\s\S]*?<!-- \[ \/\.socialSet \] -->/g,
    "",
  );

  // Old plan/landing pages are out of scope for Phase 1 and 404 — send those
  // links somewhere real rather than shipping known-broken links.
  const RETIRED_TO_PLANS =
    /href="(?:https:\/\/mokaruguam\.com)?\/(?:service\/price|middleplan|totalplan|longplan|private-tour-3h|1dayplan|1day-plan|short-plan|shortplan|long-plan|long-tour|select-tour|middleplanpost|longplanpost|totalplanpost)\/?"/g;
  out = out.replace(RETIRED_TO_PLANS, 'href="/plans"');

  // Old contact/booking routes -> our current booking page.
  out = out.replace(
    /href="(?:https:\/\/mokaruguam\.com)?\/(?:contact|free-consultation|payment|booking-thank-you)\/?"/g,
    'href="/reserve"',
  );

  // Remaining absolute self-links -> relative (keeps users on the new site).
  out = out.replace(/href="https:\/\/mokaruguam\.com\/?/g, 'href="/');

  // WP chrome we don't want inside our shell.
  out = out.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/\sclass="[^"]*"/g, "");
  out = out.replace(/\sstyle="[^"]*"/g, "");
  // Inline handlers survive dangerouslySetInnerHTML even though <script> does
  // not. This body is our own export, but strip them anyway.
  out = out.replace(/\son[a-z]+="[^"]*"/gi, "");

  return out.trim();
}
