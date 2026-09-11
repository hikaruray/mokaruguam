// Corrections applied to restored legacy articles before they are rendered.
//
// WHY THIS FILE EXISTS
// The 2026-07-17 restore deliberately left 14 articles offline because their
// text sold things the business no longer sells: prices from the old rate card
// ($130/3h, $230/5h, $300/8h, $450/day vs the current $170/$250/$345/$500) and
// perks it no longer offers. Publishing them as written would quote a customer
// a price we would then refuse to honour.
//
// Owner decision (2026-07-19): fix the text and bring them back. That turned
// out to need more than a find-and-replace on the numbers, because the product
// itself changed shape:
//   • Pricing went from one flat per-vehicle price ("最大7名まで $130") to
//     tiers (1–4 guests base, 5–7 guests +$20) plus a peak season. An article
//     that states a single flat price is wrong for half the year, so every
//     price we restate carries PRICE_SUFFIX pointing at /plans.
//   • Airport transfers were discontinued (owner, 2026-07-19). Whole sections
//     were built around them and are removed, not reworded.
//   • The multi-day "Total" plan no longer exists; the nearest live product is
//     the single-day ワンデープラン ($500). Owner approved reframing it.
//   • Start times no longer match START_TIMES in pricing.ts.
//
// WHY NOT JUST EDIT legacy-content.json
// That file is the byte-exact WordPress snapshot, and it is the only copy of
// this content that exists (no Wayback capture, and the Xserver origin is going
// away). Editing it in place would destroy the original and make "what did we
// change?" unanswerable. Keeping the snapshot pristine and the edits declared
// here means the diff is auditable in one screen, and any correction can be
// reverted by deleting a few lines.
//
// HOW IT FAILS
// Every `find` below MUST match its article exactly `count` times. If the
// snapshot is ever re-exported and the wording shifts, the find stops matching
// and the BUILD FAILS rather than silently shipping the old price. This is the
// same trick images.ts uses to keep placeholder photos out of production: make
// the mistake impossible to deploy, not merely unlikely.
//
// Nothing here rewrites the owner's voice for style. Each edit exists because
// the sentence was factually wrong, and it changes the minimum needed.

/** One text substitution inside a restored article. */
export interface Correction {
  /**
   * Exact substring of the RAW snapshot HTML (corrections run before cleanHtml).
   * Exactly one of `find` / `findRe` is required.
   */
  find?: string;
  /**
   * Regex alternative, for removing a whole BLOCK whose inner text differs per
   * article but whose delimiters do not.
   *
   * 🔴 It keeps the same contract as `find`: the match count is asserted, and a
   * mismatch fails the build. A pattern that silently matched nothing would be
   * strictly worse than an exact string, because it would look like the edit
   * had been applied.
   *
   * Must carry the `g` flag, or it cannot be counted.
   */
  findRe?: RegExp;
  /** Replacement. Empty string deletes the passage. */
  replace: string;
  /** Why this is wrong as written — the reason has to survive, not just the fix. */
  why: string;
  /** Required number of occurrences. Build fails on any other count. */
  count?: number;
}

export interface ArticleCorrections {
  /** Applied to the article title. */
  title?: Correction[];
  /** Applied to the article body. */
  body: Correction[];
}

// 🔵 PRICE_SUFFIX and the START_* constants were deleted on 2026-09-12.
//
// They existed to restate the charter's rate card and start times inside the
// articles that quoted them — every one of which is now either rewritten
// (legacy-rewrites.ts) or has had its price block removed. Nothing references
// them, and nothing should: the product they described ends 2026-09-30.
//
// Worth noticing rather than quietly deleting. They were a maintenance
// obligation — a comment above START_* asked whoever edited START_TIMES in
// pricing.ts to come and update prose over here, which nothing enforced. That
// obligation is gone along with the product.

