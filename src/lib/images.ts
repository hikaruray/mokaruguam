// Central place for image sources.
//
// Real Mokaru photos live in /public/photos (WebP) and are keyed by seed in
// REAL_PHOTOS below. Seeds without a real photo yet fall back to a neutral
// placeholder, so we can add photos incrementally as the owner provides them.

function placeholder(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// seed -> real optimized photo in /public/photos. Add entries as photos arrive.
export const REAL_PHOTOS: Record<string, string> = {
  "mokaru-guam-hero": "/photos/hero.webp",
  "mokaru-movie": "/photos/video.webp",
  "spot-lovers": "/photos/lovers.webp",
  "spot-spain": "/photos/spain.webp",
  "spot-fort": "/photos/fort.webp",
  "spot-emerald": "/photos/emerald.webp",
  "spot-coffee": "/photos/coffee.webp",
};

// Returns the real photo for a seed if present, else a placeholder. next/image
// resizes the single source, so width/height only matter for the placeholder.
export function photoFor(seed: string, w: number, h: number): string {
  return REAL_PHOTOS[seed] ?? placeholder(seed, w, h);
}

export const IMAGES = {
  hero: photoFor("mokaru-guam-hero", 1600, 1000),
  video: photoFor("mokaru-movie", 1280, 720),
  spots: [
    { seed: "spot-lovers", label: "恋人岬" },
    { seed: "spot-spain", label: "スペイン広場" },
    { seed: "spot-emerald", label: "エメラルドバレー" },
    { seed: "spot-fort", label: "アプガン砦" },
    { seed: "spot-coffee", label: "スロウウォークコーヒー" },
  ].map((s) => ({ ...s, src: photoFor(s.seed, 500, 380) })),
};

// True only while every image is a placeholder. Real photos are now in for the
// hero and key spots, so the "photos are placeholders" banner is hidden.
export const USING_PLACEHOLDER_PHOTOS = false;
