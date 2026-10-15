// Shared transactional-email helper.
//
// Wraps Resend so every send behaves the same way, and — exactly like the
// booking-request email in api/booking/route.ts — falls back to logging when
// RESEND_API_KEY is unset (local dev / not-yet-configured), so nothing is lost
// and the flow never breaks just because email isn't set up.

import "server-only";
import { Resend } from "resend";
import { FROM_EMAIL, CONTACT_EMAIL, OWNER_COPY_EMAIL } from "./config";

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  bccOwner?: boolean; // send a copy to the owner (for cancellations etc.)
}): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[EMAIL not configured] to=${opts.to}\nsubject=${opts.subject}\n${opts.text}`,
    );
    return { delivered: false };
  }

  try {
    const resend = new Resend(apiKey);
    // 🔴 Resend does NOT throw on failure — a bad key, an unverified domain and
    // even a network error all come back as `{ error }` (measured 2026-10-15:
    // an invalid key returned `API key is invalid` with no exception). Until
    // this line read `error`, every failed send in the site reported
    // delivered: true, which also disarmed every caller that checks it.
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      bcc: opts.bccOwner ? OWNER_COPY_EMAIL : undefined,
      replyTo: opts.replyTo ?? CONTACT_EMAIL,
      subject: opts.subject,
      text: opts.text,
    });
    if (error) {
      console.error("Email send failed:", { to: opts.to, subject: opts.subject, error });
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    // Never let an email failure break the booking/cancellation flow.
    console.error("Email send failed:", err);
    return { delivered: false };
  }
}
