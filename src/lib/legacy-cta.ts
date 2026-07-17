// Contextual booking prompt shown under each restored legacy article.
//
// WHY
// The old blog collected exactly the right readers — people planning a Guam
// trip right now — and then sold them nothing. The articles are left exactly as
// written; this only appends a route into the funnel underneath them.
//
// TONE
// It reads as a note from the guide, not an ad. One card, no urgency, no
// discount bait. The article has to still be worth reading.
//
// CLAIMS
// Only things the current site already states: fully-private charter, a
// Japanese-speaking guide, a dedicated vehicle, and per-vehicle pricing from
// $170 for 3 hours (pricing.md). Deliberately NO promises about airport pickup
// (discontinued), 24-hour support or repeat-customer discounts — the old
// articles made service claims the business does not honour, which is why some
// are still offline and why the rest needed legacy-corrections.ts before they
// could go back up. We are not going to reintroduce that problem here.

export interface CtaLink {
  href: string;
  label: string;
}

export interface LegacyCta {
  heading: string;
  lead: string;
  links: CtaLink[];
}

type Theme = "sights" | "food" | "shopping" | "hotel" | "transport" | "family" | "practical" | "plan";

const PRICE_NOTE = "料金は車1台あたり（3時間 $170〜）で、人数が増えるほど1人あたりおトクです。";

const THEMES: Record<Theme, { heading: string; lead: string }> = {
  // Article is about a specific place worth visiting.
  sights: {
    heading: "この記事の場所も、貸切で回れます",
    lead: `Mokaru Guam は、グアムの完全貸切ガイドチャーター。日本語ガイドが運転する専用車なので、行きたい場所を、好きな順番で、好きなだけ。${PRICE_NOTE}`,
  },
  // Restaurants and local food.
  food: {
    heading: "気になったお店、まとめて回れます",
    lead: `点在するお店を回るなら、完全貸切のガイドチャーターという手があります。日本語ガイドが運転する専用車で、行きたい場所を自由に。${PRICE_NOTE}`,
  },
  // Shopping and souvenirs.
  shopping: {
    heading: "買った荷物は、車に置いたままで",
    lead: `専用車での移動なので、大きな買い物をしても持ち歩かずに済みます。完全貸切だから、立ち寄る場所も滞在時間も自由。${PRICE_NOTE}`,
  },
  // Hotel reviews and hotel-choosing.
  hotel: {
    heading: "泊まる場所が決まったら、あとは行き先だけ",
    lead: `Mokaru Guam は完全貸切のガイドチャーター。日本語ガイドが運転する専用車で、島内を自由に回れます。${PRICE_NOTE}`,
  },
  // Getting around: buses, taxis, rental cars.
  transport: {
    heading: "移動の段取りごと、任せられます",
    lead: `レンタカーの運転も、配車の手配も不要。日本語ガイドが運転する専用車で、行きたい場所だけを回れます。${PRICE_NOTE}`,
  },
  // Family / couples / occasions.
  family: {
    heading: "自分たちのペースで回れます",
    lead: `完全貸切なので、休憩も、当日の予定変更も自由。まわりのペースを気にせず過ごせます。${PRICE_NOTE}`,
  },
  // Practical know-how (money, weather, safety, living) — the default.
  practical: {
    heading: "現地のことは、ガイドに直接聞けます",
    lead: `Mokaru Guam は、グアムの完全貸切ガイドチャーター。日本語ガイドが運転する専用車で、行きたい場所を自由に回れます。この記事のような現地の話も、当日いくらでも。${PRICE_NOTE}`,
  },
  // The article is already about one of our plans (restored 2026-07-19). The
  // reader knows what we sell by this point, so the note points at the live
  // rate card instead of re-pitching the service — and because these articles
  // quote prices, /plans is where the number is guaranteed current.
  plan: {
    heading: "このプランの空き状況を確認できます",
    lead: `記事の内容は最新の料金・プランに合わせて更新しています。人数や時期によって料金が変わるため、確定の金額は料金ページと予約フォームでご確認ください。${PRICE_NOTE}`,
  },
};

// Only non-default themes are listed; everything else falls back to "practical".
const THEME_BY_SLUG: Record<string, Theme> = {
  // sights
  "two-lovers-point": "sights", "plaza-de-espana": "sights", "fort-apugan": "sights",
  "talafofo-falls": "sights", "local-beach": "sights", "dive-spot": "sights",
  "guam-top5-sights": "sights", "top3-actitivity": "sights", "night-market": "sights",
  "night-market-2": "sights", "nightmarket-troubles": "sights", "guam-day-plan": "sights",
  "history": "sights", "low-tide": "sights",
  // food
  "restaurants": "food", "local-food": "food",
  // shopping
  "guam-only-gifts": "shopping", "guam-souvenir": "shopping", "guam-sweets": "shopping",
  "shopping-malls": "shopping", "kmart-or-abc": "shopping",
  // hotel
  "bayviewhotel": "hotel", "capitalhotel": "hotel", "crowneplaza": "hotel",
  "grandplazahotel": "hotel", "guamplaza": "hotel", "guamreef": "hotel",
  "hiltonguam": "hotel", "hoteltano": "hotel", "hyattregency": "hotel",
  "lottehotel": "hotel", "nikkohotel": "hotel", "pichotel": "hotel",
  "rhigaroyal": "hotel", "royalorchid": "hotel", "tsubakitower": "hotel",
  "westinhotel": "hotel", "chose-hotel": "hotel", "hotel-complaint": "hotel",
  // transport
  "transportation": "transport", "guam-traffic": "transport", "bus-rentacar": "transport",
  "airport-shuttle": "transport", "drivers": "transport",
  // family / occasions
  "family-friendly": "family", "kid-friendly": "family", "kids-3hour-tour": "family",
  "honeymoon-couple": "family", "post-wedding-tour": "family",
  // plan marketing articles (restored 2026-07-19)
  "short-plan": "plan", "shortplan": "plan", "select-tour": "plan",
  "middleplanpost": "plan", "longplanpost": "plan", "long-plan": "plan",
  "long-tour": "plan", "1dayplan": "plan", "1day-plan": "plan",
  "totalplanpost": "plan", "about-mokaru": "plan",
};

// Legacy article -> the matching spot page on the current site. Only real
// matches; no stretching. Everything else links to the spots index instead.
const RELATED_SPOT: Record<string, CtaLink> = {
  "two-lovers-point": { href: "/spots/lovers-point", label: "恋人岬のページを見る" },
  "plaza-de-espana": { href: "/spots/spanish-plaza", label: "スペイン広場のページを見る" },
  "fort-apugan": { href: "/spots/apugan-fort", label: "アプガン砦のページを見る" },
};

export function ctaFor(slug: string): LegacyCta {
  const theme = THEMES[THEME_BY_SLUG[slug] ?? "practical"];
  const spot = RELATED_SPOT[slug];

  return {
    heading: theme.heading,
    lead: theme.lead,
    links: [
      spot ?? { href: "/spots", label: "人気スポットを見る" },
      { href: "/plans", label: "料金・プランを見る" },
      { href: "/reserve", label: "空き状況を確認する" },
    ],
  };
}
