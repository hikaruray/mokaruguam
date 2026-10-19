// JSON-LD for search engines (2026-10-15, search plan C).
//
// WHAT IS MARKED UP, AND WHAT IS DELIBERATELY NOT
//  • Organization (home page): who runs the site. Every field here is already
//    printed on /legal and /about — nothing new is disclosed by putting it here.
//  • BreadcrumbList on detail pages, so results can show the path instead of a
//    bare URL.
//  • Article on the legacy articles, so their real publish/edit dates are read
//    from the page rather than guessed.
//
// 🔴 NOT Restaurant / LocalBusiness on the /dining pages. Those types say "this
// page is the restaurant's own listing" and feed rich results (hours, ratings,
// address) that we do not hold and do not want to vouch for — the public
// listings disagree with each other on hours and addresses (see
// lib/restaurants.ts). We are a booking service that recommends them.
// 🔴 NOT TravelAgency / LocalBusiness for us either: that is a map listing for
// a place guests visit, and nobody visits us. Organization says enough.
// 🔴 No AggregateRating anywhere. Our reviews are from the ended charter
// service; marking them up would attach them to a business that no longer
// sells what was reviewed.
import { COMPANY, CONTACT_EMAIL, SITE_NAME, SITE_URL } from "./config";

type Json = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/mokaru-logo.png`,
    email: CONTACT_EMAIL,
    // Same address as COMPANY.address (/legal), split into fields. Change both.
    address: {
      "@type": "PostalAddress",
      streetAddress: "176-16 Perez Way",
      addressLocality: "Tamuning",
      addressRegion: "GU",
      postalCode: "96913",
      addressCountry: "US",
    },
    areaServed: { "@type": "Place", name: "Guam" },
  };
}

export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ja",
    publisher: { "@id": ORG_ID },
  };
}

/** `path` values are site-relative ("/dining"); the home crumb is added here. */
export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  const items = [{ name: "ホーム", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.path === "/" ? SITE_URL : `${SITE_URL}${c.path}`,
    })),
  };
}

// The WordPress snapshot's dates carry no zone (e.g. "2025-08-24T00:01:08"),
// and Google's Rich Results Test flagged that on /tipping (2026-10-19).
// 🔴 They are UTC, NOT Guam time: all 91 match the `date_gmt` / `modified_gmt`
// fields in legacy-archive/ exactly (checked 2026-10-19). Appending +10:00
// would move every article 10 hours. A date with no time (the rewrites'
// "2026-09-12") is already valid and is left alone.
function withZone(d: string): string {
  return /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(d) ? `${d}Z` : d;
}

export function articleLd(a: {
  title: string;
  path: string;
  datePublished: string;
  dateModified: string;
  image: string;
}): Json {
  // `url` too, which the same test flagged as missing on author/publisher.
  const org = { "@id": ORG_ID, "@type": "Organization", name: SITE_NAME, url: SITE_URL };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    mainEntityOfPage: `${SITE_URL}${a.path}`,
    datePublished: withZone(a.datePublished),
    dateModified: withZone(a.dateModified),
    image: a.image.startsWith("http") ? a.image : `${SITE_URL}${a.image}`,
    author: org,
    publisher: org,
    inLanguage: "ja",
  };
}

export function itemListLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((x, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: x.name,
      url: `${SITE_URL}${x.path}`,
    })),
  };
}
