import { listBookings, refLabel, requestTypeOf, type BookingRequest } from "@/lib/store";
import { isPaidRequest } from "@/lib/request-types";
import { sendMail } from "@/lib/email";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/config";

// Backstop for requests nobody has acted on (2026-10-15 audit, item 4).
//
// WHY: a new request reaches the owner as ONE email. If that email does not
// arrive — and until 2026-10-15 a failed send was indistinguishable from a sent
// one — the request sits in Admin unseen. For a restaurant request that is
// worse than slow: the guest has a $10 hold on their card that PayPal only
// guarantees for about three days, and they were told they would hear from us
// within 48 hours. Same idea as GuamJobs' /api/cron/pending-review.
//
// WHAT: every request still `pending` after STALE_HOURS is listed in one mail
// to tour@ (BCC the owner). Restaurant requests whose hold is getting old are
// marked, because past the guarantee the 確定 can fail and the guest has to go
// through /repay. Sent on every run while the list is not empty — there is
// deliberately no "already notified" flag: a reminder that stops after one
// missed email is the failure this exists to catch.
//
// Twice a day from vercel.json (Hobby plan: one run per entry per day).
// The response carries counts only — this URL is reachable without the admin
// password when CRON_SECRET is unset, so it must not return names or emails.

export const dynamic = "force-dynamic";

const STALE_HOURS = 6;
// PayPal guarantees an authorization's funds for about 3 days (the "honor
// period"). Warn a day before.
const HOLD_WARN_HOURS = 48;

function hoursSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 3600_000;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const stale = (await listBookings()).filter(
    (b) =>
      b.status === "pending" &&
      // Pre-pivot charters are not arranged by anyone any more.
      b.requestType !== null &&
      hoursSince(b.createdAt, now) >= STALE_HOURS,
  );

  if (stale.length === 0) {
    return Response.json({ ok: true, pending: 0, sent: false });
  }

  // Oldest first: the one closest to losing its hold is the one to do now.
  stale.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const holdAtRisk = (b: BookingRequest) =>
    // Arrange (2026-10-19) holds $25 the same way and loses it the same way.
    isPaidRequest(requestTypeOf(b)) &&
    b.payment === "authorized" &&
    hoursSince(b.createdAt, now) >= HOLD_WARN_HOURS;
  const atRisk = stale.filter(holdAtRisk).length;

  const lines = stale.map((b) => {
    const h = Math.floor(hoursSince(b.createdAt, now));
    const kind = { restaurant: "レストラン", tour: "ツアー", arrange: "提携外ツアー" }[requestTypeOf(b)];
    const flag = holdAtRisk(b)
      ? "  🔴 カードのお預かりの保証（約3日）が近い／過ぎている"
      : b.payment === "expired"
        ? "  🔴 お預かり期限切れ（/repay の案内が必要）"
        : "";
    return `・${refLabel(b)}  ${kind}  ${b.partnerName || b.planName}  ${b.preferredDate}  受付から${h}時間${flag}`;
  });

  const subject =
    `【要対応】未処理のご依頼が${stale.length}件あります` +
    (atRisk > 0 ? `（うち${atRisk}件はお預かり期限が近い）` : "");
  const text = [
    `受付から${STALE_HOURS}時間以上たっても「確定」「お断り」になっていないご依頼です。`,
    `お客様には「48時間以内に状況をご連絡します」とお伝えしています。`,
    ``,
    ...lines,
    ``,
    `管理画面: ${SITE_URL}/admin`,
    ``,
    `— このメールは、未処理のご依頼がある間は1日2回届きます。`,
  ].join("\n");

  const { delivered } = await sendMail({
    to: CONTACT_EMAIL,
    subject,
    text,
    bccOwner: true,
  });

  return Response.json({ ok: true, pending: stale.length, atRisk, sent: delivered });
}