// ---------------------------------------------------------------------------
// The in-article promotion block (2026-09-12, the Oct 1 pivot)
// ---------------------------------------------------------------------------
// Fifteen articles end with a promotional block the old blog appended by hand:
// a separator, an ✈️ heading naming モカル, a few bullets, and a 🌺 詳しくは
// こちら link. Between them they advertise services the company does not
// provide and in several cases never did:
//
//   24時間LINEサポート / 空港送迎 / 移住サポート（ビザ・住まい探し）/
//   開業サポート（営業許可申請）/ ホテルのクレーム代行 / 求人紹介 /
//   「LINEで予約」/「24h以内に空き状況を即時回答」
//
// LINE stops being a customer channel on 2026-10-01, and the guided tours these
// blocks upsell stop on 2026-09-30.
//
// 🔴 REMOVED, NOT REWORDED, and that is the whole point.
//
// Rewording fifteen hand-written pitches produces fifteen slightly different
// descriptions of one offer, maintained nowhere, drifting apart the first time
// the terms change. lib/legacy-cta.ts ALREADY renders the correct offer under
// every one of these articles, written once and audited twice. Deleting the old
// block leaves exactly one statement of what we sell, in the file that owns it.
//
// The articles themselves are untouched. Every one keeps its real subject —
// tipping, reef safety, night markets — which is what earns the traffic.
//
// One rule rather than fifteen exact strings: the inner text differs per
// article, the delimiters do not. The count is still asserted per article, so a
// re-exported snapshot whose markup shifted fails the build instead of quietly
// shipping the pitch.
const PROMO_BLOCK: Correction = {
  findRe:
    /\s*<hr class="wp-block-separator has-alpha-channel-opacity"\/>\s*<h2 class="wp-block-heading">✈️[\s\S]*?🌺\s*詳しくはこちら[\s\S]*?<\/p>/g,
  replace: "",
  why:
    "記事末尾の販促ブロック。24時間LINEサポート・空港送迎・移住/開業サポートなど、" +
    "提供しないサービスを宣伝している。正しい案内は legacy-cta.ts が全記事の下に出す。",
};

