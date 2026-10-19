// The kinds of request the site takes, and the one place that says what each
// one costs. No imports, so lib/pricing.ts, lib/store.ts and the client form
// can all read it without a cycle.
//
//   tour       — a PARTNER's activity. Free to the guest; the partner pays us a
//                commission. No PayPal.
//   restaurant — we book a table. $10, held on request, captured when the table
//                is held. Not charged if we cannot get it.
//   arrange    — a tour we have NO partnership with (added 2026-10-19, design:
//                MokaruGuam/arrange-design.md). $25 for up to three exchanges
//                with the operator, in English, reported back in Japanese.
//                Held on request, captured when the FIRST report is sent, and
//                charged whether or not a booking comes of it.
//
// 🔴 THREE PROMISES THAT CONTRADICT EACH OTHER sit on one site:
//   restaurant = 取れなければ無料, tour = 無料, arrange = 取れなくても $25.
// Every branch that used to be「restaurant ? … : tour」has to decide where
// arrange goes. Falling into the tour side tells a paying guest「当社への
// お支払いはございません」; falling into the restaurant side tells them
// 「お席が取れた時点で確定」. Neither is true. Use the helpers below rather than
// comparing strings, so the question is asked in one place.

export type RequestType = "tour" | "restaurant" | "arrange";

export const REQUEST_TYPES: readonly RequestType[] = ["tour", "restaurant", "arrange"];

export function isRequestType(v: unknown): v is RequestType {
  return v === "tour" || v === "restaurant" || v === "arrange";
}

// Does this kind of request put a hold on the guest's card when it arrives?
// The gates that refuse a paid request without a hold all read this.
export function isPaidRequest(t: RequestType): boolean {
  return t === "restaurant" || t === "arrange";
}

// USD, flat per request (not per guest — one act of arranging either way).
export const RESTAURANT_FEE = 10;
export const ARRANGE_FEE = 25;

// Most exchanges with the operator one arrange request includes.
// 1 exchange = we ask the operator, get the answer, report it to the guest.
// An unanswered enquiry does not count; mails with the guest never count.
export const ARRANGE_MAX_EXCHANGES = 3;

// How a guest can spend the three exchanges (owner-approved patterns,
// 2026-09-18). A is recommended because it is the only shape that both compares
// and books in one request. E is labelled honestly: three quotes and no booking
// is the pattern most likely to leave a guest feeling the $25 bought nothing.
export const ARRANGE_PATTERNS = [
  { id: "A", title: "2社を比べて、良い方を予約", detail: "①A社に確認 ②B社に確認 ③決めた方に予約", recommended: true },
  { id: "B", title: "1社を詳しく確認して予約", detail: "①空き・料金・条件 ②日程や人数の調整 ③予約", recommended: false },
  { id: "C", title: "同じ日に空いている会社を探す", detail: "①②③ 同じ日程でA社→B社→C社", recommended: false },
  { id: "D", title: "難しい条件が通るか確認", detail: "小さなお子様・持病・妊娠中・車椅子・アレルギーなど", recommended: false },
  { id: "E", title: "3社の見積もりを比べる", detail: "3社に同じ質問。予約はご自身で（当社の予約枠は残りません）", recommended: false },
  { id: "F", title: "貸切・団体の見積もり", detail: "①見積もり ②条件の調整 ③確定", recommended: false },
] as const;

export type ArrangePatternId = (typeof ARRANGE_PATTERNS)[number]["id"];

// What the request is called, to the guest and in the owner's notices.
export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  tour: "ツアー手配（提携先）",
  restaurant: "レストラン予約代行",
  arrange: "ツアーお問い合わせ・予約代行",
};
