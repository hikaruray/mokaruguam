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
  /** Exact substring of the RAW snapshot HTML (corrections run before cleanHtml). */
  find: string;
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

// Appended wherever an article restates one of our own prices. Prices are now
// tiered and seasonal, so a bare number is a half-truth even when it matches
// the base rate — which is exactly how these articles went stale in the first
// place. /plans is the only page that can be right all year.
const PRICE_SUFFIX =
  "（1〜4名の料金。5〜7名は+$20、繁忙期は別料金です。最新の料金は<a href=\"/plans\">料金ページ</a>をご覧ください）";

// Current start times, from START_TIMES in pricing.ts. Kept as prose here
// because these are sentences in an article, not data — but if pricing.ts ever
// changes, these lines are wrong and nothing will catch it. Grep for this
// comment when editing START_TIMES.
const START_SHORT = "午前 8:30／9:00／9:30、午後 12:30／13:00／13:30、夕方 16:30／17:00／17:30";
const START_MIDDLE = "午前 8:30／9:00／9:30、午後 14:00／14:30／15:00";
const START_LONG = "午前 8:30／9:00／9:30";

export const CORRECTIONS: Record<string, ArticleCorrections> = {
  // -------------------------------------------------------------------------
  "short-plan": {
    body: [
      {
        why: "Section built entirely around airport transfers, which the business no longer offers (owner, 2026-07-19). Reworded it would still promise the service, so the section goes.",
        find: '<h2 class="wp-block-heading"><strong>3. 空港送迎＋そのままショッピングコース</strong></h2>\n\n\n\n<p><strong>「ホテルのチェックインまで時間がある」「帰国前にお土産を買いたい」</strong><strong></strong></p>\n\n\n\n<p><strong>そんな時に空港ピックアップ＋</strong><strong>3時間Shortプランの合わせ技が大人気！</strong></p>\n\n\n\n<p><strong>このプランでできること：</strong><strong></strong></p>\n\n\n\n<p><strong>空港からホテルまでの送迎</strong><strong></strong></p>\n\n\n\n<p><strong>チェックイン前にマイクロネシアモールや</strong><strong>Kマートで買い物</strong></p>\n\n\n\n<p><strong>レストランやカフェで到着直後の腹ごしらえにも対応</strong><strong></strong></p>\n\n\n\n<p><strong>✈️ 事前にスーツケースを預かってそのまま観光も可能（要相談）</strong></p>\n\n\n\n',
        replace: "",
      },
      {
        why: "Renumber: removing the airport section above would otherwise leave the article numbered 1, 2, 4.",
        find: "<strong>4. チャモロビレッジのナイトマーケット（※水曜のみ）</strong>",
        replace: "<strong>3. チャモロビレッジのナイトマーケット（※水曜のみ）</strong>",
      },
      {
        why: "Old rate card: 3h is $170, and capacity is tiered rather than a flat 'up to 4'.",
        find: "<p><strong>料金：</strong><strong>$130／車両1台（最大4名まで）</strong></p>",
        replace: `<p><strong>料金：</strong><strong>$170／車両1台</strong>${PRICE_SUFFIX}</p>`,
      },
    ],
  },

  // -------------------------------------------------------------------------
  shortplan: {
    body: [
      {
        why: "Offers an airport-transfer combination we no longer run.",
        find: "<p>「空港送迎＋ショートプラン」や「チェックアウト後の観光→空港直行」といった<strong>カスタム依頼もOK</strong>です。</p>\n\n\n\n",
        replace: "",
      },
      {
        why: "Old rate card. Per-person figure recomputed: $170 / 4 guests = $42.5.",
        find: "<tr><td>Short（約3h）</td><td><strong>$130／台</strong></td><td><strong>$32.5</strong></td></tr>",
        replace: "<tr><td>Short（約3h）</td><td><strong>$170／台</strong></td><td><strong>$42.5</strong></td></tr>",
      },
      {
        why: "The price table states one flat rate; add the tier/season caveat next to it.",
        find: "<li>ガソリン・駐車場・ガイド料すべて込み　（飲食・入場料・個人の買い物等は含まれていません）</li>",
        replace:
          '<li>ガソリン・駐車場・ガイド料すべて込み　（飲食・入場料・個人の買い物等は含まれていません）</li>\n\n\n\n<li>上記は1〜4名の料金です。5〜7名は+$20、繁忙期は別料金です（<a href="/plans">料金ページ</a>）</li>',
      },
      {
        why: "$50/hour extension is off the old rate card. /plans states extensions as 要相談 with no published price.",
        find: "<li>延長は60分 $50 で柔軟に調整可能</li>",
        replace: "<li>ガイド指定時間を超える延長は要相談</li>",
      },
      {
        why: "FAQ answer promises airport pickup, which is discontinued.",
        find: '<p><strong>Q. 空港からピックアップでそのままShortプラン可能？</strong></p>\n\n\n\n<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">\n<p>可能です。スーツケースは車内保管、ホテルチェックインもガイドがサポートします。</p>\n</blockquote>\n\n\n\n',
        replace: "",
      },
      {
        why: "The site standardised on replying within 48 hours (PayPal holds the authorisation ~3 days); 24h is a promise we no longer make.",
        find: "<li>24時間以内に空き状況と見積りを返信</li>",
        replace: "<li>48時間以内に空き状況と見積りを返信</li>",
      },
    ],
  },

  // -------------------------------------------------------------------------
  middleplanpost: {
    body: [
      {
        why: "Old rate card: 5h is $250.",
        find: "<strong>Middleプラン（5時間／$230）</strong>",
        replace: "<strong>Middleプラン（5時間／$250）</strong>",
      },
      {
        why: "Old rate card, and '最大7名まで' at one price contradicts the current 1–4 / 5–7 tiers.",
        find: "<li>料金：$230（車1台＋日本語ガイド1名／最大7名まで）</li>",
        replace: `<li>料金：$250（車1台＋日本語ガイド1名）${PRICE_SUFFIX}</li>`,
      },
      {
        why: "Start times no longer match START_TIMES in pricing.ts (the booking form will not offer these).",
        find: "<li>開始時間：午前 9:00〜14:00、午後 16:00〜21:00　（上記以外の時間をご希望の場合は事前にご相談ください）</li>",
        replace: `<li>開始時間：${START_MIDDLE}　（上記以外の時間をご希望の場合は事前にご相談ください）</li>`,
      },
      {
        why: "Per-person figure was computed off the old rate: 5 guests now pay $250+$20 = $270, i.e. $54 each.",
        find: "<strong>1人あたり$46程度</strong>",
        replace: "<strong>1人あたり$54程度</strong>",
      },
      {
        why: "Unfilled placeholder from the original draft — it shipped as literal '[MiddlePlanページリンク]' text.",
        find: "iddleプランの詳細・ご予約はこちら → [MiddlePlanページリンク]",
        replace: "iddleプランの詳細・ご予約はこちら",
      },
      {
        why: "Same unfilled placeholder.",
        find: "Longプランの詳細はこちら → [LongPlanページリンク]",
        replace: "Longプランの詳細はこちら",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // The heaviest edit in this file. The article's subject — a multi-day
  // "Total" plan with airport transfers — is a product that no longer exists.
  // Owner approved reframing it onto the ワンデープラン (12h, $500), which is
  // the closest live product; consecutive days are simply several ワンデー
  // bookings, which is true today and needs no new product.
  totalplanpost: {
    title: [
      {
        why: "The multi-day Total plan was retired; ワンデープラン (12h) is the live equivalent.",
        find: "MokaruのTotalプラン（12時間×2日～）",
        replace: "Mokaruのワンデープラン（12時間）",
      },
    ],
    body: [
      {
        why: "Retired product and old rate card.",
        find: "<strong>Totalプラン（12時間×2日～／$450／日）</strong>",
        replace: "<strong>ワンデープラン（12時間／$500）</strong>",
      },
      {
        why:
          "Two problems once this became the one-day plan: it distinguished itself from " +
          "'the 1-day plan' (it now IS that plan), and '到着から出発まで' describes an " +
          "arrival-to-departure job that started with an airport pickup we no longer do.",
        find: "短時間プランや1日観光プランとは異なり、到着から出発までの旅程をまるごとサポートできるため、",
        replace: "短時間プランとは異なり、朝から夜まで1日の旅程をまるごとサポートできるため、",
      },
      {
        why: "Retired product name in the section heading.",
        find: '<h2 class="wp-block-heading">Totalプランの基本概要</h2>',
        replace: '<h2 class="wp-block-heading">ワンデープランの基本概要</h2>',
      },
      {
        why: "'2日間以上から' was a condition of the retired plan. The live plan is a single day; consecutive days are separate bookings.",
        find: "<li>所要時間：1日12時間（2日間以上から）</li>",
        replace: "<li>所要時間：12時間（連日でのご利用も承ります。その場合は日数分のご予約となります）</li>",
      },
      {
        why: "Old rate card and flat '最大7名' pricing.",
        find: "<li>料金：$450／日（車1台＋日本語ガイド1名／最大7名まで）</li>",
        replace: `<li>料金：$500／日（車1台＋日本語ガイド1名）${PRICE_SUFFIX}</li>`,
      },
      {
        why: "Lists airport transfers as an included service; discontinued.",
        find: "<li>サービス内容：観光、食事、ショッピング、空港送迎、イベント同行、通訳サポートなどフル対応</li>",
        replace: "<li>サービス内容：観光、食事、ショッピング、イベント同行、通訳サポートなどフル対応</li>",
      },
      {
        why: "Promises airport-to-wedding coverage; discontinued.",
        find: "<strong>空港送迎～挙式～観光まで丸ごと任せられる安心感</strong>",
        replace: "<strong>挙式から観光まで丸ごと任せられる安心感</strong>",
      },
      {
        why:
          "The centrepiece was a 3-day itinerary (Day1 arrival → Day2 sightseeing → Day3 south), " +
          "which only made sense for the retired multi-day plan: as written it quietly asks for " +
          "3 × $500. Day 1 also opened with an airport pickup we no longer do. Owner's call " +
          "(2026-07-19): keep Day 2's content as the single-day model course and drop Day 1 and " +
          "Day 3. Day 2's four lines are unchanged — only the day scaffolding around them goes.",
        find:
          '<h2 class="wp-block-heading">モデルスケジュール例</h2>\n\n\n\n' +
          '<h3 class="wp-block-heading">Day1（到着日）</h3>\n\n\n\n' +
          '<ul class="wp-block-list">\n<li>空港お迎え → ホテルチェックイン → 軽めの観光 → ローカルレストランで夕食</li>\n</ul>\n\n\n\n' +
          '<h3 class="wp-block-heading">Day2（観光＋ショッピング）</h3>\n\n\n\n' +
          '<ul class="wp-block-list">\n<li>午前：恋人岬・アプガン砦・ハガニア散策</li>\n\n\n\n' +
          "<li>昼：ローカルレストランでランチ</li>\n\n\n\n" +
          "<li>午後：ショッピング（Kマート・GPO・マイクロネシアモール）</li>\n\n\n\n" +
          "<li>夕方：サンセット鑑賞 → ディナー</li>\n</ul>\n\n\n\n" +
          '<h3 class="wp-block-heading">Day3（南部観光）</h3>\n\n\n\n' +
          '<ul class="wp-block-list">\n<li>アガット戦争記念公園・ソレダッド砦・ベアズロック・天然プールなど南部半周</li>\n\n\n\n' +
          "<li>午後：ビーチでシュノーケリング</li>\n\n\n\n" +
          "<li>夜：自由解散 or レストラン同行</li>\n</ul>\n\n\n\n" +
          "<p>このように、日ごとにテーマを変えてアレンジできるのがTotalプラン最大の魅力です。</p>",
        replace:
          '<h2 class="wp-block-heading">モデルコース例（12時間）</h2>\n\n\n\n' +
          '<h3 class="wp-block-heading">観光＋ショッピング＋サンセット</h3>\n\n\n\n' +
          '<ul class="wp-block-list">\n<li>午前：恋人岬・アプガン砦・ハガニア散策</li>\n\n\n\n' +
          "<li>昼：ローカルレストランでランチ</li>\n\n\n\n" +
          "<li>午後：ショッピング（Kマート・GPO・マイクロネシアモール）</li>\n\n\n\n" +
          "<li>夕方：サンセット鑑賞 → ディナー</li>\n</ul>\n\n\n\n" +
          "<p>行き先も順番も自由に組み替えられます。連日でご利用いただく場合は、日ごとにテーマを変えてアレンジすることも可能です。</p>",
      },
      {
        why: "Airport transfers listed as a support item; discontinued.",
        find: "<li>空港送迎（到着・出発）</li>\n\n\n\n<li>ホテル移動・チェックインサポート</li>",
        replace: "<li>ホテル移動・チェックインサポート</li>",
      },
      {
        why: "Retired product name.",
        find: "<p><strong>「困った時にすぐ相談できる専属ガイドがいる」</strong> という安心感が、Totalプランの最大の価値です。</p>",
        replace: "<p><strong>「困った時にすぐ相談できる専属ガイドがいる」</strong> という安心感が、ワンデープランの最大の価値です。</p>",
      },
      {
        why: "Plan comparison heading refers to the retired lineup.",
        find: '<h2 class="wp-block-heading">Short・Middle・Longとの違い</h2>',
        replace: '<h2 class="wp-block-heading">3時間・5時間・8時間プランとの違い</h2>',
      },
      {
        why: "Retired product in the comparison list.",
        find: "<li><strong>Total（12時間×2日～）</strong>：滞在をまるごと専属サポート、イベントや特別シーンにも対応</li>",
        replace: "<li><strong>ワンデー（12時間）</strong>：朝から夜まで、滞在をまるごと専属サポート。連日のご利用も可能</li>",
      },
      {
        why: "Retired product name.",
        find: "<p>「旅行中ずっとサポートが欲しい」「観光だけでなく滞在そのものをプロに任せたい」方にTotalプランは最適です。</p>",
        replace: "<p>「旅行中ずっとサポートが欲しい」「観光だけでなく滞在そのものをプロに任せたい」方にワンデープランは最適です。</p>",
      },
      {
        why: "Terms block restates the old rate and the retired 2-day minimum.",
        find: "<li>$450／日（12時間）</li>\n\n\n\n<li>2日間以上からのご利用</li>\n\n\n\n<li>車両1台＋日本語ガイド1名の料金（最大7名）</li>",
        replace: `<li>$500／日（12時間）${PRICE_SUFFIX}</li>\n\n\n\n<li>連日でのご利用も承ります（日数分のご予約となります）</li>\n\n\n\n<li>車両1台＋日本語ガイド1名の料金</li>`,
      },
      {
        why: "Retired product name in the summary.",
        find: "<p>MokaruのTotalプラン（12時間×2日～）は、<strong>滞在をまるごと専属ガイドがサポートする究極のプライベートプラン</strong> です。",
        replace: "<p>Mokaruのワンデープラン（12時間）は、<strong>滞在をまるごと専属ガイドがサポートする究極のプライベートプラン</strong> です。",
      },
      {
        why: "'到着から出発まで' promises the arrival-to-departure coverage that started with an airport pickup.",
        find: "<p>「到着から出発まで全部任せたい」「観光も食事もショッピングも、そして安心も手に入れたい」という方にぴったりです。</p>",
        replace: "<p>「朝から夜まで全部任せたい」「観光も食事もショッピングも、そして安心も手に入れたい」という方にぴったりです。</p>",
      },
      {
        why: "Retired product name plus an unfilled placeholder link.",
        find: "Totalプランの詳細・ご予約はこちら → [TotalPlanページリンク]",
        replace: "ワンデープランの詳細・ご予約はこちら",
      },
      {
        why: "Lists booking restaurants for the guest among the family services. Child seats and on-site support are real and stay.",
        find: "ホテル移動、ベビーカーやチャイルドシートの準備、レストラン予約、観光地でのサポートなど、きめ細やかに対応します。",
        replace: "ホテル移動、ベビーカーやチャイルドシートの準備、観光地でのサポートなど、きめ細やかに対応します。",
      },
      {
        why: "Support list pairs the booking agent with interpreting. Interpreting is offered (owner, 2026-07-19); the booking agent is not.",
        find: "<li>レストラン予約・通訳サポート</li>",
        replace: "<li>通訳サポート</li>",
      },
    ],
  },

  // -------------------------------------------------------------------------
  "select-tour": {
    body: [
      {
        why: "Lists the retired multi-day Total plan as part of the lineup.",
        find: "<strong>コンパクトに楽しむShortPlan（3時間）から、半日ツアーのMiddleプラン（５時間）、1日しっかりのLongPlan（8時間）、滞在まるごとサポートするTotalPlan（12時間×2日～）まで</strong>",
        replace: "<strong>コンパクトに楽しむShortPlan（3時間）から、半日ツアーのMiddleプラン（５時間）、1日しっかりのLongPlan（8時間）、朝から夜まで満喫できるワンデープラン（12時間）まで</strong>",
      },
      {
        why: "Old rate card: 3h is $170.",
        find: "<strong>ShortPlan（3時間／$130）</strong>",
        replace: `<strong>ShortPlan（3時間／$170）</strong>${PRICE_SUFFIX}`,
      },
      {
        why: "Start times no longer match START_TIMES in pricing.ts.",
        find: "<li>午前：9:00（前後30分調整可）</li>\n\n\n\n<li>午後：13:00（前後30分調整可）</li>\n\n\n\n<li>夕方：18:00（前後30分調整可）</li>",
        replace: `<li>${START_SHORT}</li>`,
      },
      {
        why: "Old rate card: 5h is $250.",
        find: "<strong>MiddlePlan（5時間／$230）</strong>",
        replace: `<strong>MiddlePlan（5時間／$250）</strong>${PRICE_SUFFIX}`,
      },
      {
        why: "Unfilled placeholder from the original draft.",
        find: " MiddlePlanの詳細はこちらから → [MiddlePlanページ]",
        replace: " MiddlePlanの詳細はこちらから",
      },
    ],
  },

  // -------------------------------------------------------------------------
  "1dayplan": {
    body: [
      {
        why: "The live ワンデープラン is 12 hours (durationHours: 12 in pricing.ts). 12–14h was the old plan's range.",
        find: '<h2 class="wp-block-heading">1. 12〜14時間あれば島をぐるっと 1 周できる</h2>',
        replace: '<h2 class="wp-block-heading">1. 12時間あれば島をぐるっと 1 周できる</h2>',
      },
      {
        why: "24-hour support is a promise the business does not make — it is why the 24hour-support article stays offline. Restoring it here reintroduces exactly that claim.",
        find: "<li><strong>LINE 24h サポート付</strong><br>ツアー前後の質問も即レス。万が一のトラブル時は電話一本で駆けつけます。</li>\n\n\n\n",
        replace: "",
      },
      {
        why: "Airport transfers discontinued (owner, 2026-07-19).",
        find: "<li><strong>空港送迎付</strong><br>到着した時も日本帰国時も安心かつ余裕をもって移動ができます。</li>\n",
        replace: "",
      },
      {
        why: "Old duration range and the $50 extension rate; per-person $125 still holds ($500 / 4).",
        find: "<tr><td><strong>1 Day</strong></td><td>12–14h</td><td><strong>$500</strong></td><td>1人 $125</td><td>60min $５0</td></tr>",
        replace: "<tr><td><strong>1 Day</strong></td><td>12h</td><td><strong>$500</strong></td><td>1人 $125</td><td>要相談</td></tr>",
      },
      {
        why: "The rate table states one flat price; add the tier/season caveat. Child seats and the cooler stay — the owner confirmed those are still provided.",
        find: "<p>チャイルドシート・ベビーカー無料<br>クーラーボックス＋氷を完備（要冷蔵チョコも安心）</p>",
        replace: `<p>チャイルドシート・ベビーカー無料<br>クーラーボックス＋氷を完備（要冷蔵チョコも安心）<br>上記は1〜4名の料金です。5〜7名は+$20、繁忙期は別料金です（<a href="/plans">料金ページ</a>）</p>`,
      },
      {
        why: "Repeat-customer discounts do not exist (owner decision 2026-07-17: no discounts). This is the same claim that keeps repeater-discount offline.",
        find: "<p>リピーター割引あり。Short / Long との連日組み合わせもお得です。＊予約状況によりご希望に添えない場合もあります＊</p>",
        replace: "<p>連日でのご利用も承ります。Short / Long との組み合わせもご相談ください。＊予約状況によりご希望に添えない場合もあります＊</p>",
      },
      {
        why: "Q&A premised on 14 hours; the plan is 12.",
        find: "<p><strong>Q. 14 時間フルで使わないと損？</strong></p>",
        replace: "<p><strong>Q. 12 時間フルで使わないと損？</strong></p>",
      },
      {
        why: "Answer restates the retired 12-hour-vs-14-hour framing.",
        find: "<p>いいえ。12 時間で切り上げても料金は同じ。時間に縛られずゆったりどうぞ。せっかくのお休みに時間を気にしてはもったいない</p>",
        replace: "<p>いいえ。早めに切り上げても料金は同じ。時間に縛られずゆったりどうぞ。せっかくのお休みに時間を気にしてはもったいない</p>",
      },
      {
        why: "The site standardised on replying within 48 hours.",
        find: "<li>24h 以内に空き状況と見積りをご返信</li>",
        replace: "<li>48時間以内に空き状況と見積りをご返信</li>",
      },
      {
        why: "Sells the free booking agent plus surprise staging (cake, sunset boat, beach photos) as reasons to pick this plan. Neither is offered (owner, 2026-07-19), and the whole bullet is those two claims.",
        find: "\n\n\n\n<li><strong>レストラン予約・サプライズ演出</strong> もOK<br>誕生日ケーキ、サンセットボート、ビーチフォト手配など柔軟対応。</li>",
        replace: "",
      },
      {
        why: "Answer to 'can I have dinner at a steakhouse?' offers the booking agent. What we do run — driving there and helping at the table — stays.",
        find: "<p>予約代行＋送迎込みOK。コース選びもご相談ください。</p>",
        replace: "<p>送迎込みでご案内します。当日はガイドが注文をサポートしますので、コース選びもご相談ください。</p>",
      },
    ],
  },

  // -------------------------------------------------------------------------
  "1day-plan": {
    body: [
      {
        why: "The live ワンデープラン is 12 hours; '最大７名' at one price contradicts the current tiers.",
        find: "<li>所要時間：約12〜14時間</li>",
        replace: "<li>所要時間：12時間</li>",
      },
      {
        why: "Flat '最大７名' pricing predates the 1–4 / 5–7 tiers and the peak season.",
        find: "<li>料金：<strong>$500</strong><strong>／車両</strong><strong>1</strong><strong>台（最大</strong><strong>７</strong><strong>名まで</strong><strong>）</strong></li>",
        replace: `<li>料金：<strong>$500／車両1台</strong>${PRICE_SUFFIX}</li>`,
      },
    ],
  },

  // -------------------------------------------------------------------------
  longplanpost: {
    body: [
      {
        why: "Old rate card: 8h is $345.",
        find: "<strong>Longプラン（8時間／$300）</strong>",
        replace: "<strong>Longプラン（8時間／$345）</strong>",
      },
      {
        why: "Old rate card and flat '最大7名' pricing.",
        find: "<li>料金：$300（車1台＋日本語ガイド1名／最大7名まで）</li>",
        replace: `<li>料金：$345（車1台＋日本語ガイド1名）${PRICE_SUFFIX}</li>`,
      },
      {
        why: "Start times no longer match START_TIMES in pricing.ts — the 8h plan now starts in the morning only.",
        find: '<li>7:00〜15:00（早朝発）</li>\n\n\n\n<li>10:00〜18:00（昼前発）</li>\n\n\n\n<li>12:00〜20:00（昼発・サンセット＆ディナー付き）</li>',
        replace: `<li>${START_LONG}</li>`,
      },
      {
        why: "Per-person figure computed off the old rate: 6 guests now pay $345+$20 = $365, i.e. about $61 each.",
        find: "例えば6名で利用すれば、1人あたり <strong>$50</strong> で8時間の貸切観光＋日本語ガイド付き。",
        replace: "例えば6名で利用すれば、1人あたり <strong>約$61</strong> で8時間の貸切観光＋日本語ガイド付き。",
      },
      {
        why: "Recommends the retired multi-day Total plan, including its airport transfers.",
        find: "<p>「1日では足りない」「滞在中ずっと専属ガイドをお願いしたい」という方には、<strong>Totalプラン（12時間×2日～）</strong> がおすすめです。<br>観光・ショッピング・食事・空港送迎まで、滞在を丸ごと専属でサポートする特別なプランです。家族旅行や芸能人・インフルエンサーの方、結婚式や撮影同行などにも最適。</p>",
        replace: "<p>「1日では足りない」「滞在中ずっと専属ガイドをお願いしたい」という方には、<strong>ワンデープラン（12時間）</strong> がおすすめです。<br>観光・ショッピング・食事まで、朝から夜まで専属でサポートする特別なプランです。家族旅行や芸能人・インフルエンサーの方、結婚式や撮影同行などにも最適。連日でのご利用も承ります。</p>",
      },
      {
        why: "Unfilled placeholder from the original draft.",
        find: " Longプランの詳細・ご予約はこちら → [LongPlanページリンク]",
        replace: " Longプランの詳細・ご予約はこちら",
      },
      {
        why: "Retired product name plus an unfilled placeholder.",
        find: "Totalプランの詳細はこちら → [TotalPlanページリンク]",
        replace: "ワンデープランの詳細はこちら",
      },
    ],
  },

  // -------------------------------------------------------------------------
  "long-plan": {
    body: [
      {
        why: "The live 8時間プラン is 8 hours, not a 7–8 range.",
        find: "**MokaruのLongプラン（約7〜8時間）**",
        replace: "**MokaruのLongプラン（8時間）**",
      },
      {
        why: "The live 8時間プラン is 8 hours, not a 7–8 range.",
        find: "<li>所要時間：約7〜8時間</li>",
        replace: "<li>所要時間：8時間</li>",
      },
      {
        why: "Old rate card and flat '最大７名' pricing.",
        find: "<li>料金：<strong>$300</strong><strong>／車両</strong><strong>1</strong><strong>台（最大</strong><strong>７</strong><strong>名まで</strong><strong>）</strong></li>",
        replace: `<li>料金：<strong>$345／車両1台</strong>${PRICE_SUFFIX}</li>`,
      },
    ],
  },

  // -------------------------------------------------------------------------
  "long-tour": {
    body: [
      {
        why: "Start times no longer match START_TIMES in pricing.ts. The three alternative departures below are removed with their sections.",
        find: '<h3 class="wp-block-heading">7:00–15:00（早朝出発）</h3>',
        replace: '<h3 class="wp-block-heading">午前出発（8:30／9:00／9:30）</h3>',
      },
      {
        why: "The 8h plan no longer has a late-morning departure option.",
        find: '<h3 class="wp-block-heading">10:00–18:00（ゆったり昼前スタート）</h3>',
        replace: '<h3 class="wp-block-heading">ゆったり回るコース</h3>',
      },
      {
        why: "The 8h plan no longer has a midday departure option.",
        find: '<h3 class="wp-block-heading">12:00–20:00（昼出発・サンセット＆ディナー付き）</h3>',
        replace: '<h3 class="wp-block-heading">サンセット＆ディナーを組み込むコース</h3>',
      },
      {
        why: "Heading offered a choice of start times that no longer exists.",
        find: '<h2 class="wp-block-heading">開始時間を選べます（所要8時間）</h2>',
        replace: `<h2 class="wp-block-heading">組み立て方はいろいろ（所要8時間・出発は${START_LONG}）</h2>`,
      },
      {
        why: "Per-person figure off the old rate, and the plan is 8 hours: $345 / 4 guests ≈ $86.",
        find: "4人なら1人 $75で7時間自由行動。タクシーを何度も使うより断然安い。",
        replace: `4人なら1人 約$86で8時間自由行動。タクシーを何度も使うより断然安い。${PRICE_SUFFIX}`,
      },
      {
        why: "Points at a different LINE account (lin.ee/TIVeYdb) than the one the business uses today (LINE_URL in config.ts).",
        find: "https://lin.ee/TIVeYdb",
        replace: "https://lin.ee/OfniH2h",
      },
      {
        why: "The site standardised on replying within 48 hours.",
        find: "<li>24h以内に空き状況と見積り回答</li>",
        replace: "<li>48時間以内に空き状況と見積り回答</li>",
      },
    ],
  },

  // -------------------------------------------------------------------------
  "about-mokaru": {
    body: [
      {
        why: "The live 3時間プラン is 3 hours, not a 3–4 range.",
        find: "<strong>① Shortプラン（３〜４時間）｜グアムの定番観光を満喫！</strong>",
        replace: "<strong>① Shortプラン（3時間）｜グアムの定番観光を満喫！</strong>",
      },
      {
        why: "Old rate card (full-width digits in the source): 3h starts at $170.",
        find: "<p>📌 <strong>料金目安：$１３０～（人数やプランによって変動）</strong></p>",
        replace: `<p>📌 <strong>料金目安：$170〜</strong>${PRICE_SUFFIX}</p>`,
      },
      {
        why: "The live 8時間プラン is 8 hours, not a 7–8 range.",
        find: "<strong>② Longプラン（７〜８時間）｜グアムをしっかり観光＆ショッピング！</strong>",
        replace: "<strong>② Longプラン（8時間）｜グアムをしっかり観光＆ショッピング！</strong>",
      },
      {
        why: "Old rate card: 8h starts at $345.",
        find: "<p>📌 <strong>料金目安：$300～（人数やプランによって変動）</strong></p>",
        replace: `<p>📌 <strong>料金目安：$345〜</strong>${PRICE_SUFFIX}</p>`,
      },
      {
        why: "An entire plan built on airport transfers, which are discontinued (owner, 2026-07-19).",
        find: '<h3 class="wp-block-heading"><strong>③ エーアポートシャトルプラン</strong>　⁻　ホテル⇔空港を快適に移動</h3>\n\n\n\n<p>💡 <strong>こんな方におすすめ！</strong><br>☑ タクシー・レンタカーを利用するのが不安<br>☑ ホテルのチェックイン・チェックアウトのお手伝いが必要</p>\n\n\n\n<p>📌 <strong>料金目安：$２５～（片道送迎）</strong></p>\n\n\n\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n\n\n\n',
        replace: "",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ALREADY LIVE since the 2026-07-17 restore. bus-rentacar and guam-traffic
  // both slipped through the stale-pricing exclusion: they quote our own tours
  // off the old rate card and sell a 6-hour plan that has never existed in
  // pricing.ts, plus airport transfers. Found 2026-07-19 while reviving the
  // other twelve — the exclusion list was built from the plan articles and
  // never swept the practical guides, which quote prices in passing.
  "guam-traffic": {
    body: [
      {
        why: "Quotes the retired airport transfer and the old $130 rate (full-width digits) for our own tours.",
        find: "<p>📌 <strong>Mokaruの送迎プラン（1台あたりの料金）</strong><br>🚗 <strong>空港送迎（片道）：$25～ （セダンタイプは４名まで。ヴァンタイプは６名まで）</strong><br>🚗 <strong>観光エリア送迎（ホテル⇔ショッピング）：３時間$１３０～</strong><br>🚗 <strong>カスタムプラン（貸切ツアー）：6時間$300～</strong></p>",
        replace: `<p>📌 <strong>Mokaruの貸切プラン（1台あたりの料金）</strong><br>🚗 <strong>3時間プラン：$170〜（セダンは4名まで、ヴァンは7名まで）</strong><br>🚗 <strong>5時間プラン：$250〜</strong><br>🚗 <strong>8時間プラン：$345〜</strong>${PRICE_SUFFIX}</p>`,
      },
      {
        why: "Comparison table sells the retired airport transfer at the old $25 rate.",
        find: "<td><strong>Mokaru送迎</strong> 🚙</td><td>安全＆快適に移動したい人向け</td><td>$25～（空港送迎）</td><td>日本語対応＆専用車で安心</td><td>事前予約が必要</td>",
        replace: "<td><strong>Mokaru貸切チャーター</strong> 🚙</td><td>安全＆快適に観光したい人向け</td><td>$170～（3時間・1台）</td><td>日本語ガイド＆専用車で安心</td><td>事前予約が必要</td>",
      },
    ],
  },

  "bus-rentacar": {
    body: [
      {
        why: "Quotes the retired airport transfer, the old $130 rate, and a 6-hour plan that is not in PLANS. Replaced with the live lineup.",
        find: "<p>📌 <strong>Mokaruの送迎プラン（1台あたりの料金）</strong><br>🚗 <strong>空港送迎（片道）：$25～  $45</strong><br>🚗 <strong>ホテル⇔観光地のショートプラン：$130～</strong><br>🚗 <strong>貸切ツアー（6時間）：$300～</strong></p>",
        replace: `<p>📌 <strong>Mokaruの貸切プラン（1台あたりの料金）</strong><br>🚗 <strong>3時間プラン：$170〜</strong><br>🚗 <strong>5時間プラン：$250〜</strong><br>🚗 <strong>8時間プラン：$345〜</strong>${PRICE_SUFFIX}</p>`,
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

  touts: {
    body: [
      {
        why: "Closing pitch offers the discontinued airport transfer. The rest of the sentence (LINE, guiding) is still true.",
        find: "<p>モカルの日本語ガイドサービスなら、怪しいキャッチに遭遇しても即LINEで相談可能。空港送迎から観光サポートまで、日本語で安心対応！</p>",
        replace: "<p>モカルの日本語ガイドサービスなら、怪しいキャッチに遭遇しても即LINEで相談可能。観光中のサポートまで、日本語で安心対応！</p>",
      },
    ],
  },

  drivers: {
    body: [
      {
        why: "'空港〜観光地まで' promises the discontinued airport pickup. Replaced with what we actually do — a guide driving a dedicated vehicle.",
        find: "<li>日本語ガイドが空港〜観光地まで安全運転でご案内</li>",
        replace: "<li>日本語ガイドが専用車で観光地まで安全運転でご案内</li>",
      },
    ],
  },

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
    ],
  },

  "hotel-complaint": {
    body: [
      {
        why: "'24時間LINEサポート' promises round-the-clock cover. LINE itself is real, so only the 24-hour claim goes.",
        find: "<li>モカルの24時間LINEサポートなら、<strong>クレームの伝え方をサポート</strong>します！（プランによる）</li>",
        replace: "<li>モカルのLINEサポートなら、<strong>クレームの伝え方をサポート</strong>します！（プランによる）</li>",
      },
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
    const found = out.split(c.find).length - 1;
    if (found !== expected) {
      throw new Error(
        `legacy-corrections: [${slug}] ${which} correction matched ${found}x, expected ${expected}x.\n` +
          `  find: ${JSON.stringify(c.find.slice(0, 120))}\n` +
          `  why:  ${c.why}\n` +
          `The snapshot text changed. Re-check the article and update the find, ` +
          `or drop the correction if the sentence is gone.`,
      );
    }
    out = out.split(c.find).join(c.replace);
  }
  return out;
}
