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
}

export const PARTNERS: Partner[] = [
  {
    id: "joes-jet-ski",
    company: "Joe's Jet Ski",
    activity: "Two Lovers Point ジェットスキーツアー",
    duration: "約1時間",
    priceFrom: "$134.40〜",
    priceNote: "Joe's Jet Ski の料金（お一人あたり）",
    blurb:
      "恋人岬の沖合をジェットスキーで走るツアーです。初めての方にはスタッフが操作をご案内します。",
  },
  // Added 2026-09-12, after the owner confirmed the agreement is signed.
  //
  // 🟡 NAME: the owner referred to this partner as "Sunny Divers"; their own
  // site brands as GENTLY BLUE / ジェントリーブルー. The site's name is used
  // here, because that is what a guest will see when they look the shop up and
  // what the shop will recognise in a booking request. If the contract is in
  // the other name, this needs changing in both places — here and in the
  // subject line of the mail we send them.
  //
  // Prices and activity names are taken verbatim from gentlyblue.com/top
  // (read 2026-09-12). The shop also runs PADI certification courses — Open
  // Water, Deep, Boat, Buoyancy, Underwater Naturalist — which are not listed
  // here because most carry no published price and a multi-day course is not
  // what a holiday booking request looks like. Ask by email for those.
  {
    id: "gently-blue-intro",
    company: "Gently Blue（ジェントリーブルー）",
    activity: "体験ダイビング（1ビーチダイブ）",
    // 🔴 No duration: the shop does not publish one. Not estimated.
    priceFrom: "$80.00",
    priceNote: "Gently Blue の料金",
    blurb:
      "ライセンスがなくても参加できる体験ダイビングです。ビーチから入るので、初めての方でも落ち着いて潜れます。",
  },
  {
    id: "gently-blue-turtle",
    company: "Gently Blue（ジェントリーブルー）",
    activity: "ウミガメ体験ダイビング（1ビーチ＆1ボート）",
    priceFrom: "$160.00",
    priceNote: "Gently Blue の料金",
    blurb:
      "ビーチとボートを1本ずつ潜る体験ダイビング。ウミガメに会えることを狙ったコースです。",
  },
];
