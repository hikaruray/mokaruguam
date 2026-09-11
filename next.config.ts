import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// 🔴 Fail the PRODUCTION build when a NEXT_PUBLIC_ value is broken.
// ---------------------------------------------------------------------------
// NEXT_PUBLIC_ values are baked in at build time, so a misconfigured one cannot
// be detected at runtime. Left alone it produces the worst failure shape there
// is: a green build and a page that is quietly, invisibly dead. GuamJobs lost
// its whole authentication flow to exactly this, and a full day to diagnosing
// it — the remedy below is the one written down in ENGINEERING_LESSONS.md.
//
// What it costs us here: NEXT_PUBLIC_PAYPAL_CLIENT_ID is what makes the payment
// box render. Without it the restaurant path silently stops offering payment,
// falls through to the server, and is refused by gate 1 with「お支払い情報を確認
// できませんでした。お手数ですが、もう一度お試しください」— a sentence the guest
// can only read as "my card was rejected". The paid product would be at zero
// from 2026-10-01 and every guest would blame themselves.
//
// 🔴 PRODUCTION ONLY. Local dev, `next dev` and preview builds must never fail:
// running without PayPal or Supabase is a supported mode of this site, not a
// bug, and breaking it stops development. next.config.ts is evaluated after
// .env files are loaded, so reading process.env here is correct.
//
// 🔴 Say WHICH variable is wrong and HOW. The build log is the only evidence
// anyone gets.
function assertPublicEnv() {
  if (process.env.VERCEL_ENV !== "production") return;

  const problems: string[] = [];
  const value = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (value === undefined) {
    problems.push("NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set");
  } else if (value.trim() === "") {
    problems.push("NEXT_PUBLIC_PAYPAL_CLIENT_ID is empty or whitespace only");
  } else if (value.includes("•")) {
    // Vercel renders Secret-typed values as eyJhbGci•••••• on screen. Copying
    // that display back into the field stores the bullets as the real value,
    // and they reach the build intact. NEXT_PUBLIC_ variables must be Config
    // type, never Secret.
    problems.push(
      "NEXT_PUBLIC_PAYPAL_CLIENT_ID contains U+2022 (•) — the masked display " +
        "was pasted back in. Delete it and re-enter the real value as a " +
        "Config variable, not a Secret",
    );
  } else if (value.trim().length < 20) {
    problems.push(
      `NEXT_PUBLIC_PAYPAL_CLIENT_ID is only ${value.trim().length} characters — too short to be a PayPal client id`,
    );
  }

  if (problems.length > 0) {
    throw new Error(
      "Refusing to build for production:\n  - " +
        problems.join("\n  - ") +
        "\n\nThe restaurant arrangement fee cannot be collected without this " +
        "value, and the site would tell guests their card was declined " +
        "instead. Fix it in the Vercel dashboard and rebuild.",
    );
  }

  // Degrades rather than breaks: SITE_URL falls back to localhost, which makes
  // emailed cancel/repay links wrong but leaves the site working. Warn, do not
  // fail — a build that fails for everything gets ignored when it matters.
  if (!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")) {
    console.warn(
      "[env] NEXT_PUBLIC_SITE_URL is not an https URL. Links in emails " +
        "(cancel, repay) will point at the fallback origin.",
    );
  }
}

assertPublicEnv();

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

  // NOTE: /privacy is deliberately NOT in this list. It briefly redirected to
  // /legal as a stopgap, because the site had no privacy policy at all. It now
  // has a real one at /privacy (app/privacy/page.tsx), so the old URL resolves
  // to the page that replaced it — which is what it always should have been.
  // Redirects run ahead of routing, so leaving the entry here would shadow the
  // new page entirely.
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
