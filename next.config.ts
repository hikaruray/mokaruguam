import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Legacy fixed pages → their nearest live equivalent (301/permanent).
// ---------------------------------------------------------------------------
// The old WordPress site had 19 fixed pages. The 2026-07-16 DNS switch left 18
// of them 404 (the 19th, "HOME", is the apex and already resolves). The blog
// posts were dealt with on 07-17; these are the rest.
//
// WHY REDIRECT INSTEAD OF REBUILDING THEM
// Every one of these has a live page that does the same job — /service/price/
// is /plans, /voice/ is /reviews, and so on. Rebuilding them would duplicate
// pages we already have and split the ranking between them.
//
// WHY EACH TARGET IS A CONTENT MATCH, NOT JUST "SOMEWHERE"
// Google treats a redirect to an unrelated page as a soft 404 — it carries no
// value and costs the same traffic as leaving the 404. So each entry below goes
// to the page that answers the same question. Where nothing answers it, the
// mapping is called out rather than pointed at the homepage to look tidy.
//
// The originals are in legacy-archive/pages/ if any of these ever needs to come
// back as a real page.
const LEGACY_PAGE_REDIRECTS: { source: string; destination: string }[] = [
  // Plans and pricing — all four described a charter we still sell.
  { source: "/service/price", destination: "/plans" },   // 料金
  { source: "/service", destination: "/plans" },         // サービス（概要）
  { source: "/private-tour-3h", destination: "/plans" }, // 3時間【Shortプラン】
  { source: "/middleplan", destination: "/plans" },      // 5時間【Middleプラン】
  { source: "/totalplan", destination: "/plans" },       // Total（12時間×2日～）

  // Direct one-to-one matches.
  { source: "/service/faq", destination: "/faq" },       // よくあるご質問
  { source: "/service/flow", destination: "/guide" },    // ご予約までの流れ
  { source: "/voice", destination: "/reviews" },         // お客様の声
  { source: "/company", destination: "/about" },         // 会社案内
  { source: "/rules-and-regulations", destination: "/legal" }, // 特定商取引法に基づく表記

  // Enquiry routes. The site has no contact page by design (the owner's rule is
  // "finish it on the site"), and /reserve is the only form — it takes a
  // question in the notes field without committing the guest to anything.
  { source: "/contact", destination: "/reserve" },           // お問い合わせ
  { source: "/free-consultation", destination: "/reserve" }, // 無料オンライン相談（本文は空だった）

  // Post-booking flow. /guide is "予約の流れ＆キャンセルポリシー", which is what
  // this page's body actually was ("ツアー当日までの流れ").
  { source: "/booking-thank-you", destination: "/guide" },
  { source: "/payment", destination: "/guide" }, // お支払い（本文は実質空）

  // No content of their own — both bodies were empty apart from a Twitter
  // widget script. Home is the honest landing spot for a bare index page.
  { source: "/information", destination: "/" },   // お知らせ（空）
  { source: "/sitemap-page", destination: "/" },  // サイトマップ

  // 私たちの強み (2,516 chars, real copy: government-licensed guides, support
  // from before departure, full customisation). No single page inherits this —
  // the homepage carries the same pitch, so it is the closest match.
  { source: "/strength", destination: "/" },

  // プライバシーポリシー (2,012 chars). ⚠️ THIS ONE IS NOT A REAL MATCH.
  // The current site has no privacy policy — /legal is 特定商取引法 only — even
  // though /reserve collects a name, email and phone number and takes card
  // payments. /legal is the nearest legal page and stops the 404, but the right
  // fix is to publish a privacy policy and point this at it. Flagged to the
  // owner 2026-07-19; see MokaruGuam/todo.md.
  { source: "/privacy", destination: "/legal" },
];

const nextConfig: NextConfig = {
  // Next matches these after normalising the trailing slash, so the old
  // "/service/price/" form is covered by the slash-less source above.
  async redirects() {
    return LEGACY_PAGE_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },

  images: {
    // Site photos are local files in /public/photos, so no host is needed for
    // them. These remote hosts cover the legacy WordPress media still linked in
    // places and YouTube thumbnails.
    remotePatterns: [
      { protocol: "https", hostname: "www.mokaruguam.com" },
      { protocol: "https", hostname: "mokaruguam.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // next/image serves modern formats automatically; AVIF first, then WebP.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
