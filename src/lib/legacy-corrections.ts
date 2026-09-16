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

// ---------------------------------------------------------------------------
// "Book by LINE" step lists (2026-09-12)
// ---------------------------------------------------------------------------
// Four articles end a section with the booking procedure for the charter: send
// "ツアー希望" on LINE, get availability and a quote back within 24 hours, pay a
// deposit, meet in the hotel lobby. Every step of that is wrong from
// 2026-10-01 — LINE is not a customer channel, there is no deposit, nobody is
// meeting anyone in a lobby, and what we now promise is a STATUS within 48
// hours rather than an answer within 24.
//
// The sections are removed. They are procedures, not prose: there is nothing
// to salvage once the procedure changes, and the current one is stated on
// /reserve and under every article by legacy-cta.ts.
const BOOKING_STEPS: Correction = {
  findRe:
    /\s*<h3 class="wp-block-heading">[^<]*予約[^<]*<\/h3>\s*<ol class="wp-block-list">[\s\S]*?LINE[\s\S]*?<\/ol>/g,
  replace: "",
  why:
    "チャーターの予約手順（LINEで送信→24時間以内に見積り→デポジット→ロビー集合）。" +
    "10/1から全項目が誤り。現在の流れは /reserve と legacy-cta.ts が示す。",
};

