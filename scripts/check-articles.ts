// Checks that no restored article still sells a service we do not run.
//
//   npm run check:articles
//
// WHY THIS EXISTS
// The charter ends 2026-09-30. Ninety-one WordPress articles were written
// while it was the whole business, and they are 84% of the traffic this site
// gets, so they are being kept and corrected rather than deleted. Every one of
// those corrections is a hand-written find/replace, and the work was done in
// four passes across 2026-07-19 and 2026-09-12/17.
//
// Three of those four passes shipped believing they were finished. What
// actually happened each time:
//
//   • 09-12 swept for the product's OWN vocabulary — 貸切, チャーター, 専属,
//     Shortプラン — and reported zero. Grepping instead for the bare brand name
//     found 85 mentions across 32 articles, a third of them still selling a
//     tour: 「Mokaruのカスタマイズツアーならご案内できます」,「Mokaruの送迎で
//     効率よく観光」,「09:00 ホテル発（Mokaruの送迎でラクラク移動）」.
//   • Removing the CONTENTS of a section and leaving the FRAME happened five
//     separate times. bus-rentacar rendered a heading「④ Mokaruの送迎で効率よく
//     観光」above a subheading「Mokaruの送迎サービスのメリット」with nothing
//     between them. transportation opened by promising a comparison that had
//     been deleted three commits earlier.
//   • A correction goes stale in BOTH directions. July's corrections rewrote
//     old prices into the then-current rate card, and rewrote「24時間対応」into
//    「LINEでご相談ください」— right in July, wrong from October. One of them
//     ran the other way and suppressed「レストランの予約代行」, which is now the
//     main product.
//
// The lesson is not "be more careful". It is that a human sweep cannot be the
// last line of defence for 91 articles, because the thing you sweep for is
// chosen by the same person who already missed it.
//
// 🔴 WHAT THIS CHECKS, AND WHAT IT DOES NOT
// It renders every live article through the real getLegacyArticle() — snapshot,
// corrections, rewrites, cleanHtml, all of it — and asserts that a fixed list
// of phrases does not appear. It is a floor, not a proof. A page can pass this
// and still read as though we drive people around. What it does guarantee is
// that the specific claims we have already had to remove cannot come back,
// including by someone re-exporting the snapshot or reverting a correction.
//
// No server, no database, no build. Run it after touching legacy-corrections.ts,
// legacy-rewrites.ts, legacy-articles.ts or legacy-content.json.

import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const lib = join(dirname(import.meta.dirname), "src", "lib");
const load = (name: string) => import(pathToFileURL(join(lib, name)).href);

const { LEGACY_SLUGS, getLegacyArticle } = await load("legacy-articles.ts");

interface Article {
  slug: string;
  title: string;
  html: string;
}

const get = getLegacyArticle as (slug: string) => Article | undefined;
const slugs = LEGACY_SLUGS as readonly string[];

