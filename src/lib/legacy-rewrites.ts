// Legacy articles whose BODY has been replaced, not patched.
//
// WHY THIS EXISTS, AND WHY IT IS DIFFERENT FROM legacy-corrections.ts
//
// Corrections fix sentences. These articles did not have wrong sentences in
// them — they were product pages for a product that ends on 2026-09-30. The
// three-hour plan, the five-hour plan, the eight-hour plan, the multi-day
// plan: the article IS the thing being withdrawn. In July the same test retired
// airport-shuttle outright, because there was no version of it that was both
// honest and still the same article.
//
// 🔴 Owner decision, 2026-09-12: rewrite them rather than retire them.
//
// The alternative was deleting twelve pages that rank. The old blog is 84% of
// the traffic this business gets and is the only channel that works, and a 410
// takes months to undo. So each URL keeps its slug, its inbound links and its
// position, and gets a body that is true from 2026-10-01.
//
// WHAT A REWRITE KEEPS
// The Guam knowledge, which is the owner's and is why these pages earn their
// traffic: the Saturday morning market at Chamorro Village, that the south is
// forty minutes each way, which supermarket is worth the trip. Place names,
// timings and routes are carried across as written.
//
// WHAT IT DROPS
// The product wrapper. Plan names, the rate card, "our guide will", "our
// vehicle", the airport transfer, LINE booking, and the 24-hour reply. What we
// sell now is stated once, by lib/legacy-cta.ts, underneath every article.
//
// 🔴 THESE ARE NOT THE OWNER'S ORIGINAL WORDING, and that is the whole reason
// they live in their own file rather than as a hundred find/replace pairs. The
// byte-exact WordPress snapshot in legacy-content.json is untouched and remains
// the only copy of what was published before; legacy-archive/ holds it too.
// Anyone asking "what did this page used to say?" has an answer.
//
// `modified` is stamped with the rewrite date rather than inherited. The page
// genuinely changed, and claiming it was last touched in 2025 would be a small
// lie told to search engines.

import { CORRECTIONS } from "./legacy-corrections";

export interface Rewrite {
  /** Replaces the article title. */
  title: string;
  /**
   * Replaces the article body. Plain HTML in the same shape cleanHtml() expects
   * — headings, paragraphs, lists. No inline styles, no WordPress block
   * classes; this is our markup now, not a snapshot of someone else's.
   */
  html: string;
  /** ISO date this rewrite was published. Becomes the article's `modified`. */
  rewrittenAt: string;
  /** What the page used to be, so the decision is legible without git. */
  was: string;
}

const REWRITTEN_AT = "2026-09-12";

