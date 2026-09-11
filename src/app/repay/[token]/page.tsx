import type { Metadata } from "next";
import PageShell, { PageHero } from "@/components/PageShell";
import { loadRepayable } from "@/lib/repay";
import { CONTACT_EMAIL } from "@/lib/config";
import RepayForm from "./RepayForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "お支払い手続きのやり直し",
  robots: { index: false, follow: false },
};

// One page, one job: take a replacement hold for the arrangement fee when the
// first one expired before the table was confirmed.
//
// A PayPal hold lives about three days. The fee is captured when the restaurant
// actually confirms the table, not on the day of the meal — so the branch where
// the first choice is full, we propose somewhere else, and the guest takes a
// few days to reply will routinely outlive the hold. This page is that branch's
// way back, and it is expected to be used, not an edge case.
//
// Who may be here, and for how much, is decided entirely by lib/repay.ts.
export default async function RepayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const check = await loadRepayable(token);

  if (!check.ok) {
    return (
      <PageShell>
        <PageHero eyebrow="Payment" title="お支払いのお手続き" />
        <section className="mx-auto max-w-2xl px-5 py-12">
          <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
            {check.error}
          </div>
          <Contact />
        </section>
      </PageShell>
    );
  }

  const { booking, amount, holdIsLive } = check;

  return (
    <PageShell>
      <PageHero eyebrow="Payment" title="お支払いのお手続き" />
      <section className="mx-auto max-w-2xl px-5 py-12">
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-bold">ご依頼の内容</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="お名前" value={`${booking.name} 様`} />
            {booking.partnerName && (
              <Row label="お手配先" value={booking.partnerName} />
            )}
            <Row label="ご希望日時" value={booking.preferredDate} />
            <Row label="人数" value={`${booking.guests}名`} />
            <Row label="手配料" value={`$${amount.toFixed(2)}`} />
          </dl>
        </div>

        {holdIsLive ? (
          // Not a failure — the hold outlived the worry. Saying so is the point:
          // otherwise the guest pays a second time for one table.
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            <p className="font-bold">お手続きは不要です</p>
            <p className="mt-2">
              お支払いは有効なままお預かりしています。重ねてのお手続きはなさらないでください。お店へのお席のご依頼は当社で進めております。
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-line bg-sand p-5 text-sm text-muted">
              <p>
                カードのお預かりの有効期限が切れたため、恐れ入りますが
                <b className="text-ink">もう一度お手続き</b>
                をお願いしております。
              </p>
              <p className="mt-2">
                お手続きの時点では<b className="text-ink">仮押さえのみ</b>
                で、まだ請求されません。お席が取れた時点でお支払いが確定し、ご用意できなかった場合は仮押さえを解除しますので、料金は発生しません。
              </p>
            </div>

            <RepayForm token={token} amount={amount} />
          </>
        )}

        <Contact />
      </section>
    </PageShell>
  );
}

function Contact() {
  return (
    <p className="mt-6 text-center text-xs text-muted">
      ご不明な点は{" "}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="font-bold text-brand hover:underline"
      >
        {CONTACT_EMAIL}
      </a>{" "}
      までご連絡ください。
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
