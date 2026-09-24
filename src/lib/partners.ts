// The partner operators we arrange activities with.
//
// WHY THIS IS DATA AND NOT PAGE COPY
// Every entry is a commercial relationship with a real company, and each one
// appears in at least three places: /plans, the request form's prefill, and the
// mail we send the operator. Keeping them in one list means adding a partner is
// one edit, and — more to the point — means a partner we stop working with
// disappears everywhere at once rather than lingering on a page nobody reopened.
//
// 🔴 NEVER LINK TO A PARTNER'S OWN BOOKING PAGE.
// The commission is owed on bookings Mokaru sends. A guest who follows a direct
// link books on their own, and the arrangement earns nothing — we would have
// paid for the traffic and handed away the transaction. Every call to action
// goes to our own form.
//
// 🔴 PRICES ARE THE PARTNER'S, NOT OURS, AND THEY CHANGE.
// Shown as「〜」with the operator named, and every card says the current price
// is confirmed at arrangement time. A partner raising their price must not turn
// this page into a false statement.

import type { PhotoSeed } from "./images";

export interface Partner {
  // Stable key. Used in the ?partner= prefill, so changing one silently breaks
  // any link already published.
  id: string;
  // The operator's name, exactly as they write it.
  company: string;
  // The specific activity we arrange with them.
  activity: string;
  // Optional: only when the operator publishes it. Left out rather than
  // estimated — a duration we guessed would be a promise about someone else's
  // schedule, and the first guest to be kept an hour longer would be right to
  // be annoyed.
  duration?: string;
  // USD, the operator's own price, per person unless noted.
  priceFrom: string;
  priceNote: string;
  blurb: string;
  // Optional: a page of its own at /plans/[id]. Only partners whose facts we
  // have read off their own site get one — the page states age limits and a
  // meeting point, and a guessed one of those sends a family to the wrong
  // beach or turns a 6-year-old away at the dock.
  details?: PartnerDetails;
  // Optional: shown on the request form while the guest is filling it in, as
  // soon as what they typed names this partner. For conditions that turn a
  // family away at the dock (an age minimum), which the form's own fields
  // cannot express — the child bands are 4-11 and 0-3.
  requestNotice?: RequestNotice;
}

export interface RequestNotice {
  // Lower-case fragments; any one appearing in the typed partner field
  // (lower-cased) shows the notice. Includes the activity in plain words
  // (「ジェットスキー」), because a guest who does not know the company name
  // types what they want to do — and we only arrange that one way.
  match: string[];
  lines: string[];
}

export interface PartnerDetails {
  // Only a real Mokaru photo (lib/images.ts), never the operator's: we have no
  // permission to use theirs. So this is usually a photo of the PLACE, and the
  // alt text says so rather than implying it shows the tour.
  photo?: { seed: PhotoSeed; alt: string };
  // What the operator says about itself, attributed as theirs.
  about: string[];
  // The route / what happens on the day.
  course: string[];
  // Each price as the operator lists it, with what it covers.
  prices: { label: string; price: string }[];
  // 🔴 Who can take part. The request form cannot enforce these (its child
  // bands are 4-11 and 0-3, which do not line up with an 8-year minimum), so
  // this page is where a family finds out BEFORE they ask, not at the dock.
  rules: string[];
  meetingPoint: string;
  onTheDay: string[];
  bring: string[];
  // Where the facts came from, and when we read them. Printed on the page so
  // the next person to edit it knows how old they are.
  source: { url: string; readOn: string };
}

