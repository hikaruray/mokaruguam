// Restaurants we recommend on /dining.
//
// WHO CHOSE THESE: the owner, on 2026-09-18 — they live on Guam and eat at
// them. The facts on each card (area, address, genre) were checked against
// public listings the same day; the page prints that date.
//
// TWO VOICES, KEPT APART. `pick` is the owner's own recommendation (given
// 2026-09-19), shown as「Mokaruのひとこと」— an opinion, signed as ours.
// `blurb` stays factual: what the place is and where. Nobody at Mokaru should
// write a new superlative into `blurb`; if the owner has an opinion, it goes in
// `pick` in their words.
//
// 🔴 EVERY BUTTON GOES TO OUR FORM, NEVER THE RESTAURANT'S BOOKING PAGE.
// Our income here is the $10 arrangement fee, paid by the guest. A guest who
// follows a link to the restaurant's own reservation page books directly and
// the arrangement earns nothing. Same rule as lib/partners.ts.
//
// 🔴 A RESTAURANT THAT HAS CLOSED MUST COME OFF, NOT STAY WITH A NOTE.
// Delmonico was on the owner's first list. Public listings marked it closed in
// 2026 (Yelp: CLOSED, Feb 2026; GuamFoody's closed-restaurants list), so it was
// left out, and the owner confirmed on 2026-09-18 that it has closed. A guest
// who pays $10 for a table at a shut restaurant gets it back, but loses an
// evening they planned around it — check a pick is still open before adding it.

export interface Restaurant {
  // Stable key; also the anchor on /dining (#id).
  id: string;
  // As the restaurant writes its own name. This is also what goes into the
  // request form, so it is the name the owner will ask for on the phone.
  name: string;
  // How a Japanese guest will say it.
  nameJa: string;
  genre: string;
  area: string;
  // The owner's recommendation, in their words (lightly tidied, meaning kept).
  pick: string;
  blurb: string;
  // 🔴 Anything that changes whether we CAN book it. Shown prominently on the
  // card, because a request we are bound to turn down wastes the guest's time
  // and ours, even though it costs them nothing.
  bookingNote?: string;
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: "lone-star",
    name: "Lone Star Steakhouse",
    nameJa: "ローンスター・ステーキハウス",
    genre: "ステーキ",
    area: "タムニング（マリン・コープ・ドライブ沿い）",
    pick: "大人も子供も大満足のメニュー。迷ったらここ。",
    blurb:
      "アメリカのステーキハウスのチェーンで、いま営業しているのはグアムのこのお店だけです。地元の会社が運営しています。",
  },
  {
    id: "longhorn",
    name: "LongHorn Steakhouse",
    nameJa: "ロングホーン・ステーキハウス",
    genre: "ステーキ",
    area: "タムニング（グアム・プレミア・アウトレット近く）",
    pick: "ステーキと言えばここ。Tボーンは絶品。",
    blurb:
      "アメリカのステーキハウスのチェーン。家族連れでも入りやすい雰囲気のお店です。",
    // Owner, 2026-09-18.
    bookingNote:
      "金・土・日・祝日は、お店が予約を受け付けていません。この曜日は当社でもお取りできませんので、平日でご依頼ください。",
  },
  {
    id: "ruby-tuesday",
    name: "Ruby Tuesday",
    nameJa: "ルビー・チューズデー",
    genre: "アメリカン",
    area: "タムニング（グアム・プレミア・アウトレット内）",
    pick: "サラダバーが人気のアメリカンダイナー。バーガーもうまい。",
    blurb:
      "アメリカのカジュアルダイニングのチェーン。グアム・プレミア・アウトレットの中にあるので、お買い物の合間にも寄りやすいお店です。",
  },
  {
    id: "beachin-shrimp",
    name: "Beachin' Shrimp",
    nameJa: "ビーチン・シュリンプ",
    genre: "シーフード（エビ料理）",
    area: "タモン（ザ・プラザ）ほか、島内に3店",
    pick: "ガーリックシュリンプとスープパスタが大人気。メニューもリーズナブル。",
    blurb:
      "エビ料理のお店。タモンのザ・プラザのほか、アッパータモンのフレームツリー・プラザ、マイクロネシア・モールにもあります。ご希望の店舗をお知らせください。",
  },
  {
    id: "crab-daddy",
    name: "Crab Daddy",
    nameJa: "クラブ・ダディ",
    genre: "シーフード（ケイジャン）",
    area: "タモン（ホリデイ・リゾート1階）／ハガニア",
    pick: "テーブルに広げて、手づかみで豪快に食べるのが美味しい。",
    blurb:
      "カニやエビなどのシーフードを、ケイジャン風の味付けで楽しめるお店。タモンのホリデイ・リゾートとハガニアの2店があります。ご希望の店舗をお知らせください。",
  },
  {
    id: "alfredos",
    name: "Alfredo's Steakhouse",
    nameJa: "アルフレード・ステーキハウス",
    genre: "ステーキ",
    area: "タモン（デュシタニ・グアム・リゾート3階）",
    pick: "ワンランク上のステーキハウス。特別な日に。",
    blurb:
      "ホテル内のステーキハウス。グアムで唯一ドライエイジング・ビーフを出すお店だと、お店は説明しています。席数が60ほどと多くないので、早めのご依頼がおすすめです。",
  },
  {
    id: "roys",
    name: "Roy's",
    nameJa: "ロイズ",
    genre: "ハワイアン・フュージョン",
    area: "タモン（ヒルトン・グアム・リゾート＆スパ内）",
    pick: "ローカルに大人気のハワイアン・フュージョン・ダイニング。",
    blurb:
      "ハワイ発祥のレストラン。太平洋の食材とフランス料理の技法を合わせた、ハワイアン・フュージョン料理のお店です。",
  },
];

// When the facts on the cards were last checked against public listings.
export const RESTAURANTS_CHECKED_ON = "2026-09-18";
