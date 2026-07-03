import { Resend } from "resend";
import { FROM_EMAIL, CONTACT_EMAIL, OWNER_COPY_EMAIL } from "@/lib/config";
import { addBooking } from "@/lib/store";
import { PLANS } from "@/lib/pricing";

// Receives a booking REQUEST (not a payment — Stripe is a future phase).
// Saves it to the Admin store, then emails the business. If Resend isn't
// configured yet, the request is logged server-side so nothing is lost.
export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    planId?: string;
    preferredDate?: string;
    guests?: number;
    spots?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { name, email, phone, planId, preferredDate, guests, spots, notes } = body;

  if (!name || !email || !phone || !preferredDate || !guests) {
    return Response.json(
      { error: "必須項目（お名前・連絡先・希望日・人数）をご入力ください。" },
      { status: 400 },
    );
  }

  const plan = PLANS.find((p) => p.id === planId);
  const planName = plan ? plan.name : "（未選択）";

  let saved;
  try {
    saved = await addBooking({
      name,
      email,
      phone,
      planId: planId ?? "",
      planName,
      preferredDate,
      guests: Number(guests),
      spots: spots?.trim() ?? "",
      notes: notes?.trim() ?? "",
    });
  } catch (err) {
    console.error("Failed to save booking:", err);
    return Response.json(
      { error: "送信できませんでした。時間をおいて再度お試しください。" },
      { status: 503 },
    );
  }

  const subject = `【リクエスト予約】${name} 様／${planName}`;
  const text = [
    `新しいリクエスト予約が入りました。`,
    ``,
    `お名前:   ${name}`,
    `連絡先:   ${email} / ${phone}`,
    `プラン:   ${planName}`,
    `希望日時: ${preferredDate}`,
    `人数:     ${guests}名`,
    `行きたいスポット:`,
    spots?.trim() || "（記入なし）",
    ``,
    `その他ご要望:`,
    notes?.trim() || "（なし）",
    ``,
    `受付ID: ${saved.id}`,
    `— Mokaru Guam サイトのリクエストフォームより`,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;

  // Until the sending key is configured at launch, log so nothing is lost.
  if (!apiKey) {
    console.log("[BOOKING REQUEST — email sending not configured yet]\n" + text);
    return Response.json({ ok: true, delivered: false });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      bcc: OWNER_COPY_EMAIL,
      replyTo: email,
      subject,
      text,
    });
    return Response.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("Failed to send booking email:", err);
    // The request is already saved to the store, so report success to the user;
    // the owner can still see it in the Admin dashboard.
    return Response.json({ ok: true, delivered: false });
  }
}