export const PARTNERS: Partner[] = [
  // Prices and rules read off joesjetski.com on 2026-09-18 (/two-lovers-point
  // and /about).
  //
  // 🔴 PRICE CORRECTED 2026-09-18. This entry used to say「$134.40〜（お一人あ
  // たり）」, which matched nothing on their site: a single rider is $140.00, and
  // a tandem is $220.00 for the ski — $110 a head, cheaper than the figure we
  // printed as the minimum. Neither reading made it true. $134.40 is $140 less
  // 4%, so it was probably an old web discount. The owner chose the official
  // figures so a guest who checks their site sees the same number we do.
  {
    id: "joes-jet-ski",
    company: "Joe's Jet Ski",
    activity: "Two Lovers Point ジェットスキーツアー",
    duration: "約1時間",
    priceFrom: "$140.00〜",
    priceNote: "Joe's Jet Ski の料金・1人乗り1台。2人乗りは1台 $220.00",
    blurb:
      "恋人岬の沖合をジェットスキーで走るツアーです。運転は14歳から、免許は要りません。8歳から大人と一緒に同乗できます。",
    // 🔴 Added 2026-09-24. The page states the 8-year minimum, but a guest who
    // types「Joe's Jet Ski」straight into the form never sees the page, and
    // the form would take a request for a 3-year-old without a word.
    requestNotice: {
      match: ["joe's", "joes", "joe’s", "ジョーズ", "ジェットスキー", "jet ski", "jetski"],
      lines: [
        "参加できるのは8歳からです。7歳以下のお子様は参加できません。",
        "8〜13歳のお子様は大人と同乗します。運転は14歳から（免許不要）。",
        "1台あたりの体重は合計159kgまでです。",
      ],
    },
    details: {
      photo: {
        seed: "spot-lovers",
        alt: "ツアーの目的地、恋人岬（Mokaru撮影）",
      },
      about: [
        "グアムで最も長く続く、リーフの外に出るツアー会社だと同社は説明しています。家族経営の会社です。",
        "米国沿岸警備隊（USCG）の免許を持つ船長が複数在籍し、スタッフ全員が水上安全の資格を持っている、とのことです。",
      ],
      course: [
        "アガニア湾から、タモン湾の北端にある恋人岬（Two Lovers Point）まで、往復約16kmを走ります。",
        "タモン湾とガンビーチの沖を抜けて、恋人岬の真下の海へ。天候が良ければ、恋人岬の前で海に入って泳ぐこともできます。",
        "イルカやウミガメ、トビウオが見られることもあります（見られるとは限りません）。",
      ],
      prices: [
        { label: "1人乗り（1台・大人14歳以上）", price: "$140.00" },
        { label: "2人乗り（1台に2名・大人14歳以上）", price: "$220.00" },
      ],
      rules: [
        "参加できるのは8歳からです。7歳以下のお子様は参加できません。",
        "8〜13歳のお子様は、18歳以上の大人と同乗します（お子様の運転はできません）。",
        "運転できるのは14歳からです。免許は要りません。",
        "1台あたりの体重は合計159kg（350ポンド）までです。",
        "飲酒しての参加はできません（同社は一切認めていません）。",
        "8〜13歳のお子様の料金は、公式サイトに記載がないため手配時にご案内します。",
      ],
      meetingPoint:
        "ザ・ピンクホテル（The Pink Hotel）のビーチ側。Kanton Tasi Rd, Tamuning。ホテルからの送迎は公式サイトに記載がありません。",
      onTheDay: [
        "予約時刻の10分前までにお越しください。",
        "同意書の記入と説明に、ツアー時間とは別に約20分かかります。",
        "予約時刻から30分以上遅れると、枠がなくなります。",
        "無料のロッカーがあります。",
      ],
      bring: [
        "タオル",
        "水着、または濡れてもよい服（ボタンやファスナーのないもの）",
        "あると便利：マリンシューズ、日焼け止め、防水のスマホケース・カメラ",
      ],
      source: {
        url: "https://www.joesjetski.com/two-lovers-point",
        readOn: "2026-09-18",
      },
    },
  },
  // Added 2026-09-12, after the owner confirmed the agreement is signed.
  //
  // NAME: the owner also refers to this partner as "Sunny Divers", but confirmed
  // on 2026-09-12 that Gently Blue is the name to use. It is what their own site
  // brands as, what a guest sees when they look the shop up, and what the shop
  // will recognise in a booking request — so it is also the name that belongs in
  // the subject line of the mail we send them.
  //
  // Prices and activity names are taken verbatim from gentlyblue.com/top
  // (read 2026-09-12), and the owner confirmed they are per person. The shop
  // also runs PADI certification courses — Open Water, Deep, Boat, Buoyancy,
  // Underwater Naturalist — which are not listed here because most carry no
  // published price and a multi-day course is not what a holiday booking
  // request looks like. Ask by email for those.
  {
    id: "gently-blue-intro",
    company: "Gently Blue（ジェントリーブルー）",
    activity: "体験ダイビング（1ビーチダイブ）",
    // 🔴 No duration: the shop does not publish one. Not estimated.
    priceFrom: "$80.00",
    priceNote: "Gently Blue の料金（お一人あたり）",
    blurb:
      "ライセンスがなくても参加できる体験ダイビングです。ビーチから入るので、初めての方でも落ち着いて潜れます。",
  },
  {
    id: "gently-blue-turtle",
    company: "Gently Blue（ジェントリーブルー）",
    activity: "ウミガメ体験ダイビング（1ビーチ＆1ボート）",
    priceFrom: "$160.00",
    priceNote: "Gently Blue の料金（お一人あたり）",
    blurb:
      "ビーチとボートを1本ずつ潜る体験ダイビング。ウミガメに会えることを狙ったコースです。",
  },
];

// What the request form is prefilled with when a guest arrives from /plans.
//
// 🔴 Company AND activity, not the company alone. It used to pass only
// `company`, which was harmless while each operator had one activity — and
// stopped being harmless the day Gently Blue was added with two. A request
// reading「Gently Blue（ジェントリーブルー）」does not say whether the guest
// wants the $80 beach dive or the $160 turtle dive, and the mail we send the
// shop would have had to guess.
//
// The separator is a full-width slash so partnerCompany() in booking-emails
// can take the company back off the front for the subject line.
export function partnerRequestLabel(p: Partner): string {
  return `${p.company}／${p.activity}`;
}

// Partners that have a page of their own (/plans/[id]).
export const PARTNERS_WITH_PAGE = PARTNERS.filter(
  (p): p is Partner & { details: PartnerDetails } => p.details !== undefined,
);

// The partner whose notice applies to what the guest typed, if any.
export function partnerNoticeFor(
  typed: string,
): (Partner & { requestNotice: RequestNotice }) | undefined {
  const t = typed.toLowerCase();
  if (!t.trim()) return undefined;
  return PARTNERS.find(
    (p): p is Partner & { requestNotice: RequestNotice } =>
      p.requestNotice !== undefined &&
      p.requestNotice.match.some((m) => t.includes(m)),
  );
}

export function getPartnerWithPage(
  id: string,
): (Partner & { details: PartnerDetails }) | undefined {
  return PARTNERS_WITH_PAGE.find((p) => p.id === id);
}
