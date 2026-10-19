import {
  getBooking,
  setBookingStatus,
  setBookingPayment,
  setBookingPartnerName,
  chargedAmount,
  requestTypeOf,
} from "@/lib/store";
import {
  captureAuthorization,
  voidAuthorization,
  isPaypalConfigured,
  PaypalApiError,
} from "@/lib/paypal";
import { cancelBooking } from "@/lib/booking-actions";
import { isPaidRequest } from "@/lib/request-types";
import { sendMail } from "@/lib/email";
import {
  confirmedEmail,
  firstReportEmail,
  declinedEmail,
  partnerDispatchEmail,
  waitingEmail,
  proposalEmail,
} from "@/lib/booking-emails";
import { repayUrl } from "@/lib/cancel-token";
import { SITE_URL } from "@/lib/config";

// Update a booking's status from the Admin dashboard, and drive the matching
// PayPal action (booking-payment-design.md: authorize → capture/void/refund).
//
//   confirm     → 予約確定   : capture the authorization (決済確定)
//   report      → 1回目の報告を送った : capture, for arrange only (2026-10-19).
//                 The arrange fee is captured when the work has started, not
//                 when a booking is made — there may never be one. It sends
//                 firstReportEmail, never confirmedEmail「お手配が完了しました」.
//   decline     → お断り     : void the authorization (仮押さえ解除・課金なし)
//   cancel      → キャンセル : refund per the 3-tier policy (実施日基準)
//   cancel-full → キャンセル : full refund (天候不良・自社都合の中止)
//   dispatch    → 送客メール : send the booking request to the partner/restaurant
//                               (no status or money change; see below)
//
// cancel / cancel-full share their logic with the customer self-service route
// via lib/booking-actions.ts. Protected by Basic Auth (src/proxy.ts).

