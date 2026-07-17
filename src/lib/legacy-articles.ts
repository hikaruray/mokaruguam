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
// The one exception is legacy-corrections.ts, which patches statements that are
// factually wrong today (old prices, discontinued services). Those corrections
// are declared as explicit find/replace pairs applied at render time — the
// snapshot itself stays untouched, so the original wording is never lost and
// every change is auditable in one file. See that file's header for why.
//
// To refresh it (only if the old WordPress content ever changes — it has not
// since 2025-09-02), re-run the snapshot against the origin. That box routes by
// Host header: `Host: mokaruguam.com` -> 200, no override -> 404. `fetch()`
// cannot do it (undici silently drops a `host` header); only a low-level
// node:https request can set it.

import snapshot from "./legacy-content.json";
import { applyCorrections } from "./legacy-corrections";

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

  // Restored 2026-07-19 (owner decision). These were held back because they
  // quoted the old rate card; their prices and any discontinued services are
  // corrected in legacy-corrections.ts, which fails the build if a correction
  // stops matching. Do not add a slug here without checking it there first.
  "1day-plan", "1dayplan", "about-mokaru", "long-plan", "long-tour",
  "longplanpost", "middleplanpost", "select-tour", "short-plan", "shortplan",
  "totalplanpost",
] as const;

// ---------------------------------------------------------------------------
// Deliberately NOT restored. Kept here as documentation so the next person
// knows these were a decision, not an oversight.
// ---------------------------------------------------------------------------
// Owner decision (2026-07-19): retire for good. These were held pending a
// decision on 2026-07-17; the owner has now chosen to drop them. They are
// served as 410 Gone by middleware.ts (not 404), which tells Google the removal
// is intentional and permanent. The originals stay in legacy-archive/ — the
// decision is reversible even though the URLs are not coming back on their own.
//
// Cost of this, measured, so it is not a surprise later: /cbd-thc/ alone was
// 612 clicks/year — 24.6% of the old site's entire search traffic. The owner
// judged the audience too far from a charter customer to be worth it.
export const RETIRED_BRAND = [
  "cbd-thc", "drugs", "drug-troubles", "night-life", "night-life-points",
];

// Restored 2026-07-19 after their prices were corrected — see LEGACY_SLUGS and
// legacy-corrections.ts. Kept as a named list because the reason they were ever
// held back (they quote our own rate card, so they go stale whenever pricing
// changes) still applies: if pricing.md ever changes again, these are the
// articles to re-check first.
export const QUOTES_OUR_PRICING = [
  "short-plan", "shortplan", "middleplanpost", "totalplanpost", "select-tour",
  "1dayplan", "1day-plan", "longplanpost", "long-plan", "long-tour",
  "about-mokaru",
  // Not from the original stale-pricing list — found live on 2026-07-19 quoting
  // $130/$300 and a 6-hour plan that never existed. Corrected, not withdrawn.
  // The original list was built from the plan articles only; these two are
  // practical guides that happen to quote our rate card in passing, which is
  // why they were missed. Sweep by content, not by category, next time.
  "bus-rentacar", "guam-traffic",
];

// Still offline: the whole article sells paid standalone LINE support ($25 for
// 7 days) and a $120 call-out service. The subject is the product, so there is
// no price to correct — the business does not offer this at all (owner,
// 2026-07-19).
export const EXCLUDED_STALE_PRICING = ["linesupport"];

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
    // Corrections run on the RAW snapshot, before cleanHtml(), so their find
    // strings can be checked against legacy-archive/ verbatim.
    title: decodeEntities(applyCorrections(slug, entry.title, "title")),
    html: cleanHtml(applyCorrections(slug, entry.content, "body")),
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

  // Old plan/landing PAGES (not posts) are still out of scope and 404 — send
  // those links somewhere real rather than shipping known-broken links.
  //
  // The plan POSTS that used to be listed here (short-plan, middleplanpost,
  // long-tour, …) were restored on 2026-07-19, so they are deliberately gone
  // from this list: a link to /short-plan/ now reaches the actual article
  // instead of being diverted to /plans.
  const RETIRED_TO_PLANS =
    /href="(?:https:\/\/mokaruguam\.com)?\/(?:service\/price|middleplan|totalplan|longplan|private-tour-3h)\/?"/g;
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
