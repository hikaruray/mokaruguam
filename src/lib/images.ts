// Central place for image sources.
//
// PROTOTYPE NOTE: these are placeholder photos (picsum.photos). Replace each
// entry with the production Mokaru photo (drop files into /public and point to
// e.g. "/photos/hero.jpg") once the owner provides real images. Because every
// image source lives here, swapping to real photos is a one-file change.

function placeholder(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export const IMAGES = {
  hero: placeholder("mokaru-guam-hero", 1600, 1000),
  video: placeholder("mokaru-movie", 1280, 720),
  spots: [
    { seed: "spot-lovers", label: "恋人岬" },
    { seed: "spot-spain", label: "スペイン広場" },
    { seed: "spot-emerald", label: "エメラルドバレー" },
    { seed: "spot-fort", label: "アプガン砦" },
    { seed: "spot-coffee", label: "スロウウォークコーヒー" },
    { seed: "spot-asan", label: "アサン記念公園" },
  ].map((s) => ({ ...s, src: placeholder(s.seed, 500, 380) })),
};

// Set once real photos exist so the "photos are placeholders" banner can hide.
export const USING_PLACEHOLDER_PHOTOS = true;