export const REWRITES: Record<string, Rewrite> = {
  "short-plan": {
    was: "【3時間でも大満足】MokaruのShortプランでできること — 3時間チャータープランの商品ページ。$130／車両1台。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムで3時間あったら何ができる？ローカル派の過ごし方4選",
    html: `
<p>「チェックインまで3時間ある」「帰国便が夜だから午前中だけ動きたい」。グアムでは、この“中途半端に空いた数時間”の使い方で滞在の印象がずいぶん変わります。</p>
<p>ここでは、3時間あれば無理なく回れる過ごし方を4つご紹介します。どれも観光地を駆け足で回るのではなく、グアムの日常に少し触れる組み立てです。</p>

<h2>1. ローカルスーパーでお土産を探す</h2>
<p>「免税店ではなく、地元の人が行くスーパーに行きたい」という声はとても多いです。</p>
<ul>
<li><strong>Pay-Less</strong>／<strong>Cost U Less</strong> — 地元の食材やお菓子が並びます。まとめ買いならこちら</li>
<li><strong>Agana Shopping Center</strong> — ばらまき土産を買い足すのに便利</li>
<li><strong>Kマート</strong> — 24時間営業。早朝や深夜の時間つぶしにも</li>
</ul>
<p>チョコやビーフジャーキーは、店によって値段がかなり違います。同じ商品でも観光客向けの店より安く見つかることがあるので、余裕があれば2軒見てみてください。</p>

<h2>2. アガニャのビーチとカフェでのんびり</h2>
<p>海を眺めてぼんやりする時間も、短い滞在ほど贅沢に感じられます。</p>
<ul>
<li>アガニャのビーチを散歩して写真を撮る</li>
<li>フレッシュジュースやアサイーボウルをテイクアウトして、ビーチで食べる</li>
</ul>
<p>朝の時間帯は人が少なく、光もやわらかいので写真にも向いています。</p>

<h2>3. チャモロビレッジのナイトマーケット（水曜のみ）</h2>
<p>水曜の夜だけ開かれるナイトマーケットは、3時間あればそれだけを目当てに出かける価値があります。</p>
<ul>
<li>ローカルフードの屋台が並び、その場で食べられます</li>
<li>お土産やアクセサリーの店も出ます。値段交渉ができる店もあります</li>
</ul>
<p>水曜以外に行っても屋台は出ていないので、曜日だけは確認してから向かってください。</p>

<h2>4. スペイン広場まわりの史跡を歩く</h2>
<p>アガニャの中心部は、徒歩で回れる範囲に史跡がまとまっています。スペイン広場とその周辺は、日中なら1時間ほどで一通り見られます。時間が余ったら、近くのカフェで休むとちょうど3時間に収まります。</p>

<h2>3時間で行かないほうがいい場所</h2>
<p>島の南部は、片道40分以上かかります。行って戻るだけで往復1時間半が消えるので、3時間では「見た」というより「通った」になりがちです。南部はもっとまとまった時間が取れる日に回してください。</p>

<h2>まとめ</h2>
<p>3時間は、欲張らなければ十分に楽しめる長さです。1か所を決めて、その周辺をゆっくり歩く。グアムは小さな島なので、それだけでも「行ってよかった」と思える時間になります。</p>
`.trim(),
  },

  shortplan: {
    was: "Mokaru Shortプラン〈約3時間〉で “濃い” グアム体験を！ — 3時間プランの商品ページ。$130／台、料金表とLINE予約導線つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムの朝を3時間だけ楽しむ｜土曜の朝市と恋人岬の回り方",
    html: `
<p>グアム滞在の“スキマ時間”をどう使うか。朝の3時間は、実はいちばん密度の高い使い方ができる時間帯です。人が少なく、暑くなる前で、ローカルの生活が動いている時間だからです。</p>

<h2>土曜の朝市（フレッシュマーケット）</h2>
<p>チャモロビレッジは水曜夜のナイトマーケットが有名ですが、ローカル色を味わうなら<strong>土曜の朝市</strong>もおすすめです。</p>
<ul>
<li>ローカルのマンゴーやドラゴンフルーツが並びます</li>
<li>ココナツを削る実演と、しぼりたてのジュース</li>
<li>地元のおばあちゃんが作るバナナドーナツ</li>
</ul>
<p>観光地化されていない、素顔のグアムに触れられる場所です。早い時間ほど品揃えがよく、7時台に着けると気持ちよく回れます。</p>

<h2>朝市のあとに恋人岬へ</h2>
<p>「せっかくなら絶景も撮りたい」という方には、朝市のあとに<strong>恋人岬</strong>へ寄るルートが定番です。午前中は逆光になりにくく、海の色がよく出ます。</p>

<h3>3時間のモデルコース</h3>
<ul>
<li><strong>7:00</strong> ホテルを出発</li>
<li><strong>7:30</strong> 朝市に到着（30分ほど）</li>
<li><strong>8:30</strong> 恋人岬、またはローカルの朝食へ</li>
<li><strong>9:00</strong> ローカルブレックファースト（50分ほど）</li>
<li><strong>10:00</strong> ホテルに戻る／次の予定へ</li>
</ul>
<p>朝食まで済ませて戻れるので、半日つぶさずに“欲張り観光”ができます。</p>

<h2>テーマを絞る回り方</h2>
<p>3時間なら、あれもこれもより、テーマをひとつ決めたほうが満足度が上がります。</p>
<ul>
<li><strong>写真を撮る</strong>：ガンビーチ → レインボーチャペル → Rue Micronesia のウォールアート（約2.5時間）</li>
<li><strong>お土産をまとめ買い</strong>：Kマート → Cost U Less → Pay-Less（約3時間）</li>
<li><strong>カフェと街歩き</strong>：Tu'RE カフェで朝食 → スペイン広場・アガニャ散策（約3時間）</li>
</ul>

<h2>3時間でよくある質問</h2>
<h3>南部まで行けますか？</h3>
<p>行けますが、片道40分以上かかります。往復で1時間半近くが移動になるので、南部をゆっくり見たいなら、もっと長く時間が取れる日に回すのがおすすめです。</p>
<h3>子ども連れでも回れますか？</h3>
<p>3時間は、小さなお子さん連れにはちょうどよい長さです。朝市は歩く距離が短く、途中で切り上げやすいのも利点です。</p>

<h2>まとめ</h2>
<p>小さな島の大きな魅力は、3時間あれば十分に味わえます。朝の時間を少しだけ早く始めてみてください。</p>
`.trim(),
  },
};

/** True when this slug's body has been replaced rather than corrected. */
export function isRewritten(slug: string): boolean {
  return Object.hasOwn(REWRITES, slug);
}

// 🔴 A slug must not be in both places.
//
// getLegacyArticle() returns the rewrite and never calls applyCorrections for
// it, so a correction left behind on a rewritten article silently stops
// running. It would not fail its count check — that check only runs when the
// correction runs — so the file would go on describing an edit that no longer
// happens, and the next person would read it as current. That is the same
// failure as the stale list of line numbers in config.ts, and it costs more
// than the dead lines are worth.
//
// Checked at module load, so it fails the build rather than a page view.
for (const slug of Object.keys(REWRITES)) {
  if (Object.hasOwn(CORRECTIONS, slug)) {
    throw new Error(
      `legacy-rewrites: [${slug}] is rewritten AND has corrections in ` +
        `legacy-corrections.ts. The corrections can never run — the rewrite ` +
        `replaces the body before they are applied. Delete them, or drop the ` +
        `rewrite if the article only needed patching.`,
    );
  }
}
