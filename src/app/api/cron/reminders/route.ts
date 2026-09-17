import { listBookings, claimReminder, type BookingRequest } from "@/lib/store";
import { reminderEmail, reminderSummaryEmail } from "@/lib/booking-emails";
import { sendMail } from "@/lib/email";
import { cancelUrl } from "@/lib/cancel-token";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/config";
import { GUAM_UTC_OFFSET_HOURS } from "@/lib/pricing";

// Day-before reminders (owner request 2026-09-17: reduce no-shows on dives,
// jet skis and restaurant tables). Scheduled daily from vercel.json.
//
// Picks every CONFIRMED booking whose date is tomorrow in Guam, sends the guest
// a reminder with a one-click cancellation link, and sends the owner one
// summary of tomorrow's bookings.
//
// 🔴 Each guest gets at most one reminder, however many times this runs.
// claimReminder() is a conditional UPDATE, so a Vercel retry — or anyone
// loading this URL, since it sits outside the admin Basic Auth like
// /api/keep-alive — finds nothing left to claim. That is also why an
// unauthenticated call is tolerated when CRON_SECRET is unset: the worst it
// can do is send tomorrow's reminders a few hours early, once.
//
// Pre-pivot charters (requestType null) are skipped. They end 2026-09-30, and
// their confirmation mail already told the guest when and where.

// 🔵 Schedule "0 23 * * *" in vercel.json is 23:00 UTC = 09:00 the next day in
// Guam, so "tomorrow" below is the day after the guest's morning. The Hobby
// plan fires somewhere within that hour, which is fine for a day-ahead mail.

export const dynamic = "force-dynamic";

// Tomorrow's date in Guam, YYYY-MM-DD. Not exported: a route module may only
// export the handlers and route config.
function guamTomorrow(now: Date = new Date()): string {
  const g = new Date(now.getTime() + GUAM_UTC_OFFSET_HOURS * 3600_000);
  return new Date(Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate() + 1))
    .toISOString()
    .slice(0, 10);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const day = guamTomorrow();
  const due = (await listBookings()).filter(
    (b) =>
      b.status === "confirmed" &&
      b.requestType !== null &&
      // The form always sends "YYYY-MM-DD HH:MM", date first.
      b.preferredDate.trim().split(/\s+/)[0] === day,
  );

  const rows: { booking: BookingRequest; result: "sent" | "failed" | "already" }[] = [];
  for (const b of due) {
    if (!(await claimReminder(b.id))) {
      rows.push({ booking: b, result: "already" });
      continue;
    }
    const mail = reminderEmail(b, cancelUrl(b.id, SITE_URL));
    const { delivered } = await sendMail({ to: b.email, subject: mail.subject, text: mail.text });
    rows.push({ booking: b, result: delivered ? "sent" : "failed" });
  }

  // Only when there is something to say. A daily "nothing tomorrow" mail is the
  // kind the owner learns to ignore, and then misses the day it matters.
  const fresh = rows.filter((r) => r.result !== "already");
  if (fresh.length) {
    const summary = reminderSummaryEmail(day, rows);
    await sendMail({ to: CONTACT_EMAIL, subject: summary.subject, text: summary.text });
  }

  return Response.json({
    ok: true,
    day,
    sent: rows.filter((r) => r.result === "sent").length,
    failed: rows.filter((r) => r.result === "failed").length,
    alreadySent: rows.filter((r) => r.result === "already").length,
  });
}
