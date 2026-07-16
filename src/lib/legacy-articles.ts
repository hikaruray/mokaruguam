// Legacy blog articles (Phase 1 — stop the bleeding).
//
// BACKGROUND
// The old WordPress site lived on the same domain until the 2026-07-16 DNS
// switch. Its ~99 articles still rank (2,490 clicks / 53,100 impressions over
// 12 months) but every one of them started returning 404 the moment the domain
// pointed at Vercel. This module restores the article URLs so that traffic
// stops bleeding while the permanent migration (Phase 2) is prepared.
//
// HOW THE URLS LINE UP (measured, not assumed)
//   https://mokaruguam.com/<slug>/      -> 308 -> www + slash
//   https://www.mokaruguam.com/<slug>/  -> 308 -> www, no slash
//   https://www.mokaruguam.com/<slug>   -> was 404, now served from here
// The permanent-redirect chain already points at the right place, so serving
// 200 at the final URL lets it carry the old ranking over. Nothing about apex
// canonicalisation or trailingSlash needs to change.
//
// WHERE THE CONTENT COMES FROM
// The old site is still alive on the Xserver origin, which is a shared host
// that routes by Host header. Measured behaviour:
//   • Host: mokaruguam.com          -> 200 (the real article)
//   • no Host override              -> 404
// A plain next.config rewrite therefore CANNOT work: Vercel sends the
// destination's hostname as Host. `fetch()` cannot fix it either — undici
// silently drops a `host` header (verified: still 404). Only a low-level
// node:https request can set Host explicitly, which is what we do below.
//
// WHY BUILD-TIME AND NOT A LIVE PROXY
// The pages are prerendered at build (see app/[slug]/page.tsx), which means:
//   • the origin gets ONE request per build, not one per visitor — the old
//     server is the only surviving copy of this content, so we must not lean
//     on it;
//   • the articles keep serving from Vercel's CDN even if Xserver goes down;
//   • no runtime dependency on a legacy box.
// Trade-off: if the origin is unreachable during a build, the build fails
// loudly rather than silently shipping 404s again. Production stays up on the
// previous deployment. Phase 2 removes this dependency entirely by moving the
// content into the repo.

import https from "node:https";

const ORIGIN_HOST = "sv16378.xserver.jp"; // Xserver box still holding the site
const SITE_HOST = "mokaruguam.com"; // vhost name the origin routes on

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

interface WpPost {
  slug: string;
  date_gmt: string;
  modified_gmt: string;
  title: { rendered: string };
  content: { rendered: string };
}

/** GET from the origin with an explicit Host header (see module notes). */
function originGet(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ORIGIN_HOST,
        servername: ORIGIN_HOST, // SNI must match the cert we connect to
        port: 443,
        path,
        method: "GET",
        headers: { Host: SITE_HOST, "User-Agent": "mokaru-site-build" },
        timeout: 30_000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(
            new Error(`Legacy origin returned ${res.statusCode} for ${path}`),
          );
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    req.on("timeout", () => req.destroy(new Error(`Timeout for ${path}`)));
    req.on("error", reject);
    req.end();
  });
}

// One fetch per build, shared by all 80 pages, so the fragile origin sees a
// single request instead of 80.
let cache: Promise<Map<string, LegacyArticle>> | undefined;

function loadAll(): Promise<Map<string, LegacyArticle>> {
  cache ??= (async () => {
    const raw = await originGet(
      "/wp-json/wp/v2/posts?per_page=100&_fields=slug,title,content,date_gmt,modified_gmt",
    );
    const posts = JSON.parse(raw) as WpPost[];
    const map = new Map<string, LegacyArticle>();
    for (const p of posts) {
      if (!ALLOWED.has(p.slug)) continue; // allow-list is the gate
      map.set(p.slug, {
        slug: p.slug,
        title: decodeEntities(p.title.rendered),
        html: cleanHtml(p.content.rendered),
        date: p.date_gmt,
        modified: p.modified_gmt,
      });
    }
    return map;
  })();
  return cache;
}

export async function getLegacyArticle(
  slug: string,
): Promise<LegacyArticle | undefined> {
  if (!ALLOWED.has(slug)) return undefined;
  return (await loadAll()).get(slug);
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
