import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { SPOTS } from "@/lib/spots";

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
  ];

  const spotPages: MetadataRoute.Sitemap = SPOTS.map((s) => ({
    url: `${SITE_URL}/spots/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...spotPages].map((p) => ({ ...p, lastModified: now }));
}
