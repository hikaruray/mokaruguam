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
  middleplanpost: {
    was: "Mokaruのツアーの選び方②｜Middleプラン（5時間） — 5時間チャータープランの商品ページ。$230／台、午前・午後の開始時間表つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムを半日で回るなら｜午前と午後、どちらを選ぶかで変わること",
    html: `
<p>「3時間では足りないけれど、1日まるごとは長い」。グアムの観光でいちばん多い悩みかもしれません。半日、5時間ほど取れると、観光に食事かショッピングをもう一つ組み合わせる余裕が出ます。</p>
<p>半日で動くとき、最初に決めるべきは行き先より<strong>午前に動くか、午後に動くか</strong>です。同じ5時間でも、見えるものがはっきり変わります。</p>

<h2>午前に動く（9時ごろ〜14時ごろ）</h2>
<p>観光してからローカルのお店で昼食、午後はホテルのビーチやプールでのんびり、という組み立てになります。暑くなる前に外を歩けるので、小さなお子さん連れやご年配の方と一緒のときは午前がおすすめです。</p>
<h3>回りやすい順路</h3>
<ul>
<li><strong>恋人岬</strong> — 午前は逆光になりにくく、海の色がよく出ます</li>
<li><strong>アプガン砦</strong> — ハガニアの街を一望できます</li>
<li><strong>スペイン広場・ラッテストーン公園</strong> — 歩いて回れる範囲に史跡がまとまっています</li>
<li><strong>ハガニア大聖堂</strong></li>
<li>ローカルレストランで昼食（チャモロ料理やステーキ）</li>
</ul>

<h2>午後に動く（16時ごろ〜21時ごろ）</h2>
<p>サンセットと夜の空気を入れられるのが午後の強みです。とくに<strong>水曜</strong>は、チャモロビレッジのナイトマーケットをそのまま組み込めます。</p>
<h3>回りやすい順路</h3>
<ul>
<li>ハガニア大聖堂やスペイン広場を散策</li>
<li><strong>サンセットポイント</strong> — アプガン砦や恋人岬から</li>
<li><strong>チャモロビレッジのナイトマーケット</strong>（水曜のみ）</li>
<li>ディナーは PROA やローカルのBBQレストランで</li>
</ul>
<p>人気店は夕食時に混みます。サンセットを見てから店を探すと待つことがあるので、先に席を押さえておくと流れが崩れません。</p>

<h2>ショッピングを入れるなら</h2>
<p>半日あれば、3〜4か所は無理なく回れます。</p>
<ul>
<li><strong>Kマート</strong> — 24時間営業。お土産のまとめ買いに</li>
<li><strong>マイクロネシアモール</strong></li>
<li><strong>GPO（グアム・プレミア・アウトレット）</strong></li>
<li><strong>Don Don Donki</strong> — 日本の食品が手に入ります</li>
</ul>

<h2>3時間との違い</h2>
<p>3時間は、主要なスポットを絞って回る時間です。5時間あると「観光＋食事」「観光＋買い物」のように<strong>楽しみを2つ組み合わせる余裕</strong>が生まれます。慌ただしさが消えるのがいちばんの違いです。</p>

<h2>まとめ</h2>
<p>半日なら、午前は景色と史跡、午後はサンセットと夜の市場。どちらを選ぶかを先に決めてしまうと、残りの予定は自然に決まります。</p>
`.trim(),
  },

  "long-tour": {
    was: "Mokaru Longプラン〈8時間〉 — 8時間チャータープランの商品ページ。$300／台（旧レート）、LINE予約導線つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムを1日かけて回る｜出発時間で変わる3つの組み立て方",
    html: `
<p>丸1日使えるなら、グアムは観光も食事も買い物もビーチも、ひととおり入ります。ただ、詰め込めるからこそ<strong>何時に動き出すか</strong>で1日の性格が変わります。よくある3つの組み立てを、時間帯ごとに整理しました。</p>

<h2>早朝から動く（7:00〜15:00）</h2>
<p>ローカルの空気を吸いたい人向けです。朝の店が開いている時間に動けるので、観光地では見られないグアムに触れられます。</p>
<ul>
<li>ローカルのドーナツ店やスーパーマーケット</li>
<li>週末ならフリーマーケット</li>
</ul>
<p>午後にはいったん宿に戻れるので、<strong>夕方をビーチや夕食に自由に使える</strong>のが利点です。</p>
<p>組み立て例：フリーマーケット → ローカルベーカリー → 恋人岬 → ショッピングセンター</p>

<h2>昼前から動く（10:00〜18:00）</h2>
<p>朝はゆっくりしたい人向け。移動手段があれば行ける、人気のステーキハウスやバーガーショップで昼食を取れます。午後に観光と買い物を入れて、夕方に戻る流れです。</p>
<p>組み立て例：南部観光 → ローカルランチ → ハガニア湾のビューポイント → GPOでショッピング</p>

<h2>昼から夜まで（12:00〜20:00）</h2>
<p>ランチ、サンセット、ディナーを全部入れたい人向けです。午後から観光してサンセットポイントへ、そのまま夕食へ向かう流れが組みやすい時間帯です。</p>
<p>組み立て例：シュノーケリング → 観光 → サンセットのビーチ → レストランで夕食</p>

<h2>1日で回れる場所</h2>
<h3>観光・史跡</h3>
<p>恋人岬／ハガニア大聖堂／スペイン広場／ガアンポイント／太平洋戦争記念公園／ソレダッド砦</p>
<h3>ショッピング</h3>
<p>Kマート／GPO／マイクロネシアモール／アガニアショッピングセンター</p>
<h3>ビーチ</h3>
<p>イパオビーチ／ガンビーチ／タンギッソンビーチ。人の少ない穴場もあります。</p>
<h3>食事</h3>
<p>ローカルに人気のステーキハウス、バーガーショップ、ベーカリー。</p>

<h2>シュノーケリングをするなら</h2>
<p>用具はご自身でご用意ください。<strong>ライフガードがいないビーチが多い</strong>ので、ライフジャケットも持って行くことをおすすめします。慣れていない方ほど、道具を借りられる場所を先に調べておくと安心です。</p>

<h2>南部まで足を延ばすなら</h2>
<p>島の南部は片道40分以上かかります。1日あれば十分に回れますが、半日だと移動で終わってしまいます。南部を見るなら、この長さの日に充ててください。</p>

<h2>まとめ</h2>
<p>1日あれば、行きたい場所はだいたい回れます。決め手になるのは順番より出発時間です。朝型ならローカルの朝、夜型ならサンセットと夕食。そこから逆算すると、1日の形が決まります。</p>
`.trim(),
  },
  "select-tour": {
    was: "Mokaruのツアーの選び方① — 4つのチャータープランの比較ページ。$130／$230 ほか。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアム観光は何時間あればいい？使える時間ごとにできることを整理",
    html: `
<p>グアムは小さな島ですが、移動時間を見誤ると予定が崩れます。ここでは「何時間あれば何ができるか」を、時間の長さごとに整理しました。行き先を決める前に、使える時間から逆算するほうが失敗しません。</p>

<h2>3時間あるとき</h2>
<p>詰め込めば、街なかの見どころを<strong>8〜9か所</strong>回れます。</p>
<p>恋人岬／アプガン砦／スペイン広場／ラッテストーン公園／ハガニア大聖堂／アサン戦争記念公園／エメラルドバレー／フィッシュアイマリンパーク</p>
<p>ただし、これは「見た」に近い回り方です。写真を撮って次へ、という進み方になります。</p>
<h3>組み合わせるなら</h3>
<ul>
<li><strong>観光＋食事＋買い物</strong>：観光を4か所ほどに絞れば、食事に1時間、買い物に40分ほど取れます</li>
<li><strong>買い物だけ</strong>：Kマート／GPO／マイクロネシアモール／Don Don Donki のうち3〜4か所を、各50分ほど</li>
</ul>
<p>南部を半周することもできますが、かなり駆け足になります。</p>

<h2>5時間あるとき</h2>
<p>観光に、食事かサンセットをもう一つ足せる長さです。午前なら観光とランチ、午後なら観光とサンセット、そして水曜ならチャモロビレッジのナイトマーケットまで入ります。</p>

<h2>8時間あるとき</h2>
<p>観光・食事・買い物・ビーチをひととおり入れられます。南部までしっかり足を延ばすなら、この長さは必要です。</p>

<h2>南部に行くなら知っておきたいこと</h2>
<p>島の南部は片道40分以上かかります。見どころは多く、アガット戦争記念公園、ソレダッド砦、メリッソのピア、ベアズロック、イナラハンの天然プールなど、自然と史跡がまとまっています。<strong>ただし往復で1時間半近くが移動</strong>なので、3時間の枠で行くと移動が主役になってしまいます。</p>

<h2>時間帯の選び方</h2>
<ul>
<li><strong>午前</strong> — 暑くなる前に歩けます。写真も逆光になりにくい時間です</li>
<li><strong>午後</strong> — 買い物向き。屋内で過ごせます</li>
<li><strong>夕方</strong> — サンセットと夕食。水曜ならナイトマーケット</li>
</ul>

<h2>まとめ</h2>
<p>グアムは「行きたい場所」より「使える時間」から決めるほうがうまくいきます。3時間なら1エリア、5時間なら観光ともう一つ、8時間なら島の南まで。この目安だけ持っておけば、現地で迷いません。</p>
`.trim(),
  },

  "1day-plan": {
    was: "【1日貸し切り】Mokaruの1Dayプランでできること — 12〜14時間プランの商品ページ。$500／車両1台。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムを島一周する1日｜北から南まで回るモデルコース",
    html: `
<p>「グアムって意外と広い」。丸一日使って島をぐるっと回った人がよく言うことです。北と南では風景がまったく違い、1日かければその両方を見られます。</p>

<h2>島を一周するコース</h2>
<ul>
<li><strong>朝：恋人岬</strong> — 人が少ない時間の展望台は静かです</li>
<li><strong>アガニャ大聖堂／スペイン広場</strong> — 歴史のあるエリアを散策</li>
<li><strong>イナラハンの天然プール</strong> — 岩に囲まれた天然のプールで泳げます</li>
<li><strong>マーリアナ灯台／ウマタック湾</strong> — 南部のフォトスポット</li>
<li><strong>昼食</strong> — ローカルのBBQ、またはピクニック</li>
<li><strong>帰りにKマートやモール</strong> — 買い物をして、夕日の時間に合わせて戻る</li>
</ul>
<p>南部は片道40分以上かかるので、一周するなら朝早く出るほど余裕が生まれます。</p>

<h2>朝市から夜まで、詰め込むコース</h2>
<p>滞在日数が少ない人向けの組み立てです。</p>
<ul>
<li><strong>早朝：デデドの朝市</strong>（土日限定）— ローカルグルメと買い物</li>
<li><strong>午前</strong>：恋人岬、ビーチで遊ぶ</li>
<li><strong>昼食</strong>：人気のローカルレストラン、または宿で休憩をかねて</li>
<li><strong>午後</strong>：買い物（JPストア、GPOなど）</li>
<li><strong>夜</strong>：ローカルレストランで夕食、または夜景の撮影</li>
</ul>
<p>デデドの朝市は<strong>土日だけ</strong>です。曜日が合わないと、この組み立ては成立しません。</p>

<h2>観光以外にも1日は使える</h2>
<p>丸一日あると、旅行以外の用事もまとめて片づきます。</p>
<ul>
<li>ウェディングの下見（ロケハン）</li>
<li>撮影で島内をいくつも回るとき</li>
<li>物件の下見</li>
<li>視察で複数の場所を訪ねるとき</li>
</ul>

<h2>まとめ</h2>
<p>1日あれば、グアムは北から南まで見られます。押さえておくのは2つだけ。<strong>南部は片道40分</strong>、そして<strong>デデドの朝市は土日だけ</strong>。この2つに予定を合わせれば、あとは自由に組めます。</p>
`.trim(),
  },

  "long-plan": {
    was: "カスタム自由！【1日まるっと使える】MokaruのLongプランでできること — 7〜8時間プランの商品ページ。$300／車両1台。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムの1日をテーマで決める｜定番・ビーチ・欲張り・子連れの4コース",
    html: `
<p>丸一日あると、かえって何をするか迷います。行き先から考えるより、<strong>その日のテーマを一つ決める</strong>ほうが、結果として満足度が上がります。よくある4つの型をまとめました。</p>

<h2>1. 定番をひととおり回る</h2>
<p>初めてのグアムで「有名なところは押さえたい」という日に。</p>
<ul>
<li>恋人岬（展望台からの眺め）</li>
<li>マイクロネシアモール</li>
<li>Kマート（ローカルスーパーでお土産探し）</li>
<li>デデドの朝市（土日限定）</li>
<li>昼食は人気のローカルレストランで</li>
</ul>

<h2>2. ビーチとカフェでゆっくり</h2>
<p>観光は少なめに、のんびりする時間を長く取りたい日に。</p>
<ul>
<li>イパオビーチ、またはガンビーチ</li>
<li>Tureカフェなどでランチかお茶</li>
<li>JPストアやTギャラリアでお土産</li>
<li>余裕があればチャモロビレッジや展望台へ</li>
</ul>
<p>ビーチは<strong>ライフガードのいない場所が多い</strong>ので、泳ぐなら浅いところで、ライフジャケットを用意しておくと安心です。</p>

<h2>3. 食べる・買う・体験する、欲張りコース</h2>
<ul>
<li>フリーマーケット（週末限定）</li>
<li>人気のパンケーキ店でブランチ</li>
<li>グアム博物館や聖母マリア大聖堂で文化に触れる</li>
<li>午後はビーチ沿いでドリンクを片手にのんびり</li>
<li>締めはチャモロ料理</li>
</ul>

<h2>4. 子ども連れで無理なく</h2>
<p>移動を少なめにして、子どものペースに合わせる組み立てです。</p>
<ul>
<li>子どもが遊べるビーチか公園</li>
<li>マイクロネシアモールのキッズゾーン</li>
<li>ベビーカーで入れるレストランやカフェで昼食</li>
<li>お昼寝の時間を予定に入れておく</li>
</ul>
<p>予定を詰めないことがいちばんのコツです。1日に2〜3か所で十分に足ります。</p>

<h2>まとめ</h2>
<p>1日の満足度を決めるのは、回った数ではなくテーマの一貫性です。どれか一つを選んで、その日はそれに寄せてみてください。</p>
`.trim(),
  },
  longplanpost: {
    was: "Mokaruのツアーの選び方③｜Longプラン（8時間） — 8時間プランの商品ページ。$300／台、開始時間表つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアム南部を半周する｜自然と史跡をまとめて見る回り方",
    html: `
<p>グアムの見どころは、北部と中部だけではありません。1日使えるなら、自然と史跡がまとまっている<strong>南部</strong>まで足を延ばす価値があります。半日では移動で終わってしまう場所です。</p>

<h2>南部で見られるもの</h2>
<ul>
<li><strong>アガット戦争記念公園</strong></li>
<li><strong>ソレダッド砦</strong> — 海を見下ろす高台に建っています</li>
<li><strong>メリッソのピア</strong></li>
<li><strong>ベアズロック</strong> — 名前のとおり、熊の形に見える岩</li>
<li><strong>イナラハンの天然プール</strong> — 岩に囲まれた海水のプール</li>
</ul>
<p>観光地化されすぎていない分、静かに過ごせます。舗装されていない場所もあるので、歩きやすい靴のほうが安心です。</p>

<h2>中部・北部と組み合わせる</h2>
<p>南部だけで1日を使い切る必要はありません。往路か復路に街なかを挟むと、変化のある1日になります。</p>
<p>恋人岬／アプガン砦／ハガニア大聖堂／スペイン広場／ラッテストーン公園／アサン戦争記念公園／エメラルドバレー／フィッシュアイマリンパーク</p>

<h2>時間の目安</h2>
<p>南部は片道<strong>40分以上</strong>。半周してくると、移動だけで2時間前後は見ておく必要があります。1日8時間あるとして、観光に使えるのは実質6時間ほど、と考えておくと予定が崩れません。</p>

<h2>食事をどこで取るか</h2>
<p>南部は店が少ないので、<strong>食事の場所を先に決めておく</strong>ほうが安全です。ローカルのチャモロ料理、BBQ、ステーキハウスなど、街なかに戻ってから取るか、南部で目星をつけておくかを決めておきましょう。</p>

<h2>買い物を足すなら</h2>
<p>南部から戻ったあとに、Kマート、マイクロネシアモール、GPO、Don Don Donki のどれかを1つ入れると、ちょうど1日の締めになります。荷物が増えるので、買い物は最後に回すのが鉄則です。</p>

<h2>まとめ</h2>
<p>南部は「行けたら行く」ではなく、<strong>行くと決めた日に行く</strong>場所です。片道40分という距離を予定に織り込めば、1日で無理なく回れます。</p>
`.trim(),
  },

  "1dayplan": {
    was: "Mokaru 1 Dayプラン〈12〜14時間〉 — 12〜14時間プランの商品ページ。$500／台、LINE 24hサポート・空港送迎の記載つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアム1日のタイムライン実例｜朝7時から夜8時半まで島を回る",
    html: `
<p>グアムは小さな島に見えますが、<strong>北端から南端を往復すると200kmを超えます</strong>。丸一日あれば一周できますが、時間配分を間違えると後半が駆け足になります。実際に組める1日のタイムラインを、時刻つきで置いておきます。</p>

<h2>島を一周する1日</h2>
<ul>
<li><strong>7:00</strong> 出発 → <strong>リティディアンビーチ</strong>。朝のビーチは人がほとんどいません</li>
<li><strong>10:30</strong> <strong>マイクロネシアモール</strong>で朝食と買い物</li>
<li><strong>11:30</strong> <strong>ハガニャ大聖堂・ラッテストーン公園</strong>で歴史のエリアを散策</li>
<li><strong>12:00</strong> <strong>タロフォフォの滝</strong></li>
<li><strong>13:30</strong> <strong>ウマタック村</strong>のローカルレストランで昼食</li>
<li><strong>15:00</strong> <strong>イナラハンの天然プール</strong>で涼む</li>
<li><strong>17:30</strong> <strong>ガンビーチ</strong>でサンセット</li>
<li><strong>19:00</strong> <strong>チャモロビレッジのナイトマーケット</strong>（水曜のみ）</li>
<li><strong>20:30</strong> 宿に戻る</li>
</ul>
<p>水曜以外に回る場合は、19:00の枠を夕食に充ててください。</p>

<h2>家族連れなら、ビーチに長く居る組み立て</h2>
<p>1日で回りきることより、1か所に長く居るほうが子どもは喜びます。</p>
<ul>
<li>朝市（土日限定）</li>
<li>PICのウォーターパークに4時間ほど</li>
<li>カヤック体験</li>
<li>夕方に買い物</li>
<li>テラス席のある店で夕食</li>
</ul>
<p>子どもがお昼寝している間に、大人が交代で買い物に出る。家族旅行では、この“バラバラに動ける時間”があるかどうかで疲れ方が変わります。</p>

<h2>撮影や取材で1日使うとき</h2>
<p>夜明けのビーチ、洞窟、カフェ、夕日と夜景。<strong>光の時間帯が決まっている被写体</strong>が多いので、1日の順番は日の出と日没から逆算して組むことになります。移動が多くなるぶん、1日通しで動ける手段の確保が前提になります。</p>

<h2>長い1日で気をつけること</h2>
<ul>
<li><strong>飲み物を多めに</strong> — 屋外にいる時間が長くなります</li>
<li><strong>買い物は後半に</strong> — 荷物を持って移動する時間を減らせます</li>
<li><strong>冷やしたいお土産は最後に</strong> — チョコレートは日中の車内では溶けます</li>
</ul>

<h2>まとめ</h2>
<p>12時間あれば、グアムは一周できます。鍵になるのは出発時刻です。7時に動き出せるかどうかで、入る場所が2つ3つ変わります。</p>
`.trim(),
  },

  totalplanpost: {
    was: "MokaruのTotalプラン（12時間×2日～） — 連日チャータープランの商品ページ。$450／日、空港送迎・イベント同行の記載つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムに連泊するなら｜日ごとにテーマを変える過ごし方",
    html: `
<p>2泊3日以上あるなら、毎日おなじように観光する必要はありません。<strong>日ごとにテーマを変える</strong>と、同じ島にいながら印象の違う3日間になります。よくある組み立てを置いておきます。</p>

<h2>Day 1（到着日）— 軽く済ませる</h2>
<p>到着日に予定を入れすぎると、翌日に響きます。チェックインを済ませて、近場を軽く歩き、ローカルの店で夕食。これで十分です。</p>

<h2>Day 2 — 観光と買い物</h2>
<ul>
<li><strong>午前</strong>：恋人岬、アプガン砦、ハガニアの散策</li>
<li><strong>昼</strong>：ローカルレストランで昼食</li>
<li><strong>午後</strong>：買い物（Kマート、GPO、マイクロネシアモール）</li>
<li><strong>夕方</strong>：サンセットを見てから夕食</li>
</ul>
<p>街なかで完結するので移動が短く、いちばん密度を上げやすい日です。</p>

<h2>Day 3 — 南部へ</h2>
<ul>
<li>アガット戦争記念公園、ソレダッド砦、ベアズロック、イナラハンの天然プールなど南部半周</li>
<li>午後はビーチでシュノーケリング</li>
<li>夜はゆっくり、または街なかで夕食</li>
</ul>
<p>南部は片道40分以上かかるので、まるまる1日を充てられる連泊のときこそ向いています。</p>

<h2>連泊だからできること</h2>
<ul>
<li><strong>天気で入れ替えられる</strong> — 雨の日を買い物に、晴れた日をビーチに回せます</li>
<li><strong>同じ店にもう一度行ける</strong> — 気に入った店を再訪できるのは連泊の特権です</li>
<li><strong>疲れたら休む日を作れる</strong> — 1日まるごとホテルで過ごす日があってもいいのです</li>
</ul>

<h2>予約が要るものは先に</h2>
<p>人気のレストランや、アクティビティの枠は、滞在が決まった時点で押さえておくほうが確実です。とくに週末や日本の連休にあたる時期は、当日では取れないことがあります。</p>

<h2>まとめ</h2>
<p>連泊の良さは「全部を1日に詰め込まなくていい」ことです。到着日は軽く、街の日と南部の日を分ける。それだけで、3日間がぐっと楽になります。</p>
`.trim(),
  },

  "about-mokaru": {
    was: "レンタカーなしでも楽しめる！Mokaruの送迎付き観光プラン — 送迎つきプランの商品ページ。$130〜／$300〜／空港送迎$25〜。",
    rewrittenAt: REWRITTEN_AT,
    title: "レンタカーなしでグアムを回るには｜移動手段の選び方",
    html: `
<p>「グアムでレンタカーを借りるのは不安」「運転せずに観光したい」。よくある悩みです。グアムは<strong>タクシーが少なく、公共交通も日本のようには発達していません</strong>。移動手段をどうするかは、行き先を決めるより先に考えておくべきことです。</p>

<h2>選択肢は大きく3つ</h2>

<h3>1. レンタカー</h3>
<p>いちばん自由に動けます。ただし右側通行で、標識も英語です。慣れていない方は、初日から長距離を運転しない組み立てにしておくと安心です。駐車場は多くの観光地にあります。</p>

<h3>2. タクシー</h3>
<p>数が少なく、料金も高めです。街なかで手を挙げて止める、という使い方は期待できません。ホテルのフロントで呼んでもらう前提で考えてください。<strong>観光地から帰りのタクシーを拾う</strong>のがいちばん難しいので、行きだけタクシーという計画は避けたほうが無難です。</p>

<h3>3. 送迎のついたツアーやアクティビティを選ぶ</h3>
<p>行き先が決まっているなら、送迎込みのアクティビティを選ぶのが結局いちばん楽です。移動を考えずに済み、荷物も置いておけます。</p>

<h2>行き先別に考える</h2>
<ul>
<li><strong>ホテル周辺とショッピングモール</strong> — 徒歩とホテルのシャトルで足りることが多いエリアです</li>
<li><strong>恋人岬・ハガニア周辺</strong> — 点在しているので、移動手段があると効率が段違いに変わります</li>
<li><strong>南部（イナラハン、ウマタック、ソレダッド砦など）</strong> — 片道40分以上。<strong>移動手段なしでは現実的ではありません</strong></li>
<li><strong>タロフォフォの滝</strong> — 同じく、車がある前提の場所です</li>
</ul>

<h2>荷物と子ども連れのこと</h2>
<p>買い物のあとに観光を続けるなら、荷物を置ける手段があるかどうかが快適さを左右します。小さなお子さん連れやご年配の方と一緒なら、歩く距離を減らせる移動手段を先に確保しておくことをおすすめします。チャイルドシートが必要な場合は、手配の時点で伝えておきましょう。</p>

<h2>まとめ</h2>
<p>グアムは「着いてから考える」が通用しにくい島です。行きたい場所が街なかの外にあるなら、移動手段を先に決めてください。そこさえ決まれば、あとの予定は自由に組めます。</p>
`.trim(),
  },
  "kids-3hour-tour": {
    was: "子連れ3時間ツアーの商品ページ。〈Shortプラン〉の紹介、モデルルート、ガイド名入りのお客様の声つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "子ども連れでグアムを3時間｜ベビーカーでも回れる回り方",
    html: `
<p>「ビーチもショッピングも楽しみたいけれど、子ども連れだと移動が大変」。グアムは日差しが強く、歩道に段差もあるので、大人だけのときと同じ計画では途中で崩れます。</p>
<p>3時間は、小さなお子さん連れにはちょうどよい長さです。無理なく回るための考え方をまとめました。</p>

<h2>ベビーカーで回るときのコツ</h2>
<ul>
<li><strong>段差の少ないルートを選ぶ</strong> — 観光地のあいだの歩道は、場所によって整備状況がかなり違います</li>
<li><strong>日陰を先に確認しておく</strong> — 日中の屋外は想像より消耗します。木陰や屋根のある場所を折り返し地点にすると楽です</li>
<li><strong>トイレと授乳の場所を織り込む</strong> — ショッピングモールは設備が整っているので、途中に一度挟むと安心です</li>
</ul>

<h2>3時間のモデルルート</h2>
<ul>
<li><strong>0:00</strong> 出発</li>
<li><strong>0:15</strong> <strong>恋人岬</strong> — 展望台からの景色。記念の鍵をかけられます</li>
<li><strong>1:00</strong> <strong>ハガニア大聖堂</strong> — 屋内なので、暑い時間の休憩をかねられます</li>
<li><strong>1:40</strong> <strong>チョコレートハウス</strong> — 試食があり、子どもが飽きにくい場所です</li>
<li><strong>2:30</strong> <strong>ビーチロード</strong>を散歩</li>
<li><strong>3:00</strong> 宿に戻る</li>
</ul>
<p>2時間で切り上げてもかまいません。<strong>予定を1つ減らす余白</strong>を最初から持っておくのが、子連れの旅でいちばん効きます。</p>

<h2>移動手段について</h2>
<p>グアムはタクシーの数が少なく、観光地から流しのタクシーを拾うのは現実的ではありません。チャイルドシートが必要な場合は、移動手段を手配する時点で伝えておきましょう。</p>

<h2>暑さ対策</h2>
<p>飲み物は多めに。日陰の少ない場所が続くので、帽子と日焼け止めは必須です。ぐずり始めたら早めに屋内へ移ることを、最初から予定に入れておいてください。</p>

<h2>まとめ</h2>
<p>子ども連れのグアム観光は、回った数ではなく「無事に楽しく帰れたか」で決まります。3時間、2〜3か所。それで十分です。</p>
`.trim(),
  },
  // ---------------------------------------------------------------------
  // The three service/brand articles.
  //
  // Each was a description of the charter from a different side — the guide,
  // the customised tour, the company's reason for existing. The test applied
  // in July was "is there a version that is both honest and still the same
  // article?", and here the answer is yes for all three, but only because the
  // READER'S need outlives the product:
  //
  //   mokaru-support     — "English worries me" is exactly who this business
  //                        now serves. The article keeps its question and
  //                        changes its answer.
  //   mokaru-highlights  — its real content was named places, not the tour.
  //   mokaru-vision      — a statement of what the company is for. A company
  //                        that changes what it does can still say why.
  // ---------------------------------------------------------------------
  "mokaru-support": {
    was: "グアム旅行の強い味方！日本語ガイド付きで安心の観光サポート — 日本語ガイド付きツアーの紹介。空港送迎・LINEサポート・専用車。",
    rewrittenAt: REWRITTEN_AT,
    title: "英語が不安でもグアムは楽しめる｜場面ごとの切り抜け方",
    html: `
<p>グアムは日本人観光客が多い島ですが、一歩ローカル寄りの店に入ると英語だけ、という場面は普通にあります。「通じなかったらどうしよう」で行きたい店を諦めるのはもったいないので、場面ごとの現実的な切り抜け方をまとめました。</p>

<h2>レストラン</h2>
<p>いちばん英語が要るのは<strong>予約の電話</strong>です。店に入ってからは、メニューを指させばだいたい通じます。人気店は電話予約が前提のところがあり、ここが最初の関門になります。</p>
<ul>
<li>席に着いてからは指差しで足ります</li>
<li>アレルギーなど<strong>間違えられないこと</strong>は、紙かスマホに書いて見せるのが確実です</li>
<li>会計時のチップは、伝票に書き込む形式が一般的です</li>
</ul>

<h2>買い物</h2>
<p>スーパーやモールは、ほぼ無言でも完結します。困るのはサイズ交換や返品で、こちらは用件を伝える必要があります。レシートを見せて "exchange" と言えば意図は伝わります。</p>

<h2>体調を崩したとき</h2>
<p>ここだけは、通じるかどうかに任せないでください。症状を<strong>日本語で書いたメモを翻訳しておく</strong>と、いざというとき落ち着いて渡せます。滞在先のフロントに相談すれば、病院の案内はしてもらえます。</p>

<h2>移動</h2>
<p>タクシーは台数が少なく、行き先を伝えるのに苦労することがあります。<strong>目的地を地図で見せる</strong>のがいちばん確実です。</p>

<h2>先に済ませておけること</h2>
<p>英語の不安の大半は、<strong>予約</strong>に集まっています。逆に言えば、行きたい店とアクティビティを渡航前に押さえてしまえば、滞在中に英語を使う場面はかなり減ります。着いてから探すより、出発前に決めておくほうが楽です。</p>

<h2>まとめ</h2>
<p>グアムで英語が必要になるのは、実は限られた場面だけです。予約と、体調を崩したとき。この2つに備えておけば、あとは指差しと笑顔でだいたい足ります。</p>
`.trim(),
  },

  "mokaru-highlights": {
    was: "Mokaruのツアーはここが違う！自由に楽しめるカスタマイズプラン — 貸切ツアーの特徴紹介。LINEサポート・チャイルドシート等。",
    rewrittenAt: REWRITTEN_AT,
    title: "グアムの定番の組み合わせ方｜観光・食事・アクティビティの並べ方",
    html: `
<p>グアムは、見どころが北から南に散らばっています。1日の満足度を決めるのは行き先の数より<strong>並べ方</strong>で、相性のいい組み合わせがいくつかあります。実際によく使われる型を挙げておきます。</p>

<h2>絶景 → ローカルの食事 → 買い物</h2>
<ul>
<li><strong>午前</strong>：恋人岬とアプガン砦。どちらも高台で、午前のほうが写真がきれいに撮れます</li>
<li><strong>昼</strong>：プロアなどでBBQ。人気店なので時間をずらすか、席を押さえておくと安心です</li>
<li><strong>午後</strong>：GPOで買い物、そのままフィッシュアイマリンパークへ</li>
</ul>
<p>午前に外を歩き、暑い時間を屋内と海に充てる。この順番が体力的にいちばん無理がありません。</p>

<h2>子ども連れなら、動くより留まる</h2>
<ul>
<li><strong>午前</strong>：グアム動物園、またはフィッシュアイマリンパーク</li>
<li><strong>昼</strong>：シャーリーズキッチンなど、子ども向けのメニューがある店</li>
<li><strong>午後</strong>：イパオビーチでのんびり</li>
</ul>
<p>1日に3か所まで。移動のたびに体力が削られるので、大人の想定より1つ少なくしておくのが結果的にうまくいきます。</p>

<h2>組み合わせが悪くなりがちな例</h2>
<ul>
<li><strong>買い物を先に入れる</strong> — 荷物を持って1日歩くことになります。買い物は最後です</li>
<li><strong>昼どきに人気店へ飛び込む</strong> — 待ち時間で午後の予定が崩れます</li>
<li><strong>南部と北部を半日で往復する</strong> — 片道40分以上なので、移動が主役になります</li>
</ul>

<h2>先に押さえておくもの</h2>
<p>人気のレストランと、枠の決まっているアクティビティ。この2つだけは、現地で決めようとすると希望の時間が残っていないことがあります。渡航前に押さえておくと、当日の組み立てが自由になります。</p>

<h2>まとめ</h2>
<p>グアムの1日は、順番で決まります。午前は外、昼は食事、午後は屋内か海、買い物は最後。この骨格さえ守れば、あとは行きたい場所を当てはめるだけです。</p>
`.trim(),
  },

  "mokaru-vision": {
    was: "Mokaruの想いとビジョン — 貸切ツアーの理念。24時間対応のAIサポート＋日本語ガイドのLINEサポートの記載つき。",
    rewrittenAt: REWRITTEN_AT,
    title: "Mokaru Guam の考えていること｜「本当のグアム」に手が届くように",
    html: `
<p>グアムは日本から3時間半。美しいビーチと自然があり、ローカルの人たちが迎えてくれる島です。それでも初めて訪れる方からは、同じような声を聞きます。</p>
<p>「ガイドブックに載っている場所しか行けなかった」「行きたい店はあったけれど、予約が取れなかった」。</p>

<h2>私たちが大切にしていること</h2>

<h3>1. タモンの外にも、グアムはある</h3>
<p>グアムというと、タモンのビーチとショッピングのイメージが強いかもしれません。けれど観光客の少ない静かなビーチも、スペイン統治時代の歴史が残るハガニアも、ローカルが集まるBBQの店も、同じ島にあります。<strong>ガイドブックに載っていないほうのグアム</strong>に手が届くようにしたい、というのが出発点です。</p>

<h3>2. 「予約が取れない」で諦めてほしくない</h3>
<p>人気の店ほど、英語での電話予約が必要だったり、当日では入れなかったりします。そこで諦めてしまうのは、島の魅力の一部を見ずに帰ることと同じです。<strong>その一手間を、グアムにいる私たちが代わりに引き受けます。</strong></p>

<h3>3. 渡航前に、日本語で終わらせられること</h3>
<p>着いてから探すより、出発前に決まっているほうが旅は楽です。レストランの予約も、アクティビティの手配も、日本語のまま済ませられるようにしています。</p>

<h2>2026年10月からのこと</h2>
<p>2026年9月30日まで、私たちは日本語ガイドと専用車による貸切ツアーを運行していました。10月からは、<strong>お客様に代わって予約を取る</strong>ことに専念しています。</p>
<p>レストランの予約代行は1件 $10。お席をお取りできなかった場合、料金はいただきません。アクティビティは提携する実施会社のツアーを手配し、当社へのお支払いはありません。</p>
<p>自分たちで運ぶのをやめた分、<strong>どこへ行くかの選択肢を広げられる</strong>と考えています。私たちの車に乗れる人数や、その日の空き状況に縛られなくなったからです。</p>

<h2>これからも変わらないこと</h2>
<p>グアムに住んでいる人間が、日本語で、実際に足を運んだ場所をご案内する。手段が変わっても、そこは変えないつもりです。</p>
`.trim(),
  },
  // Seven separate claims about our vehicle, our child seats and our free
  // pushchair hire, plus a LINE support section — in an article whose title is
  // 「ベビーカー＆チャイルドシート完備のツアー」. Patching seven places would
  // have left a page still built around equipment we will not have.
  //
  // The facts worth keeping are real and hard to find elsewhere: Guam requires
  // a child seat under six, changing tables are scarce outside the big malls,
  // and which restaurants have a kids' menu.
  "kid-friendly": {
    was: "ベビーカー＆チャイルドシート完備のツアー — 子連け向け貸切ツアーの商品ページ。チャイルドシート無料・ベビーカー無料貸出・LINEサポート。",
    rewrittenAt: REWRITTEN_AT,
    title: "子ども連れのグアム｜チャイルドシート、おむつ替え、食事の場所",
    html: `
<p>子ども連れのグアムで困るのは、観光地そのものより<strong>その間のこと</strong>です。移動、おむつ替え、食事。先に知っておくと段取りが変わる点をまとめました。</p>

<h2>チャイルドシートは法律で必要です</h2>
<p>グアムでは<strong>6歳未満の子どもにチャイルドシートの使用が義務づけられています</strong>。レンタカーを借りるなら予約時に申し込んでください。送迎やツアーを手配する場合も、<strong>手配の時点で子どもの年齢を伝えておく</strong>と、適切なサイズを用意してもらえます。当日になって言うと、間に合わないことがあります。</p>

<h2>おむつ替えと授乳の場所</h2>
<p>観光地やレストランには、おむつ替え台や授乳スペースが<strong>ない場所も少なくありません</strong>。設備が整っているのは大きなショッピングモールです。</p>
<ul>
<li><strong>マイクロネシアモール</strong></li>
<li><strong>GPO（グアム・プレミア・アウトレット）</strong></li>
</ul>
<p>外を歩く予定の途中に、モールを一度挟んでおくと安心です。</p>

<h2>子ども連れで入りやすいお店</h2>
<ul>
<li><strong>シャーリーズ・キッチン</strong> — 日本人の口に合う味付けで、キッズメニューがあります</li>
<li><strong>プロア</strong> — BBQの人気店。子ども連れも多い店です</li>
<li><strong>カフェ・キッチン</strong> — ブランチとスイーツが充実しています</li>
</ul>
<p>人気店は混みます。キッズチェアが必要なら、<strong>席を押さえるときに伝えておく</strong>のが確実です。離乳食の持ち込みができるかどうかも、先に聞いておくと当日困りません。</p>

<h2>1日の組み立て方</h2>
<p>大人の想定より<strong>1つ少なく</strong>。1日に2〜3か所で十分です。</p>
<ul>
<li>午前のうちに外の予定を済ませる（暑くなる前）</li>
<li>昼過ぎは屋内か、宿に戻ってお昼寝</li>
<li>夕方にビーチか買い物</li>
</ul>
<p>予定を1つ落とせる余白を最初から持っておくと、崩れても慌てません。</p>

<h2>持っていくと助かるもの</h2>
<ul>
<li>日焼け止めと帽子 — 日陰の少ない場所が続きます</li>
<li>羽織るもの — 屋内の冷房がかなり強いことがあります</li>
<li>飲み物 — 外にいる時間は想像より長くなります</li>
</ul>

<h2>まとめ</h2>
<p>子ども連れの旅は、回った数ではなく無事に楽しく帰れたかで決まります。チャイルドシートと、おむつ替えできる場所。この2つを先に押さえておけば、あとは流れで何とかなります。</p>
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
