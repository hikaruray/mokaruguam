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
  duration: string;
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
  // 🟡 Sunny Diver goes here once the agreement is signed — not before.
  // Listing an operator we have no contract with advertises a booking we have
  // no way to honour, and the first guest to request it finds that out for us.
];
