// Central place for image sources.
//
// Every image on the site is a real Mokaru photo in /public/photos, keyed by
// seed in REAL_PHOTOS. There is deliberately NO placeholder fallback: PhotoSeed
// is derived from REAL_PHOTOS, so referencing a seed that has no photo is a
// compile-time error (`npm run build` fails) rather than a silently broken or
// stock image on the live site. When adding a spot, add its photo here first.

export const REAL_PHOTOS = {
  "mokaru-guam-hero": "/photos/hero.webp",
  "mokaru-movie": "/photos/video.webp",
  "spot-lovers": "/photos/lovers.webp",
  "spot-spain": "/photos/spain.webp",
  "spot-fort": "/photos/fort.webp",
  "spot-emerald": "/photos/emerald.webp",
  "spot-coffee": "/photos/coffee.webp",
} as const satisfies Record<string, `/photos/${string}`>;

/** Seeds that have a real photo. Adding a spot without a photo won't compile. */
export type PhotoSeed = keyof typeof REAL_PHOTOS;

/** Resolve a seed to its photo. next/image handles resizing, so no dimensions. */
export function photoFor(seed: PhotoSeed): string {
  return REAL_PHOTOS[seed];
}

// Social preview image (og:image / twitter:image). Derived from the hero photo
// at the 1200x630 that social platforms crop to, as JPEG because OG crawler
// support for WebP varies (LINE is our main sharing surface). Regenerate with
// sharp if the hero photo changes:
//   sharp('public/photos/hero.webp').resize(1200,630,{fit:'cover'})
//     .jpeg({quality:82,mozjpeg:true}).toFile('public/og.jpg')
export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "グアムの夕陽と海｜Mokaru Guam 完全貸切ガイドチャーター",
} as const;

export const IMAGES = {
  hero: photoFor("mokaru-guam-hero"),
  video: photoFor("mokaru-movie"),
  spots: (
    [
      { seed: "spot-lovers", label: "恋人岬" },
      { seed: "spot-spain", label: "スペイン広場" },
      { seed: "spot-emerald", label: "エメラルドバレー" },
      { seed: "spot-fort", label: "アプガン砦" },
      { seed: "spot-coffee", label: "スロウウォークコーヒー" },
    ] satisfies { seed: PhotoSeed; label: string }[]
  ).map((s) => ({ ...s, src: photoFor(s.seed) })),
};
