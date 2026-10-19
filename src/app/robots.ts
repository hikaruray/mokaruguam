import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// AI search crawlers, named so that allowing them is a decision written down
// rather than a side effect of "*" (2026-10-19). They were never blocked — the
// "*" group already let them in — but a later edit that tightens "*" should
// not silently take us out of ChatGPT, Perplexity, Claude or Gemini answers.
//
// 🔴 A crawler that matches a named group IGNORES the "*" group entirely, so
// every named group must repeat the same disallow list. They share DISALLOW
// below for that reason.
const AI_CRAWLERS = [
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // ChatGPT fetching a page a user asked about
  "GPTBot", // OpenAI
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "Google-Extended", // Gemini (Google's AI Overviews use plain Googlebot)
  "Applebot-Extended",
];

const DISALLOW = ["/admin", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
