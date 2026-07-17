import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { SPOTS } from "@/lib/spots";
import { LEGACY_SLUGS, getLegacyArticle } from "@/lib/legacy-articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/reserve`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/plans`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/spots`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/guide`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/reviews`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/legal`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const spotPages: MetadataRoute.Sitemap = SPOTS.map((s) => ({
    url: `${SITE_URL}/spots/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Restored legacy articles. Listing them tells Google to re-crawl the URLs
  // that started 404ing at the DNS switch, which is the whole point of getting
  // them back up quickly.
  const legacyPages: MetadataRoute.Sitemap = LEGACY_SLUGS.map((slug) => {
    const article = getLegacyArticle(slug);
    return {
      url: `${SITE_URL}/${slug}`,
      // Real edit date from WordPress — these are archive posts, not fresh
      // content, so claiming "modified today" would be a false signal.
      lastModified: article ? new Date(article.modified) : now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    };
  });

  const current = [...staticPages, ...spotPages].map((p) => ({
    ...p,
    lastModified: now,
  }));

  return [...current, ...legacyPages];
}