export const CORRECTIONS: Record<string, ArticleCorrections> = {
  // ---------------------------------------------------------------------
  // 「グアム 貸切ガイド」「貸切ツアー」というSEOキーワード（2026-09-17）
  // ---------------------------------------------------------------------
  // 09-12の一巡では、自社の車・ガイド・LINEを「約束している文」を消した。
  // 残っていたのは、記事の前提として埋め込まれた語句のほう——タイトル、導入、
  // まとめ。読むと「当社が貸切ガイドを提供している」としか取れない。
  //
  // 🔴 見出しとタイトルに入っているものは言い換えが要る。順位のために残す
  // 誘惑があるが、順位を守るために提供しないサービスを名乗ることになる。
  //
  // 🔵 記事の主題（潮汐・雨季・水分補給）は10/1以降も正しい。だから書き直し
  // ではなく修正で足りる。night-market-2 と post-wedding-tour は逆で、主題が
  // 商品そのものだったので legacy-rewrites.ts へ移した。
  "rainy-day": {
    title: [
      {
        why: "『グアム貸切ガイド』＝終了する自社商品名。雨季のインドア案内という中身は10/1以降も正しい。",
        find: "7〜8月スコール対策『グアム貸切ガイド』インドア満喫プラン",
        replace: "7〜8月のスコール対策とインドア満喫プラン",
      },
    ],
    body: [
      {
        why: "導入の後半が、貸切ガイド付きプライベートツアーとエアコン完備のバンの勧誘。バス待ちの実態を書いた前半は正しいので残す。",
        find: "<br>そこでおすすめなのが、ドアツードア移動ができる<strong>グアム 貸切ガイド</strong>付き<strong>グアム プライベートツアー（グアム 3時間 ツアー〜）</strong>。専属<strong>グアム プライベート ガイド</strong>とエアコン完備のバンで、雨でも快適に島内を回れます。",
        replace:
          "<br>この時期は、屋内で過ごせる場所と、雨でも足が確保できる行き先を先に決めておくと安心です。",
      },
      {
        // The other three rows of this table describe the bus service honestly
        // and stay. This cell answers "how do I get there?" with "you can't,
        // unless you use us".
        why: "表の1セルが「グアム チャーター専用ルート」＝自社の車でしか行けない、という案内になっている。",
        find: "<td>そもそも公共交通なし。<strong>グアム チャーター</strong>専用ルート</td>",
        replace: "<td>そもそも公共交通なし。レンタカーかタクシーの手配が要る</td>",
      },
      {
        why: "表の直後の引用が「貸切ツアーならドア前ピックアップ」の勧誘。",
        findRe:
          /\s*<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">\s*<p>どれも「行きたいけど足がない…」と諦めがちな場所。[\s\S]*?<\/blockquote>/g,
        replace: "",
      },
      {
        // All three bullets are about our car and our guide — the seats, the
        // guide handling nappy stops, the air conditioning. Nothing survives
        // the removal of the vehicle, so the section goes rather than being
        // whittled down to an empty heading.
        why: "「子連れ＆ベビーカーも安心」の節。3項目とも自社の車とガイド前提。",
        findRe:
          /\s*<hr class="wp-block-separator has-alpha-channel-opacity"\/>\s*<h3 class="wp-block-heading">👶 子連れ＆ベビーカーも安心<\/h3>\s*<ul class="wp-block-list">[\s\S]*?<\/ul>/g,
        replace: "",
      },
      {
        why: "「Mokaruなら可能」「ガイドがプランを提案」＝自社の運行前提。天気が変わりやすいという観察そのものは正しいので残す。",
        find:
          "<p>雨季だからと言ってずっと雨かと言うとそうでもありません。一瞬の晴れ間を狙ってきれいなビーチで写真を撮ったり、観光スポットで記念撮影もMokaruなら可能です。</p>\n\n\n\n<p>天気に恵まれていなくてもガイドがお客様が楽しんでもらえるようにプランを提案いたします。</p>",
        replace:
          "<p>雨季だからと言ってずっと雨かと言うとそうでもありません。一瞬の晴れ間を狙って、きれいなビーチや観光スポットで写真を撮ることもできます。</p>\n\n\n\n<p>屋内の行き先をいくつか控えておけば、天気に恵まれなくても一日は埋まります。</p>",
      },
      {
        why: "まとめが「Mokaru Guamの貸切サービス」の宣伝。",
        find: "<p>雨季のバス待ちは旅の大敵。でも<strong>グアム プライベートツアー</strong>なら、スコールの合間を縫ってインドアも絶景も欲張りに楽しめます。次の7〜8月はMokaru Guamの貸切サービスで、天気に左右されない思い出作りをしませんか？ お問い合わせはお気軽に！</p>",
        replace:
          "<p>雨季のバス待ちは旅の大敵。それでも、屋内の行き先をいくつか用意しておけば、スコールの合間を縫ってインドアも絶景も欲張りに楽しめます。次の7〜8月は、天気に左右されない組み立てを。</p>",
      },
      BOOKING_STEPS,
    ],
  },

  hydration: {
    title: [
      {
        why: "「3時間プライベートツアー術」＝終了する自社商品の売り文句。暑さ対策と栄養という中身は10/1以降もそのまま正しい。",
        find: "3時間プライベートツアー術",
        replace: "過ごし方",
      },
    ],
    body: [
      {
        why: "「Mokaru Guam 貸切ガイドができること」の節。車内の水・動線・ベビーカー・エスコートと、全項目が自社の車とガイド前提。",
        findRe:
          /\s*<h3 class="wp-block-heading">3️⃣ Mokaru Guam 貸切ガイドができること<\/h3>\s*<ul class="wp-block-list">[\s\S]*?<\/ul>/g,
        replace: "",
      },
      {
        // Without this the page renders 1️⃣ 2️⃣ 4️⃣ — a visible seam showing
        // something was cut. Removing a section means renumbering the rest.
        why: "直前の3️⃣を削除したので番号が飛ぶ。〈グアム 3時間 ツアー〉も自社商品名。",
        find: '<h3 class="wp-block-heading">4️⃣ インドア休憩スポットを織り交ぜた〈グアム 3時間 ツアー〉例</h3>',
        replace: '<h3 class="wp-block-heading">3️⃣ インドア休憩をはさむ半日の回り方（例）</h3>',
      },
      {
        why: "「6時間や1Dayへの延長もOK」＝貸切チャーターの時間オプション。リンク先の /long-tour も書き直し済み。",
        findRe:
          /\s*<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow">\s*<p>もちろん6時間や1Dayへの延長もOK。[\s\S]*?<\/blockquote>/g,
        replace: "",
      },
      {
        why: "ツアー中に人数分の水を用意する、という自社の運行前提。",
        find: "<p>Mokaruでは人数分のお水をご用意していますが、その日の気温とプランによってはさらにビタミンC入りのドリンクをお進めすることもあります。</p>\n\n\n\n",
        replace: "",
      },
      {
        why: "「Mokaruのガイドにも飲むように指導しています」＝自社にガイドがいる前提。助言そのものは正しいので残す。",
        find: "ココナッツウォーターや電解質の入ったドリンクを飲んでいれば間違いないのでMokaruのガイドにも飲むように指導しています。",
        replace: "ココナッツウォーターや電解質の入ったドリンクを選んでおけば、まず間違いありません。",
      },
      {
        why: "まとめが「貸切ガイド付きプライベートツアーなら解決」という宣伝。主題（水分と栄養）だけを残す。",
        find: "<p><strong>グアム 貸切ガイド</strong>付きの<strong>グアム プライベートツアー</strong>なら、暑さ・紫外線・栄養不足を一気に解決。安心して観光に集中できます。次の旅では「水分＆栄養チャージ」を合言葉に、安全・快適な島時間を楽しみましょう！</p>",
        replace:
          "<p>暑さ・紫外線・栄養不足は、どれも知っていれば防げるものばかりです。次の旅では「水分＆栄養チャージ」を合言葉に、安全・快適な島時間を楽しみましょう！</p>",
      },
      BOOKING_STEPS,
    ],
  },
  // 🔵 night-market-2 was corrected here on 2026-09-12 (the child-seat bullet,
  // the LINE booking steps) and MOVED to legacy-rewrites.ts on 2026-09-17.
  // Patching the two wrong sentences left the other twenty in place: the model
  // schedule is our itinerary from hotel pickup to hotel drop-off, and "why
  // people choose us" sells a private guide and a flat charter fare. The
  // sentences were not the problem; the frame was.

  // ---------------------------------------------------------------------
  // 自社の車・チャイルドシート・ベビーカーの提供（2026-09-12）
  // ---------------------------------------------------------------------
  // 「専用車」「チャイルドシート完備」「ベビーカー無料貸出」は、自社で車を
  // 出していた前提のサービス。10/1以降は車を持たないので、どれも果たせない。
  //
  // 🔵 グアムの法律（6歳未満はチャイルドシート義務）や、ホテルのフロントが
  // 24時間対応であること等、自社と無関係な記述には手を触れていない。
  safety: {
    body: [
      {
        find: "<p>📌 <strong>Mokaruのツアー参加者は、日本語LINEサポートも利用可能！</strong>",
        replace: "<p>📌 <strong>心配なことは、出発前に調べておきましょう。</strong>",
        why: "ツアー参加者向けのLINEサポートの案内。ツアーの提供が終わる。",
      },
      {
        why: "「運転に不安があるならMokaruの専用車送迎を」。送迎の提供をやめる。",
        find: "<p>📌 <strong>運転に不安がある方は、Mokaruの専用車送迎を利用するのがおすすめ！</strong></p>",
        replace:
          "<p>📌 <strong>運転に不安がある方は、送迎のついたツアーを選ぶか、移動手段を先に手配しておくのがおすすめです。</strong></p>",
      },
      {
        why: "同上。終了するツアーへのリンクつきの誘導。",
        find: '<p>📩 <strong>「安全にグアムを楽しみたい！」という方は、<a href="/private-tour-3h/"><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-vivid-cyan-blue-color">Mokaruの専用車送迎や日本語サポート付きツアー</mark></a>をぜひご利用ください😊✨</strong></p>',
        replace: "",
      },
      {
        // 🔵 The advice around it stays exactly as written. Booking the ride
        // home before you go out is the right thing to tell someone, and it is
        // right whoever drives. Only the parenthesis naming us comes out.
        why: "夜遊びの注意の一項が「帰りのタクシーは事前に手配（Mokaruの送迎サービスも利用可能）」。括弧の中だけが自社の送迎。",
        find: "✅ <strong>帰りのタクシーは事前に手配（Mokaruの送迎サービスも利用可能）</strong>",
        replace: "✅ <strong>帰りのタクシーは事前に手配（夜は流しのタクシーがほとんどいません）</strong>",
      },
    ],
  },

  // 🔵 special-requests moved to legacy-rewrites.ts on 2026-09-17. Five
  // sections, all of them「旅行会社が対応しない○○にも行ける」— and the reason
  // given, every time, was our own car and our own guide. The three
  // corrections that lived here deleted three of those sentences and left the
  // other six standing, plus a title that is itself a pitch.
  //
  // Kept rather than retired because the QUESTION it answers is unchanged:
  // someone finds something not in their package tour and wants to know
  // whether it can be arranged. We can still answer that — and the honest
  // answer now has to include what we cannot get them, which the original
  // never said.

  "two-lovers-point": {
    body: [
      {
        why: "「専用車で快適にご案内」＋終了するツアーへのリンク。行き方の説明そのものは残す。",
        find: '<p>恋人岬へは、<strong>レンタカーやツアーで訪れるのが一般的</strong>ですが、<a href="/private-tour-3h/"><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-vivid-cyan-blue-color">Mokaruのカスタマイズツアー</mark></a>なら、<strong>ご希望の時間に合わせて専用車で快適にご案内</strong>できます！</p>',
        replace:
          "<p>恋人岬へは、<strong>レンタカーやツアーで訪れるのが一般的</strong>です。路線バスは通っていないので、移動手段は先に決めておきましょう。</p>",
      },
    ],
  },

  "low-tide": {
    title: [
      {
        why: "「貸切プライベートツアー」＝終了する自社商品。潮汐の記事本体は10/1以降も正しい。",
        find: "グアムの潮汐と安全に楽しむ貸切プライベートツアー",
        replace: "グアムの潮汐を知って安全に海で遊ぶ",
      },
    ],
    body: [
      {
        why: "「ツアー対策」＝自社の貸切ツアーが対策である、と読める見出し。",
        find: '<h3 class="wp-block-heading">3️⃣ 雨季のマリンスポーツ影響とツアー対策</h3>',
        replace: '<h3 class="wp-block-heading">3️⃣ 雨季のマリンスポーツは潮位と風波で決まる</h3>',
      },
      {
        // The paragraph before this one — marine sports are called off the
        // night before, the meeting point moves, the bus cannot follow — is
        // true and useful, and stays. This is the sales pitch bolted to it.
        why: "貸切ガイド／チャーターの勧誘と、その「安全メリット」の表。表は3行とも自社ガイドの動きの話で、残せる行がない。",
        findRe:
          /\s*<p>そこで便利なのがMokaru Guamの <strong>▶︎ グアム 貸切ガイド／グアム チャーター<\/strong>[\s\S]*?<\/figure>/g,
        replace: "",
      },
      {
        // 🔴 This replaces the 2026-09-12 correction that deleted only the
        // child-seat bullet out of this list. The other three bullets were
        // equally ours — we guide you to calm spots, all OUR guides speak
        // Japanese, combine it with OUR wedding charter — and removing one
        // left a section that still promised a guided tour.
        why: "「子連れ・シニアも安心のサポート」の節。4項目とも自社のガイドと車の提供。ウェディングチャーターは商品そのもの。",
        findRe:
          /\s*<h3 class="wp-block-heading">4️⃣ 子連れ・シニアも安心のサポート<\/h3>\s*<ul class="wp-block-list">[\s\S]*?<\/ul>/g,
        replace: "",
      },
      {
        why: "締めが「ガイドと行けば安心」の勧誘。ビーチの選び分けという助言自体は残す。",
        find: "<p>それぞれのポイントがあるのでガイドと行けば安心して楽しむことができます。</p>",
        replace: "<p>行き先を決めてから出かけると、無駄な移動が減り、安全の面でも余裕が生まれます。</p>",
      },
      {
        why: "まとめが「貸切ツアーなら安全・快適」の宣伝。潮汐の知識という主題だけを残す。",
        find: "<p>遠浅の楽園グアムでも、<strong>潮汐の知識</strong>と<strong>柔軟な移動手段</strong>がなければリスクは避けられません。Mokaru Guamの<strong>グアム 貸切 ツアー／グアム プライベートツアー</strong>なら、潮位に合わせた安全・快適なプランで大人も子どももしっかり楽しめます。次のバケーションでは、プロのガイドと一緒に“潮を味方にする旅”を体験しませんか？</p>",
        replace:
          "<p>遠浅の楽園グアムでも、<strong>潮汐の知識</strong>がなければリスクは避けられません。その日の干満を調べてから海に入る——それだけで、大人も子どもも安心して楽しめます。次のバケーションでは“潮を味方にする旅”を。</p>",
      },
    ],
  },


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
        why: "「Mokaruの送迎サービスのメリット」の節。専用車・定額・日本語対応と、全項目が自社の車前提。",
        findRe:
          /\s*<h3 class="wp-block-heading"><strong>🚙 Mokaruの送迎サービスのメリット<\/strong><\/h3>\s*<p>✅ <strong>専用車なので他の人と乗り合いなし！快適移動<\/strong>[\s\S]*?<\/p>/g,
        replace: "",
      },
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
      {
        // 🔴 2026-09-17. The four corrections above emptied this section but
        // left its frame: an h2 reading「④ Mokaruの専用送迎｜タクシーよりお得＆
        // 安全！」, the paragraph under it recommending the 専用送迎サービス, and
        // a closing line calling our transfers the best option. A reader saw
        // the heading and the recommendation with nothing in between.
        why: "④節の見出し・導入・締めが残っていた。中身（メリット・料金・比較表の行）だけ消しても、見出しが「自社が送迎をやっている」と宣言している。",
        findRe:
          /\s*<hr class="wp-block-separator has-alpha-channel-opacity"\/>\s*<h2 class="wp-block-heading"><strong>🚙 ④ Mokaruの専用送迎｜タクシーよりお得＆安全！<\/strong><\/h2>[\s\S]*?「英語が不安」ならMokaruの送迎がベスト！<\/strong><\/p>/g,
        replace: "",
      },
    ],
  },

  "bus-rentacar": {
    body: [
      {
        why: "自社の車の宣伝（乗り合いなし・日本語ドライバー）。移動手段の提供をやめる。",
        find: "<p>✅ <strong>1台あたりの料金なので、グループ旅行ならお得！</strong><br>✅ <strong>専用車だから他の人と乗り合いなし＆快適！</strong><br>✅ <strong>ドライバーが日本語対応OKで安心！</strong></p>",
        replace: "",
      },
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

      // 🔴 2026-09-17. Same failure as guam-traffic directly above, in the same
      // article family: the priced blocks were removed in July and 09-12, and
      // the section they sat in was left standing. This page rendered an h2
      // 「④ Mokaruの送迎で効率よく観光！貸切で快適＆自由に移動」followed by an h3
      // 「Mokaruの送迎サービスのメリット」with NOTHING under it.
      {
        why: "④節（見出し・導入・空になった「メリット」見出し）を節ごと削除。中身は既に消えていて、見出しだけが自社の送迎を宣言していた。",
        findRe:
          /<hr class="wp-block-separator has-alpha-channel-opacity"\/>\s*<h2 class="wp-block-heading"><strong>🚙 ④ Mokaruの送迎で効率よく観光！貸切で快適＆自由に移動<\/strong><\/h2>[\s\S]*?<strong>🚙 Mokaruの送迎サービスのメリット<\/strong><\/h3>\s*/g,
        replace: "",
      },
      {
        why: "上の④を削除したので⑤の番号が飛ぶ。「送迎＆バス」も自社の送迎前提。",
        find: '<h2 class="wp-block-heading"><strong>📍 ⑤ 送迎＆バスを活用したおすすめルート（1日コース）</strong></h2>',
        replace: '<h2 class="wp-block-heading"><strong>📍 ④ バスとタクシーを活用したおすすめルート（1日コース）</strong></h2>',
      },
      {
        why: "導入が「シャトルバスやMokaruの送迎を使えば」。移動手段の提供をやめる。",
        find: "<strong>シャトルバスやMokaruの送迎を上手に使えば、レンタカーなしでも快適に観光できます！</strong>",
        replace: "<strong>シャトルバスとタクシーを上手に使えば、レンタカーなしでも快適に観光できます！</strong>",
      },
      {
        why: "同上。記事が扱う移動手段の並びから自社を外す。",
        find: "<strong>タモン・タムニングエリアを中心に、シャトルバス＆送迎で楽しむ観光プラン</strong>",
        replace: "<strong>タモン・タムニングエリアを中心に、シャトルバスとタクシーで楽しむ観光プラン</strong>",
      },
      {
        why: "「グループなら送迎サービスを活用するとコスパ◎」＝自社の1台あたり料金の話。第三者のチャーターやレンタカーなら今も成り立つので、そちらに寄せる。",
        find: "<p>📌 <strong>1人旅やカップルならタクシー、グループなら送迎サービスを活用するとコスパ◎！</strong></p>",
        replace:
          "<p>📌 <strong>1人旅やカップルならタクシーが手軽。グループなら人数で割れるので、車をチャーターしたほうが安く済むこともあります！</strong></p>",
      },
      {
        why: "まとめの1行が「Mokaruの専用送迎なら貸切＆日本語対応」。",
        find: "<br>🚙 <strong>Mokaruの専用送迎なら、貸切＆日本語対応で安心＆快適！</strong>",
        replace: "",
      },
      {
        why: "同じくまとめ。「送迎＋シャトルバス」の送迎は自社のもの。",
        find: "<strong>「自由に動きたいけど、レンタカーは不安…」という方は、送迎＋シャトルバスを組み合わせるのがベスト！</strong>",
        replace: "<strong>「自由に動きたいけど、レンタカーは不安…」という方は、タクシー＋シャトルバスを組み合わせるのがベスト！</strong>",
      },
      {
        why: "同上。ルートのまとめ。",
        find: "<p>📌 <strong>送迎＋バスを組み合わせることで、レンタカーなしでも自由に観光できる！</strong></p>",
        replace: "<p>📌 <strong>バスとタクシーを組み合わせることで、レンタカーなしでも自由に観光できる！</strong></p>",
      },
      {
        why: "「移動手段に迷っているならMokaruに相談」＝提供しない移動手段の相談窓口。正しい依頼先は legacy-cta.ts が記事の下に出す。",
        findRe:
          /\s*<p>📩 <strong>「移動手段に迷っている…」「効率よく観光したい！」という方は、まずはMokaruにご相談ください😊✨<\/strong><\/p>/g,
        replace: "",
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
  touts: {
    body: [
      {
        // Advice about avoiding touts, not an offer — but "LINEサポート" next
        // to モカル reads as ours. Generalised rather than deleted: telling a
        // reader to fall back on Japanese-speaking help is sound.
        why: "「日本語対応のガイドやLINEサポートを活用する」。自社の窓口と読めるが、10/1でLINEは窓口でなくなる。",
        find: "<li><strong>困ったときは日本語対応のガイドやLINEサポートを活用する</strong></li>",
        replace:
          "<li><strong>困ったときは、日本語が通じる窓口（滞在先のフロントや日本語対応の店）を頼る</strong></li>",
      },
      PROMO_BLOCK,
    ],
  },

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
        // 🔴 2026-09-12: July took the "24-hour" out and left the LINE support
        // in, which was right then and wrong now. Removed outright.
        why: "自社のLINEサポートでクレームの伝え方を代行する、という約束。10/1でLINEが窓口でなくなる。",
        find: "<li>モカルの24時間LINEサポートなら、<strong>クレームの伝え方をサポート</strong>します！（プランによる）</li>",
        replace: "",
      },
      {
        why: "同じ節の締め。相談窓口としてのLINEへの誘導。",
        find: "<li>クレーム対応の相談もLINEで気軽に</li>",
        replace: "",
      },
      {
        // The heading has to move with the item under it. Left alone it would
        // announce a LINE support service and then introduce one line about
        // emailing the hotel — which is how a section ends up reading as though
        // something was quietly cut out of it.
        why: "見出しが「LINEサポートを活用」のまま。下の項目を書き換えたので、見出しも中身に合わせる。",
        find:
          '<h4 class="wp-block-heading">3. フロントで言いにくければLINEサポートを活用</h4>',
        replace:
          '<h4 class="wp-block-heading">3. フロントで言いにくければ、書いて伝える</h4>',
      },
      {
        // 🔵 This one stays, reworded. It is advice about how to complain to a
        // HOTEL — use their own chat or email if speaking up at the desk is
        // hard — not an offer of ours. Deleting it would remove the useful part
        // along with the word LINE.
        why: "ホテルへの伝え方の助言で、自社の窓口の話ではない。誤読を避けるため「LINE」を外して一般化する。",
        find: "<li>日本語が通じにくいホテルの場合、<strong>LINEやメールで伝える</strong>のも手</li>",
        replace:
          "<li>日本語が通じにくいホテルの場合、<strong>メールやホテルのチャットで伝える</strong>のも手（文章なら翻訳して確認できます）</li>",
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
        // 🔴 2026-09-12: this correction, and the one below it, both used to
        // rewrite a 24-hour promise into "ask us on LINE" — which was right in
        // July and wrong from October, when LINE stops being a channel. The
        // same lesson as bus-rentacar: a correction is a standing claim and
        // goes stale with what it describes. Both now remove rather than
        // reword. There is no version of "contact us for help while you are in
        // trouble" that this business can promise on a blog page.
        why: "盗難・トラブル時のサポートの約束。7月は24時間の部分だけ外してLINEを残したが、そのLINEも10/1で終わる。",
        find: "<li>盗難やトラブル時も24時間対応のサポートあり</li>",
        replace: "",
      },
      {
        // The 2026-07-19 sweep fixed the claim at the foot of this article and
        // missed this one higher up — same article, same promise, found on
        // 2026-09-03 by grepping the live pages rather than the source. Worth
        // noting for the next sweep: one hit per article is not the end of it.
        //
        // 🔴 The worst page in the archive to make a support promise on: a
        // reader who has got this far has just been robbed. The two steps above
        // it — shout for help, call 911 and the consulate — are the ones that
        // matter, and they are untouched.
        why: "「3. LINEでモカルに相談」の節ごと削除。24時間対応の現地トラブルサポートは提供しない。",
        findRe:
          /\s*<h4 class="wp-block-heading">3\. LINEでモカルに相談<\/h4>\s*<ul class="wp-block-list">[\s\S]*?<\/ul>/g,
        replace: "",
      },
      // 販促ブロックの削除は最後に走らせる。上の各 find は手つかずの
      // スナップショットに対して書かれているため、先にブロックを消すと
      // 0件になってビルドが落ちる。
      PROMO_BLOCK,
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

  // 🔵 family-friendly moved to legacy-rewrites.ts on 2026-09-17. Its title was
  //「Mokaruが家族旅行におすすめの理由」and its five sections were the van: the
  // child waits in the car during shopping, the car is a mobile nappy-change
  // space, the schedule bends because our driver is yours for the day.
  //
  // 🔴 Three of the corrections deleted here were STALE IN THE OPPOSITE
  // DIRECTION, and that is the useful part. In July they rewrote
  //「レストランをご提案＆予約代行」down to「ご提案」, because back then booking a
  // restaurant for a guest was a perk we had stopped offering. From 2026-10-01
  // it is the main product at $10 a booking. The July correction was right in
  // July, wrong now, and it was quietly suppressing the one sentence in the
  // archive that described what we actually sell.
  //
  // A correction points at a moment. Both directions go stale.

  // 🔵 post-wedding-tour moved to legacy-rewrites.ts on 2026-09-17, for the
  // same reason as night-market-2 and with a sharper edge: its four numbered
  // sections were a 3-hour pre-wedding tour, an afternoon post-wedding tour, a
  // guide who comes with you, and a minibus charter. Nothing was left to patch.
  //
  // 🔴 One of the corrections deleted here was itself a July-style mistake.
  // It rewrote「大人数ならミニバス手配可」into「ご相談ください（要相談）」—— a
  // softened version of an offer we will not be able to make at all from 10/1.
  // Softening the wording of a claim is not the same as dropping the claim.

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
      {
        // 🔴 2026-09-17. The two corrections above cut the comparison section
        // and the closing pitch — and left the OPENING PARAGRAPH promising
        // both. The article announced a comparison with Mokaru that no longer
        // appeared anywhere below it.
        //
        // Worth stating plainly, because it is the third time this shape has
        // turned up today: when a section is removed, the sentence that
        // introduced it and the numbering around it are part of the removal.
        why: "導入が「それらと比較したときのMokaruの強みをご紹介します」。比較の節は削除済みで、前振りだけが残っていた。",
        find: "ここでは、グアムで利用できる主な移動手段と、それらと比較したときのMokaruの強みをご紹介します。",
        replace: "ここでは、グアムで利用できる主な移動手段と、それぞれの費用の目安をご紹介します。",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 「Mokaruの○○ツアー」「Mokaruの送迎」（2026-09-17）
  // ---------------------------------------------------------------------
  // 09-12 は自社の車・ガイド・LINEの語で掃いた。今回はビルド結果を
  //「Mokaru」という語そのもので掃いて、記事本文に85箇所あることが分かった。
  //
  // 全部が悪いわけではない。「迷ったらMokaruにご相談ください」は今も正しい
  // ——ホテル選びも、持ち物も、両替も、質問には答える。残すものと直すものを
  // 分ける基準は一つだけにした：
  //
  //   🔴 当社が「ツアーを運行する／車を出す／ガイドが同行する」と読める語か。
  //
  // これに当たるのが以下。当たらない「ご相談ください」系（chose-hotel,
  // dont-forget, emergencies, foreign-exchange, wifi-sim, guam-weather,
  // honeymoon-couple, top3-actitivity, local-food, restaurants など）は
  // 手を触れていない。hp-renewal も同様——創業の経緯を書いた記事で、
  //「あなたの希望に寄り添った旅をご提案します」は10/1以降も嘘ではない。
  "night-market": {
    body: [
      {
        why: "「行き方｜Mokaruの送迎サービスがおすすめ！」＝自社の送迎の宣伝。ただし「夜の足をどうするか」は読者が本当に知りたいことなので、節は残して中身を事実に置き換える。",
        find: '<h2 class="wp-block-heading"><strong>🚗 ナイトマーケットへの行き方｜Mokaruの送迎サービスがおすすめ！</strong></h2>',
        replace: '<h2 class="wp-block-heading"><strong>🚗 ナイトマーケットへの行き方｜夜の足は先に決めておく</strong></h2>',
      },
      {
        why: "「Mokaruの送迎付きツアーを利用すると快適」。タクシーとバスの事情そのものは正しいので残す。",
        find: "<br>グアムはタクシーが少なく、バスも夜はほとんど運行していないため、Mokaruの<strong>送迎付きツアー</strong>を利用すると快適に楽しめます！</p>",
        replace: "<br>グアムはタクシーが流していません。バスも夜はほとんど運行していないので、<strong>行きと帰りの手段を出かける前に決めておく</strong>のが基本です。</p>",
      },
      {
        why: "自社の送迎付きツアーの売り（ホテル送迎・日本語ガイド・夜景との組み合わせ）。",
        find: "<p>✅ <strong>ホテルまで送迎付きで安心！</strong><br>✅ <strong>現地のおすすめ屋台や楽しみ方を日本語ガイドがサポート！</strong><br>✅ <strong>ナイトマーケット＋夜景スポットの組み合わせも可能！</strong></p>",
        replace:
          "<p>✅ <strong>レンタカーなら駐車場は早い時間に埋まります</strong><br>✅ <strong>タクシーで行くなら、帰りの時間を決めて配車を頼んでおく</strong><br>✅ <strong>送迎のついたツアーを選べば、行き帰りを考えずに済みます</strong></p>",
      },
      {
        why: "「Mokaruがぴったりのプランをご提案」＝ツアーの組み立ての誘導。依頼先は legacy-cta.ts が記事の下に出す。",
        findRe:
          /\s*<p>📩 <strong>「どのナイトマーケットに行く？」と迷ったら、Mokaruがぴったりのプランをご提案！まずはお気軽にご相談ください😊✨<\/strong><\/p>/g,
        replace: "",
      },
      {
        why: "まとめの1行が「Mokaruの送迎付きツアーなら移動の心配なし」。",
        find: "<br>🚗 <strong>Mokaruの送迎付きツアーなら、移動の心配なしで楽しめる！</strong>",
        replace: "<br>🚗 <strong>夜は足の確保がいちばんの課題。行き帰りを決めてから出かけよう！</strong>",
      },
    ],
  },

  "guam-budget": {
    body: [
      {
        why: "移動手段別の費用の一覧に自社の専用送迎が入っている（終了するプランへのリンクつき）。他の3行は正しいので行だけ落とす。",
        find: '<br>✅ <strong><a href="/private-tour-3h/"><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-vivid-cyan-blue-color">Mokaruの専用送迎（ホテル⇔観光地）</mark></a>→ 予約すればスムーズ＆安心</strong>',
        replace: "",
      },
      {
        why: "節約のコツの一項が「移動が多いならMokaruの送迎ツアーを活用」。",
        find: "<br>✅ <strong>移動が多いならMokaruの送迎ツアーを活用！効率よく回れる</strong>",
        replace: "<br>✅ <strong>1日に何度も移動するなら、その日だけレンタカーを借りるほうが安く済むことも</strong>",
      },
    ],
  },

  "guam-day-plan": {
    body: [
      {
        why: "1日モデルコースの起点が「ホテル発（Mokaruの送迎でラクラク移動）」。行き先と時刻は正しいので残す。",
        find: "<p>🚗 <strong>09:00 ホテル発（Mokaruの送迎でラクラク移動）</strong><br>",
        replace: "<p>🚗 <strong>09:00 ホテル発</strong><br>",
      },
      {
        why: "「移動はMokaruの送迎を活用すると、短時間でも効率よく回れる」。",
        find: "<p>📌 <strong>「移動はMokaruの送迎を活用すると、短時間でも効率よく回れる！」</strong></p>",
        replace:
          "<p>📌 <strong>恋人岬とイパオビーチはバスで結べません。この行程はレンタカーか、送迎のある手段が前提です。</strong></p>",
      },
    ],
  },

  "dive-spot": {
    body: [
      {
        // 🔵 The first half of this sentence describes what we now sell — we
        // book the dive shop. Only the transfer had to go.
        why: "「ダイビングショップの予約や送迎もサポート」。予約の代行は今も行う（むしろ本業）。送迎だけが提供できない。",
        find: "<p>Mokaruのカスタマイズツアーなら、<strong>ダイビングショップの予約や送迎もサポート可能！</strong></p>",
        replace: "<p>Mokaruなら、<strong>ダイビングショップへのお申し込みを代わってお引き受けできます！</strong></p>",
      },
      {
        why: "「ダイビングツアーや送迎のご相談」。送迎は提供しない。",
        find: "<p>📩 <strong>グアムのダイビングツアーや送迎のご相談は、Mokaruまでお気軽にどうぞ！😊✨</strong></p>",
        replace: "<p>📩 <strong>グアムのダイビングのお申し込みは、Mokaruまでお気軽にどうぞ！😊✨</strong></p>",
      },
    ],
  },

  // 観光地4本＋ビーチ・歴史・買い物。どれも「Mokaruのカスタマイズツアー／
  // ショッピングツアーならご案内できます」で締めていた。行き方や見どころの
  // 説明は正しいので、締めの1文だけを事実に置き換える。
  "talafofo-falls": {
    body: [
      {
        why: "「Mokaruのカスタマイズツアーなら他の観光地と自由に組み合わせ可能」＋終了するプランへのリンク。",
        find: '<p><a href="/private-tour-3h/"><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-vivid-cyan-blue-color">Mokaruのカスタマイズツアー</mark></a>なら、<strong>タロフォフォの滝＋他の観光地を自由に組み合わせ可能！</strong></p>',
        replace:
          "<p>南部はバスが通っていません。<strong>レンタカーか、送迎のついたツアーを選ぶ</strong>ことになります。同じ方向にイナラハン天然プールやソレダッド砦があるので、まとめて回ると効率的です。</p>",
      },
      {
        why: "「ツアーのご相談は、Mokaruまで」＝自社ツアーの組み立ての誘導。",
        find: "<p>📩 <strong>タロフォフォの滝への行き方やツアーのご相談は、Mokaruまでお気軽にどうぞ！😊</strong></p>",
        replace: "<p>📩 <strong>現地ツアーのお申し込みは、Mokaruが代わってお引き受けします😊</strong></p>",
      },
    ],
  },

  "fort-apugan": {
    body: [
      {
        why: "「Mokaruのカスタマイズツアーならコースをご案内できます」＝自社がツアーを運行し同行する、と読める。",
        find: "<p>Mokaruのカスタマイズツアーなら、<strong>グアムの歴史と絶景をじっくり楽しめるコースをご案内できます！</strong></p>",
        replace:
          "<p>アプガン砦はハガニアの中心部から近く、<strong>スペイン広場やラッテストーン公園と一緒に回れます</strong>。歩いて巡れる距離なので、半日あれば十分です。</p>",
      },
      {
        why: "同上。ツアー相談の誘導。",
        find: "<p>📩 <strong>アプガン砦への行き方やツアーのご相談は、Mokaruまでお気軽にどうぞ！😊✨</strong></p>",
        replace: "<p>📩 <strong>現地ツアーのお申し込みは、Mokaruが代わってお引き受けします😊✨</strong></p>",
      },
    ],
  },

  "plaza-de-espana": {
    body: [
      {
        why: "「見どころをしっかり解説しながらご案内できます」＝ガイドが同行する、という約束。",
        find: "<p>Mokaruのカスタマイズツアーなら、<strong>歴史や文化の見どころをしっかり解説しながらご案内できます！</strong></p>",
        replace:
          "<p>スペイン広場のまわりには、<strong>ラッテストーン公園、アプガン砦、大聖堂</strong>が徒歩圏に集まっています。歴史をたどるなら、この4か所をつなげて歩くのがいちばん分かりやすい順番です。</p>",
      },
      {
        why: "同上。ツアー相談の誘導。",
        find: "<p>📩 <strong>スペイン広場への行き方やツアーのご相談は、Mokaruまでお気軽にどうぞ！</strong> 😊✨</p>",
        replace: "<p>📩 <strong>現地ツアーのお申し込みは、Mokaruが代わってお引き受けします</strong> 😊✨</p>",
      },
    ],
  },

  "guam-top5-sights": {
    body: [
      {
        why: "「Mokaruのカスタマイズツアーで絶景スポット巡りも可能」＋終了するプランへのリンク。",
        find: '<p>📩 <strong>「どこに行くべき？」と迷ったら、<a href="/private-tour-3h/"><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-vivid-cyan-blue-color">Mokaruのカスタマイズツアー</mark></a>で絶景スポット巡りも可能！気軽にご相談ください😊✨</strong></p>',
        replace: "<p>📩 <strong>現地ツアーのお申し込みは、Mokaruが代わってお引き受けします。気軽にご相談ください😊✨</strong></p>",
      },
    ],
  },

  "local-beach": {
    body: [
      {
        why: "「Mokaruのカスタマイズツアーで穴場ビーチ巡りも可能」。",
        find: "<p>📩 <strong>「どのビーチに行けばいい？」と迷ったら、Mokaruのカスタマイズツアーで穴場ビーチ巡りも可能！気軽にご相談ください😊✨</strong></p>",
        replace:
          "<p>📩 <strong>南部のビーチはバスが通っていません。レンタカーか、送迎のついたツアーを選んでください。ツアーのお申し込みはMokaruが代わってお引き受けします😊✨</strong></p>",
      },
    ],
  },

  "history": {
    body: [
      {
        why: "「歴史的なグアムを巡るツアーを作りたい方はご相談を。カスタマイズします」＝ツアーを組んで運行する、という約束。",
        find: "<p>📩 <strong>「歴史的なグアムを巡るツアーを作りたい！」という方は、Mokaruにご相談ください😊✨</strong><br>あなたにぴったりの「スペイン統治時代のグアム巡り」をカスタマイズします！</p>",
        replace:
          "<p>📩 <strong>スペイン統治時代の跡は、ハガニアに固まっています。</strong><br>スペイン広場、ラッテストーン公園、アプガン砦、大聖堂。徒歩でつなげられる距離なので、半日の散策で一通りたどれます。</p>",
      },
    ],
  },

  // ショッピング3本。どれも「Mokaruのショッピングツアーでご案内」で締める。
  "shopping-malls": {
    body: [
      {
        why: "「Mokaruのショッピングツアーでご案内」＝同行するツアーの提供。",
        find: "<p>📩 <strong>「どこで買うのがベスト？」と迷ったら、Mokaruのショッピングツアーでご案内！気軽にご相談ください😊✨</strong></p>",
        replace: "<p>📩 <strong>「どこで買うのがベスト？」と迷ったら、Mokaruにご相談ください😊✨</strong></p>",
      },
    ],
  },

  "guam-souvenir": {
    body: [
      {
        why: "同上。",
        find: "<p>📩 <strong>「どこで買うのがベスト？」と迷ったら、Mokaruがショッピングツアーをご案内！気軽にご相談ください😊✨</strong></p>",
        replace: "<p>📩 <strong>「どこで買うのがベスト？」と迷ったら、Mokaruにご相談ください😊✨</strong></p>",
      },
    ],
  },

  "kmart-or-abc": {
    body: [
      {
        why: "同上。",
        find: "<p>📩 <strong>「どこで何を買うのがベスト？」と迷ったら、Mokaruのショッピングツアーで効率よくお買い物が可能！気軽にご相談ください😊✨</strong></p>",
        replace: "<p>📩 <strong>「どこで何を買うのがベスト？」と迷ったら、Mokaruにご相談ください😊✨</strong></p>",
      },
    ],
  },

  // 販促ブロックの削除だけ。記事本文には手を入れていない（PROMO_BLOCK 参照）
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