let failed = 0;
function check(ok: boolean, label: string, detail: string) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${detail}`);
}

/**
 * One sentence that is allowed to contain an otherwise banned phrase.
 *
 * 🔴 Deliberately NOT a list of exempt slugs. An exempt slug would go on
 * excusing that article forever, including the next present-tense claim
 * somebody adds to it. This excuses one exact sentence: every OTHER occurrence
 * of the phrase in that same article still fails.
 */
interface Allowance {
  slug: string;
  /** The exact sentence. The phrase is only excused where it appears here. */
  sentence: string;
  why: string;
}

// Each entry is a phrase that must not survive anywhere in a live article,
// with the reason it was removed. The reason is the point — a phrase without
// one is a phrase the next person will delete when it gets in their way.
const BANNED: [phrase: string, why: string, allow?: Allowance[]][] = [
  // The charter itself. Present tense, in our own voice.
  ["Mokaruの送迎", "自社の送迎。2026-09-30で終了する。"],
  ["Mokaru送迎", "同上（1日ルートの行程表に混ざっていた書き方）。"],
  ["Mokaruの専用", "「Mokaruの専用車」「Mokaruの専用送迎サービス」。車を出さなくなる。"],
  ["Mokaruのカスタマイズツアー", "自社が組んで運行するツアー。"],
  ["Mokaruのカスタムツアー", "同上。"],
  ["Mokaruのショッピングツアー", "同上。同行して案内する前提。"],
  ["Mokaruのプライベートツアー", "同上。"],
  ["Mokaruの貸切", "同上。"],
  ["貸切ガイド付き", "「グアム 貸切ガイド付きプライベートツアー」。SEOキーワードとして本文と見出しに埋まっていた。"],
  [
    "専用車",
    "自社の車。10/1以降は持たない。",
    [
      {
        slug: "mokaru-vision",
        sentence: "2026年9月30日まで、私たちは日本語ガイドと専用車による貸切ツアーを運行していました。",
        why: "過去形。何をやめたのかを書いてある文で、これを消すと転換の説明そのものが消える。",
      },
    ],
  ],

  // Perks attached to the vehicle.
  ["チャイルドシート完備", "自社の車の装備。グアムの法律（6歳未満は義務）という事実の記述は別で、そちらは残してある。"],
  ["ベビーカー無料", "無料貸出。車がないので貸せない。"],

  // The support line. Withdrawn 2026-09-12; /privacy keeps one deliberate
  // mention of it, and /privacy is not a legacy article.
  ["LINE", "LINEサポートは提供しない。予約導線もLINEだった。記事本文には1件も残さない。"],
  ["24時間サポート", "24時間の対応を約束していた。"],
  [
    "24時間対応",
    "同上。",
    [
      {
        slug: "hyattregency",
        sentence: "24時間対応のフロント＆セキュリティで安心",
        why: "ホテルのフロントの話。当社の約束ではない。",
      },
    ],
  ],

  // Prices from a rate card that stops existing.
  ["$170", "旧チャーターの料金。商品ごと終了する。"],
  ["$230", "同上（Middleプラン5時間）。"],
  ["$345", "同上。"],
  ["Shortプラン", "終了するプラン名。"],
  ["Middleプラン", "同上。"],
  ["Totalプラン", "同上。"],
];

console.log(`\n--- ${slugs.length} live articles, ${BANNED.length} banned phrases ---`);

const hits = new Map<string, string[]>();
const staleAllowances: string[] = [];
let scanned = 0;

for (const slug of slugs) {
  const a = get(slug);
  if (!a) {
    check(false, `article renders: ${slug}`, "getLegacyArticle returned undefined");
    continue;
  }
  scanned++;
  // Title and body both. Two of the worst offenders were TITLES, which is also
  // what search results show, so checking only the body would have missed them.
  const text = `${a.title}\n${a.html}`;

  for (const [phrase, , allow] of BANNED) {
    if (!text.includes(phrase)) continue;

    // Blank out each allowed sentence, then look again. What is left is an
    // occurrence nobody signed off on.
    let rest = text;
    for (const a2 of allow ?? []) {
      if (a2.slug !== slug) continue;
      if (!rest.includes(a2.sentence)) {
        // 🔴 The allowance no longer matches the article. Same contract as a
        // correction's asserted count: an exception that quietly stops
        // applying is worse than no exception, because the file still reads as
        // though someone reviewed this sentence.
        staleAllowances.push(`${slug}: "${a2.sentence.slice(0, 40)}…"`);
        continue;
      }
      rest = rest.split(a2.sentence).join("");
    }
    if (!rest.includes(phrase)) continue;

    const list = hits.get(phrase) ?? [];
    list.push(slug);
    hits.set(phrase, list);
  }
}

check(scanned === slugs.length, "every live slug renders", `${scanned}/${slugs.length}`);
check(
  staleAllowances.length === 0,
  "every allowance still matches its article",
  staleAllowances.length === 0 ? "clean" : staleAllowances.join(" | "),
);

for (const [phrase, why] of BANNED) {
  const found = hits.get(phrase);
  check(
    found === undefined,
    `no article says "${phrase}"`,
    found === undefined ? "clean" : `${found.length} article(s): ${found.join(", ")}  [${why}]`,
  );
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
