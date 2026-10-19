// Copy written for AI search (ChatGPT, Perplexity, Google's AI Overviews,
// Claude) — added 2026-10-19.
//
// WHY
// Those tools answer a question by quoting a few sentences from a page. They
// quote whatever is easiest to lift, and on 2026-10-19 the easiest thing to
// lift about us was wrong: the Bing-side index (which ChatGPT search reads)
// still held the home page and /about as they were before 10/1 —「グアム完全
// 貸切ガイドチャーター…3時間 $170〜」, a service that ended on 2026-09-30.
// /llms.txt gives them one short, current page about who we are and what we
// charge; the article summaries give them a short answer at the top of an
// article instead of a 110-character cut from its first paragraph.
//
// 🔴 NOTHING HERE IS NEW COPY ABOUT MONEY OR TERMS.
// Every sentence about the service, the fee, refunds or cancellation is copied
// verbatim from a page that already says it — /legal is the governing text,
// /faq and /about say the same in plainer words — and `source` names the file.
// check:articles opens that file and fails if the sentence is no longer in it.
// So when /legal or /faq is reworded (the $25 non-partner tour service will do
// exactly that), this file fails the check instead of quietly repeating the old
// terms to every AI that reads it. Fix it by copying the NEW sentence here, not
// by loosening the check.
//
// Facts that live in code (company details, the fee, the partner cancellation
// line, the restaurant and partner lists) are read from their constants, so
// they cannot drift at all.
import { COMPANY, CONTACT_EMAIL, PARTNER_CANCEL_POLICY, SITE_NAME, SITE_URL } from "./config";
import { RESTAURANTS } from "./restaurants";
import { PARTNERS, PARTNERS_WITH_PAGE } from "./partners";

/**
 * A sentence quoted from a page. `source` is the file it must appear in,
 * verbatim. `q` is the FAQ question it answers, for an answer that does not
 * make sense on its own (「料金はいただきません。」— when?).
 */
export interface Quoted {
  text: string;
  source:
    | "src/app/legal/page.tsx"
    | "src/app/faq/page.tsx"
    | "src/app/about/page.tsx"
    | "src/app/dining/page.tsx";
  q?: string;
}

export const SUMMARY_LINE: Quoted = {
  text: "グアムのレストランのご予約と、アクティビティ・ツアーのお手配を代行します。グアム在住の日本人スタッフが、お客様に代わってお店や実施会社とやり取りします。渡航前に、日本語だけで手配が終わります。",
  source: "src/app/faq/page.tsx",
};

// Past tense, and the reason it is here: the stale index entries describe the
// charter as current, so the page an AI reads instead has to say it ended.
// check:articles excuses「専用車」in this one sentence only, the same way it
// excuses the identical sentence in the mokaru-vision article.
export const ENDED_SERVICE_LINE: Quoted = {
  text: "2026年9月30日までは、日本語ガイドと専用車による貸切ツアーを運行していました。",
  source: "src/app/about/page.tsx",
};

export const SERVICE_LINES: Quoted[] = [
  {
    text: "グアムのレストラン予約代行、アクティビティ・ツアーの手配（提携する実施会社のご紹介）、および提携していない実施会社のツアーのお問い合わせ・予約代行。",
    source: "src/app/legal/page.tsx",
  },
  {
    text: "当社は手配を代行する立場であり、ツアーの実施者ではありません。ツアーに関する契約は、お客様と実施会社との間に成立します。",
    source: "src/app/legal/page.tsx",
  },
  ENDED_SERVICE_LINE,
];

export const PRICE_LINES: Quoted[] = [
  {
    text: "レストランの予約代行は1件 $10（手配料）です。人数にかかわらず同額で、お食事代は当日お店へ直接お支払いください。提携先のアクティビティ・ツアーの手配は、当社へのお支払いはありません。ツアー代金は当日、実施会社へお支払いください。掲載のないツアーのお問い合わせ・予約代行は1件 $25（代行料）です。",
    source: "src/app/faq/page.tsx",
  },
  {
    q: "お店の予約が取れなかった場合はどうなりますか？",
    text: "料金はいただきません。ご依頼時にカードへお預かり（仮押さえ）しますが、お取りできなかった場合は解除しますので、請求は発生しません。",
    source: "src/app/faq/page.tsx",
  },
  {
    text: "PayPal（クレジット／デビットカード。PayPalアカウントなしでもカード決済いただけます）。レストラン予約代行、およびお問い合わせ・予約代行のみ。",
    source: "src/app/legal/page.tsx",
  },
];

// The $25 non-partner tour enquiry (2026-10-19), in the FAQ's own words.
export const ARRANGE_LINE: Quoted = {
  q: "サイトに載っていないツアーも頼めますか？",
  text: "はい。「お問い合わせ・予約代行」（1件 $25）で、ご希望のツアー会社へ当社が英語で問い合わせ、日本語でご報告します。実施会社とのやりとりは最大3回までで、1回＝問い合わせて返事を受け取り、お客様にご報告するまでです。現地払いのツアーならご予約までお取りします。ご予約の成立は保証できず、取れなかった場合も代行料はかかります（1回目のご報告の前に取りやめる場合は無料）。提携先で叶う内容なら、先に提携先（無料）をご案内します。",
  source: "src/app/faq/page.tsx",
};

