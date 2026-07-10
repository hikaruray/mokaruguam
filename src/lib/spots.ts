// Popular spots — single source for the /spots list and each /spots/[slug] page.
//
// PHOTO NOTE: `src` uses placeholder images (picsum.photos). Swap to real photos
// by pointing `src` at files in /public (e.g. "/photos/spots/lovers.jpg").
//
// COPY NOTE: descriptions are intentionally brief and avoid asserting uncertain
// facts (opening hours, exact prices, history claims). They set the scene and
// steer the reader toward a booking request. Refine with the owner's input later.

import { photoFor } from "./images";

export interface Spot {
  slug: string;
  name: string;        // display name
  keyword: string;     // SEO angle, e.g. "グアム 恋人岬"
  seed: string;        // placeholder image seed
  tagline: string;     // one-line hook
  body: string[];      // short paragraphs
  tips: string[];      // "こんな方に" bullets
}

export const SPOTS: Spot[] = [
  {
    slug: "lovers-point",
    name: "恋人岬",
    keyword: "グアム 恋人岬",
    seed: "spot-lovers",
    tagline: "断崖から望む、グアム屈指の絶景ポイント。",
    body: [
      "タモン湾を見下ろす高台にある、グアムを代表する景勝地。青く広がる海と断崖のコントラストは、写真映えする定番スポットです。",
      "展望台からの眺めはもちろん、記念撮影の場所としても人気。ガイドがベストな構図でお撮りします。",
    ],
    tips: ["定番の絶景を押さえたい方", "記念写真をしっかり残したい方"],
  },
  {
    slug: "spanish-plaza",
    name: "スペイン広場",
    keyword: "グアム スペイン広場",
    seed: "spot-spain",
    tagline: "スペイン統治時代の面影が残る、街歩きの拠点。",
    body: [
      "グアムの中心地ハガニアにある歴史的な広場。周辺には歴史を感じさせる建物が点在し、のんびりとした街歩きが楽しめます。",
      "近隣の見どころと合わせて回りやすく、短時間プランにも組み込みやすいエリアです。",
    ],
    tips: ["歴史や街の雰囲気を味わいたい方", "散策しながら写真を撮りたい方"],
  },
  {
    slug: "apugan-fort",
    name: "アプガン砦",
    keyword: "グアム アプガン砦",
    seed: "spot-fort",
    tagline: "丘の上から街と海を一望する、夕景・夜景の名所。",
    body: [
      "ハガニアを見下ろす高台にある砦跡。眼下に街並みと海が広がり、特に夕方から夜にかけての眺めが人気です。",
      "サンセットや夜景を組み込んだプランとの相性が良いスポットです。",
    ],
    tips: ["サンセット・夜景を楽しみたい方", "静かな眺めでひと休みしたい方"],
  },
  {
    slug: "emerald-valley",
    name: "エメラルドバレー",
    keyword: "グアム エメラルドバレー",
    seed: "spot-emerald",
    tagline: "手つかずの自然が残る、南部の隠れた見どころ。",
    body: [
      "グアム南部にある自然豊かなエリア。定番の観光地とはひと味違う、のどかな景色が広がります。",
      "南部ドライブと組み合わせて訪れる方が多い、少し足を延ばして楽しむスポットです。",
    ],
    tips: ["定番以外の場所も見たい方", "南部の自然をドライブで楽しみたい方"],
  },
  {
    slug: "slow-walk-coffee",
    name: "スロウウォークコーヒー",
    keyword: "グアム スロウウォークコーヒー カフェ",
    seed: "spot-coffee",
    tagline: "ツアーの合間にひと息、人気のローカルカフェ。",
    body: [
      "ドライブや観光の途中に立ち寄りやすい、雰囲気のあるカフェ。ゆったりとした時間を過ごせます。",
      "休憩を挟みたいプランに組み込みやすく、ローカルの空気を感じられる一軒です。",
    ],
    tips: ["観光の合間に休憩を入れたい方", "ローカルな雰囲気を味わいたい方"],
  },
  {
    slug: "asan-memorial",
    name: "アサン戦争記念公園",
    keyword: "グアム アサン 戦争記念公園",
    seed: "spot-asan",
    tagline: "海沿いに広がる、歴史に触れる記念公園。",
    body: [
      "太平洋戦争にまつわる歴史を伝える海沿いの公園。穏やかな景色の中で、グアムの歩んできた歴史に触れられます。",
      "日本語ガイドが背景を分かりやすくご案内します。静かに過ごしたい方にもおすすめです。",
    ],
    tips: ["グアムの歴史を知りたい方", "海沿いを落ち着いて歩きたい方"],
  },
  {
    slug: "visitor-center",
    name: "ビジターセンター",
    keyword: "グアム ビジターセンター",
    seed: "spot-visitor",
    tagline: "グアムの見どころを知る、観光の出発点。",
    body: [
      "グアム観光の情報が集まるスポット。展示や資料を通して、島の魅力を知るきっかけになります。",
      "初めてのグアムで全体像をつかみたい方に。ガイドが要点をご案内します。",
    ],
    tips: ["初めてグアムを訪れる方", "島全体の概要を知りたい方"],
  },
];

export function getSpot(slug: string): Spot | undefined {
  return SPOTS.find((s) => s.slug === slug);
}

// List-thumbnail and hero image helpers. Real photo if available, else placeholder.
export function spotThumb(spot: Spot): string {
  return photoFor(spot.seed, 500, 380);
}
export function spotHero(spot: Spot): string {
  return photoFor(spot.seed, 1200, 675);
}