export const CORRECTIONS: Record<string, ArticleCorrections> = {
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // The heaviest edit in this file. The article's subject — a multi-day
  // "Total" plan with airport transfers — is a product that no longer exists.
  // Owner approved reframing it onto the ワンデープラン (12h, $500), which is
  // the closest live product; consecutive days are simply several ワンデー
  // bookings, which is true today and needs no new product.

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // ALREADY LIVE since the 2026-07-17 restore. bus-rentacar and guam-traffic
  // both slipped through the stale-pricing exclusion: they quote our own tours
  // off the old rate card and sell a 6-hour plan that has never existed in
  // pricing.ts, plus airport transfers. Found 2026-07-19 while reviving the
  // other twelve — the exclusion list was built from the plan articles and
  // never swept the practical guides, which quote prices in passing.
  // 🔴 2026-09-12: these two corrections were themselves out of date.
  //
  // In July they replaced the retired airport-transfer prices with the CURRENT
  // charter rate card ($170/$250/$345) — correct then, wrong from 2026-10-01,
  // when the charter ends. A correction is not a one-time fix; it is a standing
  // claim, and it goes stale with the thing it describes.
  //
  // They are now deletions rather than substitutions. We are not a way of
  // getting around Guam any more, so listing ourselves in an article comparing
  // ways of getting around Guam — at any price — would be misleading. What we
  // do sell is stated under every article by legacy-cta.ts.
  //
  // 🔵 This is also why the build output has to be grepped for the CURRENT
  // product's words, not only the old one's. Searching for「Shortプラン」would
  // have reported zero while these two pages still quoted the rate card, and
  // it did: the miss was found by grepping「貸切プラン」and「$170」afterwards.
  "guam-traffic": {
    body: [
      {
        why: "自社の送迎・貸切の料金表。2026-09-30で提供が終わるので、価格を直すのではなく削除する。",
        find: "<p>📌 <strong>Mokaruの送迎プラン（1台あたりの料金）</strong><br>🚗 <strong>空港送迎（片道）：$25～ （セダンタイプは４名まで。ヴァンタイプは６名まで）</strong><br>🚗 <strong>観光エリア送迎（ホテル⇔ショッピング）：３時間$１３０～</strong><br>🚗 <strong>カスタムプラン（貸切ツアー）：6時間$300～</strong></p>",
        replace: "",
      },
      {
        why: "移動手段の比較表に自社の行が入っている。移動手段の提供をやめるので、行ごと削除する（セルだけ消すと空の行が残る）。",
        findRe: /<tr><td><strong>Mokaru送迎<\/strong>[\s\S]*?<\/tr>/g,
        replace: "",
      },
      {
        why: "「どの移動手段がいい？と迷ったらMokaruに相談」＝移動手段の相談窓口としての導線。提供しないサービスへの誘導になる。",
        findRe:
          /\s*<p>📩 <strong>「どの移動手段がいい？」と迷ったら、Mokaruに相談！<\/strong>[\s\S]*?<\/p>/g,
        replace: "",
      },
    ],
  },

  "bus-rentacar": {
    body: [
      {
        why: "自社の送迎・貸切の料金表。上の guam-traffic と同じ理由で削除する。",
        find: "<p>📌 <strong>Mokaruの送迎プラン（1台あたりの料金）</strong><br>🚗 <strong>空港送迎（片道）：$25～  $45</strong><br>🚗 <strong>ホテル⇔観光地のショートプラン：$130～</strong><br>🚗 <strong>貸切ツアー（6時間）：$300～</strong></p>",
        replace: "",
      },
      {
        why: "「効率よく観光したいならMokaruの送迎がベスト」＝提供をやめる移動手段の推奨。",
        find:
          "<p>💡 <strong>「効率よく観光したい」「英語が不安」なら、Mokaruの送迎がベスト！</strong></p>",
        replace: "",
      },
      {
        // The午前 leg of a day-route is built around our own transport. The
        // destinations are real and worth keeping — Talofofo Falls and the
        // Inarajan natural pool are exactly why someone reads this article —
        // so the leg is rewritten to name the places without naming a lift we
        // will not be giving anyone.
        why: "1日ルートの午前が自社送迎前提。行き先（タロフォフォの滝・イナラハン天然プール）は残し、移動手段の指定だけ外す。",
        find:
          "<p>🚙 <strong>Mokaru送迎（ホテル発）</strong><br>↓<br>🏞 <strong>タロフォフォの滝＆イナラハン天然プール</strong> → 大自然の絶景スポットを巡る！<br>↓<br>🚖 <strong>（Mokaru送迎）ホテルへ戻る</strong></p>",
        replace:
          "<p>🏞 <strong>タロフォフォの滝＆イナラハン天然プール</strong> → 大自然の絶景スポットを巡る！<br>※ どちらも南部で、バスは通っていません。レンタカーか、送迎のあるツアーを手配して向かうことになります。</p>",
      },
    ],
  },

  // ===========================================================================
  // Discontinued-service claims on articles that have been LIVE since 07-17.
  // ===========================================================================
  // Owner confirmed 2026-07-19 that airport transfers and 24-hour support are
  // no longer offered — yet nine live articles still advertised them, five with
  // a price attached. Measured before acting: only airport-shuttle is ABOUT the
  // dead service (it is in the title); in the rest the claim is one line to one
  // section of an article whose real subject is still true. Owner's call: 410
  // airport-shuttle only, and cut the claim out of the other eight rather than
  // throw away eight ranking pages to delete a sentence.
  //
  // These are the same promises that keep 24hour-support offline — the 07-17
  // exclusion caught the article about the perk and missed the articles that
  // mention it in passing.

  "mokaru-support": {
    body: [
      {
        why: "Section ① is entirely the discontinued airport transfer.",
        find: '<hr class="wp-block-separator has-alpha-channel-opacity"/>\n\n\n\n<h2 class="wp-block-heading"><strong>🛫 ① 空港送迎付きだから、到着後すぐに快適な旅がスタート！</strong></h2>\n\n\n\n<p>グアム到着後、タクシーやレンタカーの手配に手間取る心配なし！<br><strong>Mokaruの日本語ガイドが空港でお出迎えし、ホテルまでスムーズにご案内します。</strong></p>\n\n\n\n<p>💡 <strong>空港送迎のメリット</strong><br>✅ <strong>飛行機の到着時間に合わせてピックアップ🚗✨</strong><br>✅ <strong>英語のやり取り不要！スムーズにホテルチェックイン</strong>🏨<br>✅ <strong>旅行プランの最終確認もその場でOK！</strong></p>\n\n\n\n<p>📌 <strong>「ホテルまでの移動が不安…」という方も、日本語サポート付きで安心！</strong></p>\n\n\n\n',
        replace: "",
      },
      // Renumber ②–⑤ → ①–④ now that ① is gone.
      {
        why: "Renumber after deleting section ①.",
        find: "<strong>🗺 ② 現地の最新情報",
        replace: "<strong>🗺 ① 現地の最新情報",
      },
      {
        why: "Renumber after deleting section ①.",
        find: "<strong>🚗 ③ 迷わず快適！",
        replace: "<strong>🚗 ② 迷わず快適！",
      },
      {
        why: "Renumber after deleting section ①.",
        find: "<strong>📩 ④ トラブル時も安心！",
        replace: "<strong>📩 ③ トラブル時も安心！",
      },
      {
        why: "Renumber after deleting section ①.",
        find: "<strong>🌙 ⑤ 夜のグアムも安心して楽しめる！",
        replace: "<strong>🌙 ④ 夜のグアムも安心して楽しめる！",
      },
      {
        why: "Summary repeats the airport transfer as a selling point.",
        find: "✅ <strong>空港送迎で到着後もスムーズ！</strong><br>",
        replace: "",
      },
    ],
  },

  "before-departure": {
    body: [
      {
        why: "Lists arranging an airport transfer as something LINE can do for you.",
        find: "✅ <strong>空港送迎やオプショナルツアーの手配</strong><br>",
        replace: "",
      },
      {
        why: "Section ④ is the discontinued airport transfer, quoted at the old $25 one-way rate. It is the last numbered section, so nothing needs renumbering.",
        find: '<hr class="wp-block-separator has-alpha-channel-opacity"/>\n\n\n\n<h2 class="wp-block-heading"><strong>🚖 ④ 空港送迎＆観光プランの相談もLINEでOK！</strong></h2>\n\n\n\n<p>「<strong>空港からホテルまでの移動はどうすればいい？</strong>」<br>「<strong>自由に観光したいけど、どんなプランがいい？</strong>」</p>\n\n\n\n<p>Mokaruなら、<strong>LINEで空港送迎や観光プランの手配も簡単！</strong></p>\n\n\n\n<p>💡 <strong>LINEで手配できるサービス！</strong><br>✅ <strong>空港送迎（片道$25～）</strong> → 深夜・早朝便も対応！<br>✅ <strong>観光プランのカスタマイズ相談</strong> → 自分好みのツアーを作れる！<br>✅ <strong>ショッピングやアクティビティの送迎手配</strong><br>✅ <strong>人気の観光地の混雑状況もチェック可能！</strong></p>\n\n\n\n<p>📌 <strong>「移動や観光の手配も、すべてLINEで完結できる！」</strong></p>\n\n\n\n',
        replace: "",
      },
      {
        why: "Summary repeats the airport transfer.",
        find: "<br>🚖 <strong>空港送迎＆観光プラン手配！</strong> → すべてLINEで簡単手配",
        replace: "",
      },
      // The free restaurant booking agent — this article sells it hardest (five
      // mentions, one of them a section heading).
      //
      // ORDER MATTERS BELOW: "人気レストランの予約代行（無料！）" appears twice.
      // The longer §③ pair is removed first, so the remaining single occurrence
      // is unambiguous and can be asserted at count 1.
      {
        why: "Both bullets are the booking agent ('予約代行', and checking availability and booking for you). The two recommendation bullets under them are real and stay.",
        find: "✅ <strong>人気レストランの予約代行（無料！）</strong><br>✅ <strong>当日でもOK！空席状況を確認して予約</strong><br>",
        replace: "",
      },
      {
        why: "Booking agent advertised in the opening list of what LINE can do. (Now the only occurrence, after the §③ pair above.)",
        find: "✅ <strong>人気レストランの予約代行（無料！）</strong><br>",
        replace: "",
      },
      {
        why: "Section ③'s heading sells booking-by-LINE. Recommending restaurants is real, so the section keeps that half.",
        find: "<strong>🍽 ③ LINEでレストラン予約＆おすすめ店の紹介もOK！</strong>",
        replace: "<strong>🍽 ③ LINEでおすすめ店の紹介もOK！</strong>",
      },
      {
        why: "Booking agent named as a LINE service.",
        find: "<p>MokaruのLINEサポートでは、<strong>レストランの予約代行や、おすすめグルメ情報もお届け！</strong></p>",
        replace: "<p>MokaruのLINEサポートでは、<strong>おすすめグルメ情報をお届け！</strong></p>",
      },
      {
        why: "Summary repeats the free booking agent.",
        find: "<br>🍽 <strong>レストラン予約代行無料！</strong> → 人気店の予約もスムーズ",
        replace: "",
      },
    ],
  },

  // 2026-09-12: both of these previously carried a one-sentence correction that
  // cut the discontinued airport transfer out of their closing pitch. Verified
  // that both sentences live INSIDE the promo block, and each appears exactly
  // once in the article — so the whole block going takes them with it, and the
  // old corrections would now match zero times and fail the build. Removed as
  // redundant, not because the claim became acceptable.
  touts: { body: [PROMO_BLOCK] },

  drivers: { body: [PROMO_BLOCK] },

  "ladies-safety": {
    body: [
      {
        why: "Promises 24-hour support, which the business does not offer (owner, 2026-07-19) — the same claim that keeps 24hour-support offline.",
        find: "\n\n\n\n<li>トラブル時も24時間サポート！</li>",
        replace: "",
      },
      {
        why: "Advertises a women-only tour and a night transfer plan. Neither is a product (owner, 2026-07-19); PLANS has four charter lengths and nothing else.",
        find: "\n\n\n\n<li>女性専用ツアーや夜間送迎プランあり</li>",
        replace: "",
      },
      // 販促ブロックの削除は最後に走らせる。上の各 find は手つかずの
      // スナップショットに対して書かれているため、先にブロックを消すと
      // 0件になってビルドが落ちる。
      PROMO_BLOCK,
    ],
  },

  "hotel-complaint": {
    body: [
      {
        why: "'24時間LINEサポート' promises round-the-clock cover. LINE itself is real, so only the 24-hour claim goes.",
        find: "<li>モカルの24時間LINEサポートなら、<strong>クレームの伝え方をサポート</strong>します！（プランによる）</li>",
        replace: "<li>モカルのLINEサポートなら、<strong>クレームの伝え方をサポート</strong>します！（プランによる）</li>",
      },
      // 販促ブロックの削除は最後に走らせる。上の各 find は手つかずの
      // スナップショットに対して書かれているため、先にブロックを消すと
      // 0件になってビルドが落ちる。
      PROMO_BLOCK,
    ],
  },

  "nightmarket-troubles": {
    body: [
      {
        why: "Promises 24-hour cover. LINE is a real channel, so the line keeps its point without the promise.",
        find: "<li>盗難やトラブル時も24時間対応のサポートあり</li>",
        replace: "<li>盗難やトラブル時もLINEでご相談いただけます</li>",
      },
      {
        // The 2026-07-19 sweep fixed the claim at the foot of this article and
        // missed this one higher up — same article, same promise, found on
        // 2026-09-03 by grepping the live pages rather than the source. Worth
        // noting for the next sweep: one hit per article is not the end of it.
        why: "Same 24-hour promise as above, in the 'ask Mokaru on LINE' step. It is the claim that keeps 24hour-support offline, and this is the worst page to make it on — a reader here is already in trouble and would rely on it.",
        find: "<li><strong>24時間対応</strong>で、現地トラブルのサポートが可能　（プランによる）</li>",
        replace: "<li><strong>LINEでご相談いただけます</strong>（プランによる）</li>",
      },
      // 販促ブロックの削除は最後に走らせる。上の各 find は手つかずの
      // スナップショットに対して書かれているため、先にブロックを消すと
      // 0件になってビルドが落ちる。
      PROMO_BLOCK,
    ],
  },

  "mokaru-vision": {
    body: [
      {
        why: "Promises '24時間対応のAIサポート'. Written as a vision piece, but it reads as a current service and there is no AI support — the Japanese-speaking guide half is true and stays.",
        find: "<p>そんな声に応えるため、Mokaruでは<strong>LINEサポートを導入！</strong><br>旅行前から、<strong>24時間対応のAIサポート＋日本語ガイドのサポート</strong>で、お客様の安心を守ります。</p>",
        replace: "<p>そんな声に応えるため、Mokaruでは<strong>LINEサポートを導入！</strong><br>旅行前から、<strong>日本語ガイドのサポート</strong>で、お客様の安心を守ります。</p>",
      },
      {
        why: "Lists booking restaurants for the guest as a LINE service (see the booking-agent note below).",
        find: "✅ <strong>滞在中 → 緊急時の対応（レストラン予約、トラブルサポートなど）</strong>",
        replace: "✅ <strong>滞在中 → 緊急時の対応（トラブルサポートなど）</strong>",
      },
    ],
  },

  // ===========================================================================
  // "Free restaurant booking agent" and other services we do not run.
  // ===========================================================================
  // Owner, 2026-07-19: the guide helping at the restaurant on the day is real —
  // a VELTRA review we publish on /reviews says exactly that ("予約や注文サポート
  // までお世話になり"). What is NOT real is the advertised free booking-agent
  // service ("人気レストランの予約代行（無料！）"). So the sales claims go and
  // the descriptions of what a guide does on the day stay; deleting both would
  // have put the articles at odds with our own review page.
  //
  // Deliberately NOT touched, because they are not our claims to make or break:
  //   • honeymoon-couple's "記念日なら、デザートプレートのサプライズ演出も可能"
  //     sits in a list of recommended RESTAURANTS (ザ・ビーチ / プロア / …) and
  //     describes what those restaurants do — same category as the taxi fares in
  //     guam-traffic.
  //   • longplanpost / middleplanpost / transportation say a guide helps with
  //     ordering and booking on the day. That is the real service.
  //
  // Confirmed still offered and therefore left alone: child seats, cooler box,
  // interpreting/negotiating, shoot accompaniment, holding luggage (要相談).

  "mokaru-highlights": {
    body: [
      {
        why: "Advertises the free restaurant booking-agent service, which is not offered.",
        find: "✔ <strong>レストランの予約代行</strong>（人気店は予約必須！）<br>",
        replace: "",
      },
    ],
  },

  "family-friendly": {
    body: [
      {
        why: "Advertises booking restaurants on the guest's behalf. Recommending them is real, so the sentence keeps its point.",
        find: "<p>Mokaruなら、<strong>お子様連れでも安心のレストランをご提案＆予約代行！</strong></p>",
        replace: "<p>Mokaruなら、<strong>お子様連れでも安心のレストランをご提案！</strong></p>",
      },
      {
        why: "'事前予約' here means we book it for you.",
        find: "✅ <strong>ベビーチェア完備のレストランを事前予約！</strong><br>",
        replace: "✅ <strong>ベビーチェア完備のレストランをご提案！</strong><br>",
      },
      {
        why: "Same booking-agent claim in the summary.",
        find: "→ キッズメニュー＆ベビーチェア完備のレストランを事前予約！",
        replace: "→ キッズメニュー＆ベビーチェア完備のレストランをご提案！",
      },
    ],
  },

  "post-wedding-tour": {
    body: [
      {
        why: "States a minibus charter is available for large groups. Our vehicles top out at 7 (MAX_GUESTS in pricing.ts); the owner will take it case by case, so it must read as a request rather than a standing offer.",
        find: "<li>大人数ならミニバスの<strong>グアム チャーター</strong>手配可</li>",
        replace: "<li>大人数の場合はミニバスの<strong>グアム チャーター</strong>もご相談ください（要相談）</li>",
      },
    ],
  },

  // 🔵 Corrected, NOT rewritten, and the distinction is the point.
  //
  // transportation is a genuinely good article about getting around Guam — the
  // trolley runs about hourly and costs 7 dollars a ride, a taxi to a main
  // hotel is around 25 dollars, there is essentially no hailing one in the
  // street. All of that stays true on 2026-10-01 and is exactly what a trip
  // planner searches for.
  //
  // What has to go is the sales comparison bolted onto the end: a section
  // costing out the five-hour charter at 230 dollars against those options, a
  // list of reasons to choose it, and a conclusion recommending it. The product
  // ends 2026-09-30. Cutting three sections out of a useful article is what
  // corrections are for; the plan ARTICLES were rewritten because there was
  // nothing left once the product went.
  transportation: {
    body: [
      {
        findRe:
          /\s*<hr class="wp-block-separator has-alpha-channel-opacity"\/>\s*<h3 class="wp-block-heading">Mokaru Middleプラン[\s\S]*?<\/ol>/g,
        replace: "",
        why:
          "5時間チャーター（230ドル）の料金比較と「Mokaruならではの強み」。2026-09-30で終了する商品の宣伝で、" +
          "料金も旧レート。移動手段の解説そのものは正しいので残す。",
      },
      {
        findRe:
          /\s*<p>グアム旅行中の移動手段は複数ありますが、[\s\S]*?Mokaruのプライベートチャーターがおすすめです。<\/p>/g,
        replace:
          '\n\n\n\n<p>グアムの移動手段は、それぞれに向き不向きがあります。タモン周辺だけならトローリーバスと徒歩で足りますが、恋人岬や南部まで足を延ばすなら、待ち時間の少ない手段を確保しておくほうが確実です。人数が増えるほど、1回ごとに人数分かかる移動手段は割高になります。</p>\n\n\n\n<p>行き先を決めてから移動手段を選ぶのではなく、使える移動手段から行き先を決めるほうが、グアムでは失敗しません。</p>',
        why:
          "まとめが「だからMokaruのプライベートチャーターを」で終わっていた。記事の主題（移動手段の比較）で締めるよう書き換え。",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 販促ブロックの削除だけ。記事本文には手を入れていない（PROMO_BLOCK 参照）
  // ---------------------------------------------------------------------
  "business": { body: [PROMO_BLOCK] },
  "living-costs": { body: [PROMO_BLOCK] },
  "visas": { body: [PROMO_BLOCK] },
  "common-sense": { body: [PROMO_BLOCK] },
  "crossing-reef": { body: [PROMO_BLOCK] },
  "how-to-live": { body: [PROMO_BLOCK] },
  "tips": { body: [PROMO_BLOCK] },
  "insurance": { body: [PROMO_BLOCK] },
  "sunburn": { body: [PROMO_BLOCK] },
  "guam-jobs": { body: [PROMO_BLOCK] },
};

/**
 * Apply this article's corrections to `html` (or its title).
 *
 * Throws on any find that does not match exactly `count` times. This runs
 * during generateStaticParams/SSG, so a stale find fails `next build` — the
 * wrong price never reaches production.
 */
export function applyCorrections(
  slug: string,
  text: string,
  which: "body" | "title" = "body",
): string {
  const list = CORRECTIONS[slug]?.[which];
  if (!list) return text;

  let out = text;
  for (const c of list) {
    const expected = c.count ?? 1;
    const label = c.findRe ? String(c.findRe) : JSON.stringify(c.find?.slice(0, 120));

    if ((c.find === undefined) === (c.findRe === undefined)) {
      throw new Error(
        `legacy-corrections: [${slug}] ${which} correction must have exactly one of find / findRe.`,
      );
    }

    let found: number;
    if (c.findRe) {
      if (!c.findRe.global) {
        throw new Error(
          `legacy-corrections: [${slug}] findRe needs the g flag to be counted: ${label}`,
        );
      }
      found = (out.match(c.findRe) ?? []).length;
    } else {
      found = out.split(c.find!).length - 1;
    }

    if (found !== expected) {
      throw new Error(
        `legacy-corrections: [${slug}] ${which} correction matched ${found}x, expected ${expected}x.\n` +
          `  find: ${label}\n` +
          `  why:  ${c.why}\n` +
          `The snapshot text changed. Re-check the article and update the find, ` +
          `or drop the correction if the sentence is gone.`,
      );
    }

    out = c.findRe
      ? out.replace(c.findRe, c.replace)
      : out.split(c.find!).join(c.replace);
  }
  return out;
}