export const CANCEL_LINES: Quoted[] = [
  {
    text: "レストランの予約代行は、お席のお手配が完了する前であればお預かりを解除し、料金は発生しません。お手配の完了後にお客様のご都合でキャンセルされる場合は、手配料のご返金はいたしかねます（お席を確保する作業が完了しているためです）。お店へのキャンセルのご連絡は当社が代行します。提携先のツアーの手配は当社へのお支払いがないため、当社のキャンセル料は発生しません。掲載のないツアーのお問い合わせ・予約代行は、1回目のご報告の前であれば料金は発生せず、ご報告のあとは代行料のご返金はいたしかねます。ツアーそのもののキャンセルは実施会社の規定に従います。",
    source: "src/app/faq/page.tsx",
  },
  {
    text: "お店側の都合・当社都合による場合は全額返金します。",
    source: "src/app/legal/page.tsx",
  },
];

export const FLOW_LINES: Quoted[] = [
  {
    text: "ご依頼後、48時間以内に手配の状況をご連絡します。",
    source: "src/app/legal/page.tsx",
  },
  {
    text: "1〜7名まで、フォームからご依頼いただけます。8名以上は別途お見積りとなりますので、メールでご相談ください。",
    source: "src/app/faq/page.tsx",
  },
];

export const GUIDE_LINE: Quoted = {
  q: "当日、現地でガイドは同行しますか？",
  text: "同行しません。当社は手配を代行する立場です。",
  source: "src/app/faq/page.tsx",
};

// Under the list of restaurants: the list is not the limit.
export const OTHER_RESTAURANTS_LINE: Quoted = {
  text: "ここに載っていないお店でも、グアムのレストランならご依頼いただけます。お店が決まっていなければ、ご予算と食べたいものを書いてお送りください。",
  source: "src/app/dining/page.tsx",
};

export const ALL_QUOTED: Quoted[] = [
  SUMMARY_LINE,
  ...SERVICE_LINES,
  ...PRICE_LINES,
  ARRANGE_LINE,
  ...CANCEL_LINES,
  ...FLOW_LINES,
  GUIDE_LINE,
  OTHER_RESTAURANTS_LINE,
];

const url = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);

/** Body of /llms.txt (https://llmstxt.org format: H1, blockquote, H2 link lists). */
export function llmsTxt(): string {
  const lines = (qs: Quoted[]) => qs.map((q) => (q.q ? `- ${q.q} → ${q.text}` : `- ${q.text}`));
  return [
    `# ${SITE_NAME}（モカルグアム）`,
    "",
    `> ${SUMMARY_LINE.text}`,
    "",
    "## サービス",
    ...lines(SERVICE_LINES),
    "",
    "## 料金・お支払い",
    ...lines([...PRICE_LINES, ARRANGE_LINE]),
    "",
    "## キャンセル・返金",
    ...lines(CANCEL_LINES),
    `- 提携先のアクティビティ・ツアー：${PARTNER_CANCEL_POLICY}`,
    "",
    "## ご依頼の流れ",
    ...lines([...FLOW_LINES, GUIDE_LINE]),
    "",
    "## 主なページ",
    `- [できること・料金](${url("/plans")})`,
    `- [Mokaruおすすめのレストラン](${url("/dining")})`,
    `- [ご依頼の流れ・キャンセルについて](${url("/guide")})`,
    `- [よくある質問](${url("/faq")})`,
    `- [特定商取引法に基づく表記](${url("/legal")})：料金・キャンセル・返金の正式な表記`,
    `- [ご依頼フォーム](${url("/reserve")})`,
    "",
    "## 予約を代行するレストラン",
    ...RESTAURANTS.map(
      (r) =>
        `- [${r.nameJa}（${r.name}）](${url(`/dining/${r.id}`)})：${r.genre}・${r.area}` +
        (r.bookingNote ? `。${r.bookingNote}` : ""),
    ),
    ...lines([OTHER_RESTAURANTS_LINE]),
    "",
    "## 手配できる提携先のツアー",
    // Every partner, linked to its own page where it has one and to /plans
    // (where all of them are listed) where it does not.
    ...PARTNERS.map((p) => {
      const path = PARTNERS_WITH_PAGE.some((w) => w.id === p.id) ? `/plans/${p.id}` : "/plans";
      return `- [${p.activity}](${url(path)})：${p.company}`;
    }),
    "",
    "## 運営者",
    `- 正式社名：${COMPANY.legalName}`,
    `- 所在地：${COMPANY.address}`,
    `- お問い合わせ：${CONTACT_EMAIL}（メールで承ります）`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Article summaries
// ---------------------------------------------------------------------------
// A short answer shown at the top of a restored article and used as its meta
// description. Each line is the article's OWN wording (its まとめ), so this is
// a move, not a rewrite — check:articles asserts every line still appears in
// the article's text. Add articles one at a time, highest-traffic first
// (MokaruGuam/seo-baseline-2026-10-09.md), and only ones that already state a
// clear answer. Not foreign-exchange: its ranking table and its conclusion
// disagree about what comes first, and a summary would have to pick one.
export const ARTICLE_SUMMARIES: Record<string, { heading: string; lines: string[] }> = {
  tipping: {
    heading: "グアムのチップの目安",
    lines: [
      "レストラン：料金の15〜20％（サービス料込みの場合は不要）",
      "テイクアウト：基本不要（気持ちで$1程度はOK）",
      "タクシー：料金の10〜15％",
      "日本人ガイド：半日$10〜20／1日$20〜40程度（グループ単位）",
    ],
  },
};

export function articleSummaryFor(slug: string) {
  return ARTICLE_SUMMARIES[slug];
}

/** The summary as one line, for the meta description. */
export function summaryDescription(slug: string): string | undefined {
  const s = ARTICLE_SUMMARIES[slug];
  return s ? `${s.heading}：${s.lines.join("／")}。` : undefined;
}
