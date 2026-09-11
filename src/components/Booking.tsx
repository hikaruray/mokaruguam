import BookingForm from "./BookingForm";

// The request block on the home page: how it works, next to the form itself.
//
// 2026-09-11 — rewritten for the pivot. Three things changed and each one was a
// promise we could no longer keep:
//   • "ガイド・車両の空きを確認して" → we no longer own either. What we check is
//     whether the SHOP or the PARTNER has room.
//   • The 8日/7〜4日/3日 refund ladder is the TOUR policy (pricing.ts
//     refundRateForDate). It must not appear next to a $10 arrangement fee —
//     the audit found that exact ladder silently refunding the restaurant fee
//     in full whenever the meal was 8+ days out, which is the opposite of what
//     the terms say. The fee rule here and the branch in booking-actions.ts
//     have to say the same thing.
//   • The LINE button is gone (email only). See LINE_URL in config.ts.
//
// "48時間以内に状況を" is deliberate: a status, not a result. The shop answers
// on its own schedule.
export default function Booking() {
  return (
    <section id="booking" className="bg-ink-dark text-white">
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            ご依頼から、お手配まで。
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px]">
            <li>ご希望の日時・人数・お店やツアー名を送ってご依頼</li>
            <li>
              現地からお店・提携先に確認して状況をご連絡（48時間以内）。
              <b>この時点ではまだ請求されません</b>
            </li>
            <li>お席・ご予約が確保できた時点で、お手配の完了をご連絡します</li>
          </ol>
          <p className="mt-4 text-[13.5px] opacity-90">
            レストランの予約代行は<b>1件 $10</b>。
            <b>お取りできなかった場合、料金はいただきません</b>
            （カードのお預かりを解除します）。ツアーのお手配は、お客様のお支払いはありません。
          </p>
          <p className="mt-2 text-[13.5px] opacity-90">
            お手配の完了後にお客様のご都合でキャンセルされる場合、$10のご返金はいたしかねます。
            お店へのキャンセルのご連絡は当社が代行します。
          </p>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}
