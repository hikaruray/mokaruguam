// Contextual prompt shown under each restored legacy article.
//
// WHY
// The old blog collected exactly the right readers — people planning a Guam
// trip right now — and then sold them nothing. The articles are left exactly as
// written; this only appends a route into the funnel underneath them.
//
// TONE
// It reads as a note from someone who lives here, not an ad. One card, no
// urgency, no discount bait. The article has to still be worth reading.
//
// CLAIMS — REWRITTEN 2026-09-11 FOR THE OCT 1 PIVOT
// The guided charter service ends 2026-09-30. From 10/1 the business arranges
// bookings: partner activities (the guest pays us nothing; the partner pays a
// commission) and restaurant reservations ($10 per booking, nothing if the
// table can't be had).
//
// This single file is the highest-leverage one on the site: it renders under
// ALL 90 published legacy articles. Until this rewrite it put "完全貸切ガイド
// チャーター", "日本語ガイドが運転する専用車" and "$170〜" on every one of
// them — which is why the audit found the old service quoted on 94–106 pages
// while the design doc was calling article editing "the mountain". It is not
// the mountain. It is this file.
//
// Deliberately NOT claimed here: that we drive, guide, own a vehicle, or run
// any tour ourselves; airport pickup (discontinued); 24-hour support; repeat
// discounts. The old articles made service claims the business does not honour,
// which is why some are still offline and why the rest needed
// legacy-corrections.ts before they could go back up. Do not reintroduce that.

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

// What it costs, stated the same way everywhere. "Nothing if we can't get it"
// is the whole proposition for the restaurant side, so it is never dropped.
const FEE_NOTE =
  "レストランの予約代行は1件 $10。お席がお取りできなかった場合、料金はいただきません。ツアーの手配は、お客様のお支払いはありません。";

const THEMES: Record<Theme, { heading: string; lead: string }> = {
  // Article is about a specific place worth visiting.
  sights: {
    heading: "この記事の場所、行く前に手配できます",
    lead: `Mokaru Guam は、グアムにいる日本人が予約を代わりにお取りするサービスです。アクティビティも、近くのレストランも、渡航前に日本語で手配できます。${FEE_NOTE}`,
  },
  // Restaurants and local food.
  food: {
    heading: "気になったお店、代わりに予約します",
    lead: `電話が通じない、日本語が使えない、そもそもネット予約が無い。グアムの人気店ではよくあることです。Mokaru Guam は、現地にいる日本人がお店へ直接ご連絡してお席をお取りします。${FEE_NOTE}`,
  },
  // Shopping and souvenirs.
  shopping: {
    heading: "買い物のあとの食事、先に押さえておけます",
    lead: `混み合う時間帯のレストランは、当日だと入れないこともあります。Mokaru Guam は、グアムにいる日本人が渡航前に代わって予約をお取りします。${FEE_NOTE}`,
  },
  // Hotel reviews and hotel-choosing.
  hotel: {
    heading: "泊まる場所が決まったら、あとは予約の手配だけ",
    lead: `Mokaru Guam は、グアムにいる日本人が予約を代わりにお取りするサービスです。滞在中のレストランやアクティビティを、渡航前に日本語で手配できます。${FEE_NOTE}`,
  },
  // Getting around: buses, taxis, rental cars.
  transport: {
    heading: "移動より先に、予約が要るものを",
    lead: `移動の手段は当日でもなんとかなりますが、人気店の席と催行人数の決まったアクティビティは当日では取れません。Mokaru Guam が、渡航前に日本語で代わってお取りします。${FEE_NOTE}`,
  },
  // Family / couples / occasions.
  family: {
    heading: "人数が多いほど、先に取っておくと安心です",
    lead: `お子様連れやグループでの食事は、席の確保が当日ではむずかしいことがあります。Mokaru Guam は、グアムにいる日本人が事前に代わってご予約をお取りします。${FEE_NOTE}`,
  },
  // Practical know-how (money, weather, safety, living) — the default.
  practical: {
    heading: "現地にいる日本人が、代わりに予約します",
    lead: `Mokaru Guam は、グアム在住の日本人がレストランやアクティビティの予約を代わりにお取りするサービスです。メールだけで、渡航前に日本語で手配できます。${FEE_NOTE}`,
  },
  // These articles were written to sell our OWN charter plans, which end
  // 2026-09-30. They cannot point at a rate card that no longer exists, so this
  // theme says plainly that the service ended before offering the new one.
  // The article bodies are corrected separately (see legacy-corrections.ts).
  plan: {
    heading: "貸切ガイドツアーは2026年9月で終了しました",
    lead: `Mokaru Guam の貸切ガイドチャーターは 2026年9月30日をもって終了しました。現在は、提携先のアクティビティのお手配と、レストランの予約代行を行っています。${FEE_NOTE}`,
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
  // transport ("airport-shuttle" used to be here; retired 2026-07-19)
  "transportation": "transport", "guam-traffic": "transport", "bus-rentacar": "transport",
  "drivers": "transport",
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
      { href: "/plans", label: "手配できるツアーを見る" },
      { href: "/reserve", label: "手配を依頼する" },
    ],
  };
}