export async function POST(request: Request) {
  let body: {
    id?: string;
    action?: string;
    to?: string; // dispatch: the partner's or restaurant's address
    proposal?: string; // status-proposal: the alternative we suggest
    venue?: string; // confirm: the restaurant actually booked, if not the first choice
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, action } = body;
  const valid = [
    "confirm",
    "report",
    "decline",
    "cancel",
    "cancel-full",
    "dispatch",
    "status-waiting",
    "status-proposal",
  ];
  if (!id || !action || !valid.includes(action)) {
    return Response.json({ error: "Bad parameters." }, { status: 400 });
  }

  // Cancellation (with policy/full refund) is shared with the customer route.
  if (action === "cancel" || action === "cancel-full") {
    try {
      const result = await cancelBooking(
        id,
        action === "cancel-full" ? "full" : "policy",
      );
      if (!result) {
        return Response.json({ error: "Booking not found." }, { status: 404 });
      }
      return Response.json({
        ok: true,
        refund: result.refund,
        mailDelivered: result.mailDelivered,
      });
    } catch (err) {
      console.error("Cancel failed:", err);
      return Response.json(
        { error: "決済処理に失敗しました。もう一度お試しください。" },
        { status: 502 },
      );
    }
  }

  // confirm / decline
  const booking = await getBooking(id);
  if (!booking) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  // 🔴 Guard: confirm and decline only act on a booking still waiting.
  //
  // Neither used to look at status at all. The Admin UI only offers these
  // buttons on a pending row, so the way in is a stale screen: the guest
  // cancels in one tab while the owner has the list open in another. Pressing
  // 確定 then moved a cancelled booking to confirmed and sent the guest
  // 「お手配が完了しました」— for something they had called off, in an email
  // that cannot be taken back.
  if (booking.status !== "pending") {
    const state = { confirmed: "確定済み", declined: "お断り済み", cancelled: "キャンセル済み" }[
      booking.status
    ];
    return Response.json(
      {
        error: `この依頼は既に${state}です。画面を再読み込みしてから操作してください。`,
      },
      { status: 409 },
    );
  }

  // --- dispatch: the request mail to the partner or restaurant -----------
  //
  // Changes nothing about the booking. It is its own action rather than a side
  // effect of 確定 because the order on the ground is the other way round: we
  // ask the operator first, and confirm to the guest once they say yes.
  //
  // 🔴 No record of the send is kept on the row. There is no column for it and
  // adding one means another migration the owner runs by hand before 10/1. The
  // owner is BCC'd instead, so their inbox holds every request exactly as the
  // partner received it — which is also the copy that matters when the
  // commission is reconciled. Pressing it twice sends twice.
  if (action === "dispatch") {
    const to = typeof body.to === "string" ? body.to.trim() : "";
    if (!to || to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return Response.json(
        { error: "送信先のメールアドレスを確認してください。" },
        { status: 400 },
      );
    }
    // Charters taken before the pivot were run by us. There is nobody to send
    // them to, and a mail headed「予約依頼」about one would be a request to a
    // stranger to run our tour.
    if (booking.requestType === null) {
      return Response.json(
        { error: "2026-09-30以前の貸切予約は送客の対象ではありません。" },
        { status: 409 },
      );
    }
    // 🔴 Design §6-4-1: the hold must exist BEFORE the restaurant is asked.
    // Asking first and finding the hold dead afterwards is the one outcome with
    // no good exit — a table held in the guest's name and a fee we can no
    // longer take. The confirm gate already refuses that state; this is the
    // same rule one step earlier, where it actually prevents the booking.
    if (requestTypeOf(booking) === "restaurant" && booking.payment !== "authorized") {
      return Response.json(
        {
          error:
            booking.payment === "expired"
              ? `カードのお預かりが期限切れです。お店へご依頼する前に、お客様に下記のリンクから再度のお手続きをご案内してください。\n${repayUrl(booking.id, SITE_URL)}`
              : "この依頼にはカードのお預かりがありません。お店へご依頼する前にお支払い状況をご確認ください。",
        },
        { status: 409 },
      );
    }
    // 🔴 Arrange is enquired by the owner by hand, in English, from the tour@
    // Gmail. That sent folder is how the three exchanges are counted and shown
    // to the guest (design 2026-09-18), and this template is a booking request
    // in a partner's format — wrong for a company we have no agreement with.
    if (requestTypeOf(booking) === "arrange") {
      return Response.json(
        {
          error:
            "提携外ツアーの依頼は送客メールを使いません。tour@ の Gmail から実施会社へ英語で直接お問い合わせください（送信履歴が回数の根拠になります）。",
        },
        { status: 409 },
      );
    }
    const mail = partnerDispatchEmail(booking);
    const { delivered } = await sendMail({
      to,
      subject: mail.subject,
      text: mail.text,
      bccOwner: true,
    });
    // sendMail never throws, so a failed send would otherwise look like a
    // sent one — and the owner would wait for an answer to a mail that does
    // not exist while the hold runs down.
    if (!delivered) {
      return Response.json(
        { error: "送客メールを送信できませんでした。時間をおいて再度お試しください。" },
        { status: 502 },
      );
    }
    return Response.json({ ok: true, subject: mail.subject });
  }

  // --- status mails (design §8 #3): tell the guest where things stand -------
  //
  // Like dispatch, these change nothing on the booking. The acknowledgement
  // promised a status within 48 hours; these are the two statuses that are not
  // already a result (確定 has confirmedEmail, お断り has declinedEmail).
  if (action === "status-waiting" || action === "status-proposal") {
    if (booking.requestType === null) {
      return Response.json(
        { error: "2026-09-30以前の貸切予約には状況メールを送りません。" },
        { status: 409 },
      );
    }

    let mail: { subject: string; text: string };
    if (action === "status-waiting") {
      mail = waitingEmail(booking);
    } else {
      // 🔴 Only when the guest asked for it. A guest who chose「キャンセル」
      // for a full restaurant told us not to spend their money elsewhere, and a
      // proposal mail would be exactly that, pending one reply. Decline instead.
      if (requestTypeOf(booking) !== "restaurant" || booking.fallbackChoice !== "suggest") {
        return Response.json(
          {
            error:
              "この依頼は「満席なら提案」を選んでいません。提案せず「お断り」をご利用ください。",
          },
          { status: 409 },
        );
      }
      // A captured row is paid for a table that exists; proposing another
      // would be a second booking on the same fee.
      if (booking.payment === "captured") {
        return Response.json(
          { error: "この依頼は手配料が決済済みです。提案メールは送れません。" },
          { status: 409 },
        );
      }
      const proposal = typeof body.proposal === "string" ? body.proposal.trim() : "";
      if (!proposal || proposal.length > 500) {
        return Response.json(
          { error: "提案するお店（店名・時間など）を500文字以内で入力してください。" },
          { status: 400 },
        );
      }
      mail = proposalEmail(booking, proposal);
    }

    const { delivered } = await sendMail({
      to: booking.email,
      subject: mail.subject,
      text: mail.text,
      bccOwner: true,
    });
    if (!delivered) {
      return Response.json(
        { error: "状況メールを送信できませんでした。時間をおいて再度お試しください。" },
        { status: 502 },
      );
    }
    return Response.json({ ok: true, subject: mail.subject });
  }

  // --- confirm vs report: which capture button belongs to which kind --------
  //
  // 🔴 Both capture the hold. They differ in what the guest is told, and
  // telling an arrange guest「お手配が完了しました」when we have only sent a
  // first report is a false statement in an email that cannot be taken back
  // (the 2026-09-18 design note, 穴③). So each button refuses the other kind.
  const type = requestTypeOf(booking);
  if (action === "confirm" && type === "arrange") {
    return Response.json(
      {
        error:
          "提携外ツアーの依頼には「確定」を使いません。1回目のご報告をお客様に送ったら「1回目の報告を送った」を押してください。",
      },
      { status: 409 },
    );
  }
  if (action === "report" && type !== "arrange") {
    return Response.json(
      { error: "「1回目の報告を送った」は提携外ツアーの依頼専用です。" },
      { status: 409 },
    );
  }
  const isCapture = action === "confirm" || action === "report";
  // Where the owner should hold off while the money is not in place.
  const holdOff =
    type === "arrange" ? "実施会社へのお問い合わせ" : "お店へのご予約";

  // --- confirm on a different restaurant (the proposal was accepted) -------
  //
  // Validated here, before any money moves, so a bad request cannot capture
  // the fee and then fail to say where the table is.
  const venue = typeof body.venue === "string" ? body.venue.trim() : "";
  if (action === "confirm" && venue) {
    if (requestTypeOf(booking) !== "restaurant" || booking.fallbackChoice !== "suggest") {
      return Response.json(
        { error: "お店の変更は「満席なら提案」を選んだレストランの依頼でのみ使えます。" },
        { status: 409 },
      );
    }
    if (venue.length > 200) {
      return Response.json(
        { error: "お店の名前は200文字以内で入力してください。" },
        { status: 400 },
      );
    }
  }

  // Guard: a booking whose money is already captured must not be "declined".
  // Declining sends the customer a "the hold was released, you were not charged"
  // email and issues no refund — so on a charged booking it would be a lie plus
  // kept money. Cancel (with refund) is the correct action there. The Admin UI
  // only offers decline on pending bookings; this makes that structural.
  if (action === "decline" && booking.payment === "captured") {
    return Response.json(
      {
        error:
          "この予約は決済確定済みです。お断りではなく「キャンセル（返金）」をご利用ください。",
      },
      { status: 409 },
    );
  }

  const hasAuthorization =
    isPaypalConfigured() &&
    booking.payment === "authorized" &&
    Boolean(booking.paypalAuthorizationId);

  // --- Gate 2: confirming a restaurant booking requires a live hold -----
  //
  // Confirming used to capture only `if (hasAuthorization)` and mark the
  // booking confirmed either way. On a restaurant booking with no hold that
  // sent the guest a confirmation saying「お支払い: $0.00（決済確定済み）」and
  // showed the owner a confirmed booking — so nothing anywhere said the $10 had
  // not been taken. A fault you cannot observe is worse than one that stops you.
  //
  // 🔴 Restricted to restaurants on purpose. Arranging a partner tour never
  // touches PayPal, so those bookings are payment="none" by design, as is every
  // request-only booking taken before the pivot. Without this restriction the
  // gate would reject every confirmation from 2026-10-01 onwards.
  // Arrange (2026-10-19) is held and captured the same way, so the same gate
  // applies to its "report" button.
  if (isCapture && isPaidRequest(type) && !hasAuthorization) {
    // 🔴 Already captured is a different situation and must not share the
    // message below. It happens when setBookingPayment succeeded and
    // setBookingStatus did not — the money is taken, the status never moved.
    // hasAuthorization requires payment === "authorized", so a captured row
    // lands here too and used to be told「お客様に再度のお手続きをご案内して
    // ください」: an instruction to send the guest to /repay and charge them a
    // second time for a table they have already paid for.
    if (booking.payment === "captured") {
      return Response.json(
        {
          error:
            "この依頼は手配料が決済済みですが、状態が確定になっていません（保存時の障害の可能性）。🔴 再決済のご案内はしないでください（二重請求になります）。お手配を進める場合はお客様へ直接ご連絡を、取りやめる場合は「全額返金でキャンセル」をご利用ください。",
        },
        { status: 409 },
      );
    }
    if (!isPaypalConfigured()) {
      // Our configuration, not the guest's card. Do not send them anywhere.
      return Response.json(
        { error: "決済が設定されていないため確定できません。環境設定をご確認ください。" },
        { status: 503 },
      );
    }
    // The way back. Without a link here the owner knows the confirmation was
    // refused and has nothing to do about it, so the booking sits pending until
    // someone remembers it — see the 🔴 note below on the order of operations.
    const link = repayUrl(booking.id, SITE_URL);
    return Response.json(
      {
        error:
          booking.payment === "expired"
            ? `カードのお預かりが期限切れです。お客様に下記のリンクから再度のお手続きをご案内してください。お手続きが済むまで、${holdOff}はお控えください（手配だけ進んで料金を請求できない状態を避けるため）。\n${link}`
            : `この依頼にはカードのお預かりがありません。確定すると手配料を請求できないため、確定できません。お客様に下記のリンクから再度のお手続きをご案内してください。\n${link}`,
      },
      { status: 409 },
    );
  }

  try {
    if (isCapture) {
      if (hasAuthorization) {
        let captureId: string;
        let captureStatus: string;
        try {
          ({ captureId, status: captureStatus } = await captureAuthorization(
            booking.paypalAuthorizationId!,
          ));
        } catch (err) {
          // 🔴 The hold died before we got here. This is the ONE capture
          // failure that is not a fault to retry, and it has to be told apart
          // from the others: a plain 502 left the row saying "仮押さえ" — money
          // apparently waiting — so the owner would press 確定 again tomorrow
          // and get the same 502, with nothing on screen ever explaining why.
          //
          // Recording it as expired makes the dead hold visible, and hands the
          // owner the one action that does work: send the guest to /repay.
          // Gate 3 is untouched — the booking stays pending, because there is
          // no money behind it.
          if (
            err instanceof PaypalApiError &&
            err.hasIssue("AUTHORIZATION_EXPIRED")
          ) {
            await setBookingPayment(id, { payment: "expired" });
            const link = repayUrl(booking.id, SITE_URL);
            return Response.json(
              {
                error: `カードのお預かりが期限切れのため、手配料を請求できませんでした。確定していません。お客様に下記のリンクから再度のお手続きをご案内してください。お手続きが済むまで、${holdOff}はお控えください。\n${link}`,
              },
              { status: 409 },
            );
          }
          throw err;
        }

        // 🔴 Gate 4 (2026-10-15): only a COMPLETED capture is money received.
        // Before this, a DECLINED or PENDING capture was recorded as captured,
        // the booking confirmed, and the guest emailed「手配料 $10（お支払い
        // 済み）」— a payment-received notice for money that had not arrived.
        // Nothing is written and no mail goes out on either branch below; the
        // booking stays pending with its authorization as it was.
        if (captureStatus === "PENDING") {
          // Under PayPal review. The money will most likely arrive; pressing
          // 確定 again later reaches the already-captured path above, which
          // re-reads this capture's status and lets it through once COMPLETED.
          return Response.json(
            {
              error: `PayPalが手配料の受け取りを審査中です（PENDING）。まだ確定していません。お客様へのメールも送っていません。\nPayPalの管理画面でこの支払いが完了したのを確認してから、もう一度「${type === "arrange" ? "1回目の報告を送った" : "確定"}」を押してください。（capture: ${captureId}）`,
            },
            { status: 409 },
          );
        }
        if (captureStatus !== "COMPLETED") {
          // DECLINED / FAILED: nothing was taken. /repay asks PayPal whether
          // the hold is still alive before it offers anything, so the link is
          // safe to hand on whatever state the authorization is in now.
          const link = repayUrl(booking.id, SITE_URL);
          return Response.json(
            {
              error: `カード会社が手配料の受け取りを拒否しました（${captureStatus}）。確定していません。お客様へのメールも送っていません。\n${holdOff}はお控えのうえ、お客様に下記のリンクから再度のお手続きをご案内してください。\n${link}`,
            },
            { status: 409 },
          );
        }

        await setBookingPayment(id, {
          payment: "captured",
          paypalCaptureId: captureId,
        });
      }
      // --- Gate 3 ---
      // Only reached when the capture above succeeded, because a throw goes to
      // the catch and returns 502 without touching the status. Gate 2 has
      // already ruled out the other way in: a restaurant booking arriving here
      // with no hold at all. So a confirmed restaurant booking always has money
      // actually captured behind it.
      // Before the status moves, so a confirmed row never names the restaurant
      // that was full. If this write fails the catch below answers 502 with the
      // booking still pending — the same place a failed status write leaves it.
      if (venue) {
        await setBookingPartnerName(id, venue);
        booking.partnerName = venue;
      }
      await setBookingStatus(id, "confirmed");
    } else {
      // decline: release the hold (idempotent void), then mark declined.
      if (hasAuthorization) {
        await voidAuthorization(booking.paypalAuthorizationId!);
        await setBookingPayment(id, { payment: "voided" });
      }
      await setBookingStatus(id, "declined");
    }
  } catch (err) {
    console.error("PayPal action failed:", err);
    return Response.json(
      { error: "決済処理に失敗しました。もう一度お試しください。" },
      { status: 502 },
    );
  }

  // Notify the customer of the outcome, and copy the owner (best-effort;
  // sendMail never throws).
  //
  // bccOwner was already here for cancellations but not for these two, so the
  // owner's inbox held the request and the cancellation and nothing in
  // between: no written record of what was actually promised to the guest, on
  // the one step that commits a guide and a vehicle to a date. Owner request,
  // 2026-08-30.
  //
  // The money step above has already happened, so a failed mail does not undo
  // it — but the owner is told (mailDelivered: false → an alert in Admin),
  // because a confirmed guest who never hears back is the complaint this site
  // can least afford, and until 2026-10-15 a failed send looked like a sent one.
  const mail =
    action === "report"
      ? firstReportEmail(booking, chargedAmount(booking))
      : action === "confirm"
      ? // The amount charged, as snapshotted at request time — so the email
        // always matches the customer's card statement even after a price change.
        confirmedEmail(booking, chargedAmount(booking))
      : declinedEmail(booking);
  const { delivered } = await sendMail({
    to: booking.email,
    subject: mail.subject,
    text: mail.text,
    bccOwner: true,
  });

  return Response.json({ ok: true, mailDelivered: delivered });
}
