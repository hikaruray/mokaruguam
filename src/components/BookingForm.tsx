"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RESTAURANT_FEE } from "@/lib/pricing";
import { PAYPAL_ENABLED, CONTACT_EMAIL } from "@/lib/config";
import PaypalCheckout from "./PaypalCheckout";

type State = "idle" | "sending" | "sent" | "error";
type RequestType = "tour" | "restaurant";

// One form, two paths (design §7). The kind of request is chosen first and
// everything downstream branches on it:
//
//   tour       — we arrange a partner's activity. The guest pays them on the
//                day and us nothing, so PayPal must never appear (§6-5): a
//                payment box on a free service contradicts the offer even if
//                it is only visible for a moment.
//   restaurant — we book a table for a flat $10, authorised here and captured
//                only when the table is actually held.
//
// 🔴 There is no default. requestType starts null and the submit button is not
// reachable until the guest picks one. Defaulting either way is a money bug:
// "tour" makes a paid arrangement free, "restaurant" charges $10 for something
// we give away. The server refuses a missing type for the same reason (gate 0).
interface FormValues {
  requestType: RequestType;
  partnerName: string;
  // Restaurant only. Required by the form AND by the server — see gate 0b.
  fallbackChoice: "cancel" | "suggest" | "";
  budgetHint: string;
  cuisineHint: string;
  name: string;
  email: string;
  phone: string;
  tourDate: string;      // ISO date (YYYY-MM-DD)
  startTime: string;     // "HH:MM"
  hotel: string;
  preferredDate: string; // combined "YYYY-MM-DD HH:MM" saved to the store
  guests: number;        // total headcount (adults + both child groups)
  adults: number;
  children4to11: number;
  children0to3: number;
  notes: string;
  mg_field_2: string;    // honeypot — hidden; real users leave it empty
}

// Today in Guam (UTC+10) as YYYY-MM-DD, for the date field's `min`.
//
// Guam, not the visitor's device: a guest booking from Japan an hour before
// midnight is already on tomorrow's date locally, and using that would refuse
// a day that is still bookable here. The server measures the same way
// (pricing.ts, daysUntilTour).
function guamToday(): string {
  const guam = new Date(Date.now() + 10 * 3600_000);
  return guam.toISOString().slice(0, 10);
}

function guestSummary(v: {
  adults: number;
  children4to11: number;
  children0to3: number;
}): string {
  const parts = [`大人${v.adults}`];
  if (v.children4to11 > 0) parts.push(`子供(4-11歳)${v.children4to11}`);
  if (v.children0to3 > 0) parts.push(`子供(0-3歳)${v.children0to3}`);
  return parts.join("・");
}

export default function BookingForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [sentType, setSentType] = useState<RequestType>("tour");
  const [paid, setPaid] = useState(false); // true when the request was authorized
  const [payStep, setPayStep] = useState<FormValues | null>(null);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [fallbackChoice, setFallbackChoice] = useState<"cancel" | "suggest" | "">("");
  const [partnerName, setPartnerName] = useState("");
  const savedValues = useRef<FormValues | null>(null);

  // Arriving from a partner's page on /plans: prefill what they came to book.
  //
  // Read from window rather than useSearchParams() on purpose. That hook forces
  // every page embedding this form either into a Suspense boundary or out of
  // static rendering — and on /reserve this form IS the page, so it would stop
  // being in the prerendered HTML. A prefill convenience must not change how
  // the main content of the site is built.
  //
  // The query string is not available during SSR, so it cannot be an initial
  // state value without a hydration mismatch; it has to arrive after mount.
  /* eslint-disable react-hooks/set-state-in-effect -- reads a browser-only source once on mount; see above for why not useSearchParams */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "tour" || type === "restaurant") setRequestType(type);
    const partner = params.get("partner");
    if (partner) setPartnerName(partner.slice(0, 200));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isRestaurant = requestType === "restaurant";
  // Money only ever moves on the restaurant path.
  const takesPayment = isRestaurant && PAYPAL_ENABLED;

  function readForm(form: HTMLFormElement): FormValues {
    const fd = new FormData(form);
    const tourDate = String(fd.get("tourDate") || "");
    const startTime = String(fd.get("startTime") || "");
    const adults = Number(fd.get("adults") || 0);
    const children4to11 = Number(fd.get("children4to11") || 0);
    const children0to3 = Number(fd.get("children0to3") || 0);
    return {
      // Non-null by construction: the form below is not rendered until a type
      // is chosen, so this function cannot run before then.
      requestType: requestType as RequestType,
      partnerName: String(fd.get("partnerName") || "").trim(),
      fallbackChoice: isRestaurant ? fallbackChoice : "",
      budgetHint: isRestaurant ? String(fd.get("budgetHint") || "") : "",
      cuisineHint: isRestaurant ? String(fd.get("cuisineHint") || "") : "",
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      tourDate,
      startTime,
      preferredDate: [tourDate, startTime].filter(Boolean).join(" "),
      hotel: String(fd.get("hotel") || ""),
      guests: adults + children4to11 + children0to3,
      adults,
      children4to11,
      children0to3,
      notes: String(fd.get("notes") || ""),
      mg_field_2: String(fd.get("mg_field_2") || ""),
    };
  }

  // Client-side mirror of gate 0b. The server refuses these too — this only
  // saves the guest a round trip.
  function valuesOk(v: FormValues): boolean {
    if (v.adults < 1) {
      setError("大人を1名以上お選びください。");
      return false;
    }
    if (v.guests > 7) {
      // 8 or more is taken by email and quoted individually (owner decision,
      // 2026-09-11): the flat $10 hold cannot price a party that size, and
      // building a third payment path before 2026-10-01 is not worth it.
      setError(
        `1〜7名で承っております。8名以上のご予約は別途お見積りとなりますので、${CONTACT_EMAIL} までご連絡ください。`,
      );
      return false;
    }
    if (v.requestType === "restaurant") {
      if (!v.partnerName) {
        setError("ご希望のお店（第1希望）をご入力ください。");
        return false;
      }
      if (!v.fallbackChoice) {
        setError("満席だった場合のご希望をお選びください。");
        return false;
      }
    }
    return true;
  }

  const finalize = useCallback(
    async (values: FormValues, paypalOrderId?: string) => {
      setState("sending");
      setError("");
      try {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, paypalOrderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "送信に失敗しました。時間をおいて再度お試しください。");
          setState("error");
          return;
        }
        setPaid(Boolean(data.authorized));
        setSentType(values.requestType);
        trackBookingRequest(values, data);
        setState("sent");
      } catch {
        setError("通信エラーが発生しました。時間をおいて再度お試しください。");
        setState("error");
      }
    },
    [],
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = readForm(e.currentTarget);
    setError("");
    if (!valuesOk(values)) return;
    if (takesPayment) {
      savedValues.current = values;
      setPayStep(values);
      return;
    }
    // Tours, and restaurants when PayPal is not configured. The server refuses
    // the second case (gate 1) rather than taking an arrangement it cannot
    // charge for — so this path really only completes for tours.
    finalize(values);
  }

  const createOrder = useCallback(async (): Promise<string> => {
    const v = savedValues.current;
    if (!v) throw new Error("no form values");
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: v.requestType,
        guests: v.guests,
        tourDate: v.tourDate,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(data.error || "order failed");
    }
    return data.id as string;
  }, []);

  const onApproved = useCallback(
    (orderId: string) => {
      if (savedValues.current) finalize(savedValues.current, orderId);
    },
    [finalize],
  );

  const onPaypalError = useCallback((message: string) => {
    setError(message);
  }, []);

  // --- Confirmation ---------------------------------------------------------
  if (state === "sent") {
    const restaurant = sentType === "restaurant";
    return (
      <div className="rounded-2xl bg-white p-6 text-ink">
        <div className="text-lg font-bold text-brand">
          ✅ ご依頼を受け付けました
        </div>
        <p className="mt-1 text-sm font-medium text-ink">
          {paid
            ? "現時点では手配料のお預かり（仮押さえ）のみで、まだ請求されていません。"
            : "この時点では料金は発生していません。"}
        </p>
        <ul className="mt-4 space-y-2.5 text-sm text-muted">
          <li>
            📩 <b className="text-ink">48時間以内</b>に、
            {restaurant ? "お店への確認状況" : "提携先への確認状況"}
            をご連絡します。
          </li>
          {restaurant ? (
            <li>
              💳 お席が取れた時点で手配料 ${RESTAURANT_FEE.toFixed(2)} のお支払いが確定します。
              <b className="text-ink">お取りできなかった場合は、料金はいただきません</b>
              （お預かりを解除します）。
            </li>
          ) : (
            <li>
              💳 <b className="text-ink">当社へのお支払いはありません。</b>
              ツアー代金は当日、実施会社へお支払いください。
            </li>
          )}
          {/* 🔴 「いつでもキャンセルいただけます」on its own, two lines under
              「お取りできなかった場合は料金をいただきません」, reads as "you can
              back out free at any time". That is true right up until the table
              is held, and false afterwards — which is the moment it matters. */}
          <li>
            🧾 確認メールをお送りしました。メール内の<b className="text-ink">キャンセルリンク</b>からキャンセルいただけます。
            {restaurant && (
              <>
                {" "}
                お席のお手配が<b className="text-ink">完了したあと</b>のキャンセルは、手配料のご返金はいたしかねます
                （お店へのご連絡は当社が代行します）。
              </>
            )}
          </li>
          <li>
            ✉️ ご不明な点は{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-bold text-brand hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            までご連絡ください。
          </li>
        </ul>
      </div>
    );
  }

  // --- Payment step (restaurant only) ---------------------------------------
  if (payStep) {
    return (
      <div className="rounded-2xl bg-white p-6 text-ink">
        <div className="text-base font-bold">手配料のお支払い</div>
        <div className="mt-3 rounded-xl bg-sand p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">
              レストラン予約代行／{payStep.partnerName}
            </span>
            <span className="text-lg font-bold text-brand">
              ${RESTAURANT_FEE.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {payStep.preferredDate}／{payStep.guests}名（{guestSummary(payStep)}）
          </p>
          {/* 1件につき、です。人数では変わらないことを支払い直前に言う。 */}
          <p className="mt-2 text-xs text-muted">
            手配料は<b>1件 ${RESTAURANT_FEE.toFixed(2)}</b>（人数にかかわらず同額）。
            この時点では<b>お預かり（仮押さえ）</b>のみで、お席が取れた時点でお支払いが確定します。お取りできなかった場合はお預かりを解除します。
          </p>
        </div>

        <div className="mt-4">
          <PaypalCheckout
            createOrder={createOrder}
            onApproved={onApproved}
            onError={onPaypalError}
          />
        </div>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        {state === "sending" && (
          <p className="mt-3 text-center text-sm text-muted">ご依頼を送信しています…</p>
        )}

        <button
          type="button"
          onClick={() => setPayStep(null)}
          className="mt-4 w-full rounded-full border border-line px-4 py-2.5 text-sm font-medium text-muted"
        >
          ← 入力内容を修正する
        </button>
      </div>
    );
  }

  // --- Form -----------------------------------------------------------------
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white p-6 text-ink"
    >
      <div className="text-base font-bold">ご依頼フォーム</div>

      {/* Honeypot: hidden from real users; bots that fill every field trip it
          and are dropped server-side. Not display:none so headless bots that
          skip hidden inputs still see it; kept out of the layout + a11y tree.

          🔴 No label, and a name that means nothing. It used to be an input
          named `company` under a label reading「会社名」— which is exactly what
          a password manager or an address autofill fills in, and tripping it
          discards the request in silence. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input
          type="text"
          name="mg_field_2"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      {/* The choice everything else depends on. */}
      <fieldset className="mt-3">
        <legend className="text-xs font-bold">ご依頼の種類</legend>
        <div className="mt-1.5 grid gap-2">
          <TypeOption
            checked={requestType === "tour"}
            onSelect={() => setRequestType("tour")}
            title="アクティビティ・ツアーの手配"
            note="お客様のお支払いはありません（ツアー代金は当日、実施会社へ）"
          />
          <TypeOption
            checked={requestType === "restaurant"}
            onSelect={() => setRequestType("restaurant")}
            title="レストランの予約代行"
            note={`手配料 1件 $${RESTAURANT_FEE.toFixed(2)}（お取りできなかった場合は無料）`}
          />
        </div>
      </fieldset>

      {requestType === null ? (
        <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm text-muted">
          ご依頼の種類をお選びいただくと、入力フォームが表示されます。
        </p>
      ) : (
        <>
          <Field
            label={isRestaurant ? "ご希望のお店（第1希望）" : "提携先・ツアー名"}
            name="partnerName"
            value={partnerName}
            onChange={setPartnerName}
            placeholder={
              isRestaurant
                ? "例：Proa Tumon"
                : "例：Joe's Jet Ski／やりたいことでもOK"
            }
            required
            maxLength={200}
          />
          {!isRestaurant && (
            <p className="-mt-1 text-xs text-muted">
              決まっていない場合は「シュノーケリング」など、やりたいことをご記入ください。
            </p>
          )}

          {isRestaurant && (
            <>
              {/* 🔴 Required. Without it we have to stop mid-arrangement and
                  email the guest, and that wait is what kills the hold. */}
              <fieldset className="mt-3">
                <legend className="text-xs font-bold">
                  満席だった場合（必須）
                </legend>
                <div className="mt-1.5 grid gap-2">
                  <TypeOption
                    checked={fallbackChoice === "cancel"}
                    onSelect={() => setFallbackChoice("cancel")}
                    title="キャンセルします"
                    note="料金はかかりません"
                  />
                  <TypeOption
                    checked={fallbackChoice === "suggest"}
                    onSelect={() => setFallbackChoice("suggest")}
                    title="現地スタッフのおすすめを提案してほしい"
                    note="ご提案は1件まで。ご承諾いただいてからお席をお取りします"
                  />
                </div>
              </fieldset>

              <div className="grid gap-x-3 sm:grid-cols-2">
                <Field
                  label="ご予算の目安（任意）"
                  name="budgetHint"
                  placeholder="例：1人 $50 くらい"
                  maxLength={100}
                />
                <Field
                  label="お料理の種類（任意）"
                  name="cuisineHint"
                  placeholder="例：シーフード／ステーキ"
                  maxLength={100}
                />
              </div>
              <p className="-mt-1 text-xs text-muted">
                満席だった場合のご提案に使います。
              </p>
            </>
          )}

          <Field label="お名前" name="name" placeholder="山田 太郎" required maxLength={100} />
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="メールアドレス" name="email" type="email" placeholder="you@example.com" required maxLength={200} />
            <Field label="電話番号" name="phone" placeholder="連絡のつく電話番号" required maxLength={60} />
          </div>

          <div className="grid gap-x-3 sm:grid-cols-2">
            <div>
              <label className="mt-3 block text-xs font-bold">
                {isRestaurant ? "ご希望日（お食事）" : "ご希望日"}
              </label>
              {/* No `max`. The charter cutoff that used to cap this is removed
                  on the pivot branch (design §7-2) — from 2026-10-01 every date
                  the business handles is after it. The 30-day ceiling the
                  design once proposed for restaurants is gone too (R-4, owner
                  decision 2026-09-11): a PayPal hold lasts about three days and
                  is captured when the table is confirmed, not on the day of the
                  meal, so a ceiling measured from the meal date never protected
                  anything — it only turned away guests planning months out. */}
              {/* A lower bound, though, there must be: without one a mistyped
                  year reaches PayPal and holds $10 for a meal in the past. The
                  server refuses it too (validateBooking); this only stops the
                  guest getting that far. */}
              <input
                type="date"
                name="tourDate"
                required
                min={guamToday()}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mt-3 block text-xs font-bold">ご希望の時間</label>
              <input
                type="time"
                name="startTime"
                required
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {isRestaurant
              ? "お店の空き状況により、前後のお時間をご提案する場合があります。"
              : "実施会社のスケジュールにより、前後をご提案する場合があります。"}
          </p>

          <label className="mt-3 block text-xs font-bold">
            ご参加人数（合計 最大7名）
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <GuestSelect label="大人" name="adults" min={1} max={7} defaultValue={2} />
            <GuestSelect label="子供 4-11歳" name="children4to11" min={0} max={7} defaultValue={0} />
            <GuestSelect label="子供 0-3歳" name="children0to3" min={0} max={7} defaultValue={0} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            8名以上のご予約も承ります（別途お見積り）。{CONTACT_EMAIL} までご連絡ください。
          </p>

          <Field
            label="ご滞在先（ホテル名）"
            name="hotel"
            placeholder="例：ヒルトン グアム／未定の場合は「未定」"
            required
            maxLength={200}
          />
          <p className="-mt-1 text-xs text-muted">
            {isRestaurant
              ? "お店にお伝えする連絡先の確認に使用します。"
              : "当日の送迎・集合場所の確認に使用します。"}
            ホテル以外（Airbnb・ご親族宅など）の場合はその旨をご記入ください。
          </p>

          <label className="mt-3 block text-xs font-bold">ご要望（任意）</label>
          <textarea
            name="notes"
            maxLength={1000}
            placeholder={
              isRestaurant
                ? "例：窓際の席希望・記念日・アレルギー・ベビーチェア"
                : "例：お子様連れ・記念日・送迎の希望"
            }
            className="mt-1.5 min-h-[78px] w-full resize-y rounded-lg border border-line px-3 py-2.5 text-sm"
          />

          {isRestaurant && PAYPAL_ENABLED && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-sand px-4 py-3 text-sm">
              <span className="text-muted">手配料（1件・人数によらず同額）</span>
              <span className="text-lg font-bold text-brand">
                ${RESTAURANT_FEE.toFixed(2)}
              </span>
            </div>
          )}

          {/* 🔴 Keyed on the message, not on state === "error".
              valuesOk() sets a message and returns false without moving the
              state, so gating on the state meant an unanswered「満席だった場合」
              produced a submit that silently did nothing at all: no payment
              step, no error, no request. The button looked broken. Anything
              that stops a submission has to say so. */}
          {error && (
            <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-4 w-full rounded-full bg-brand px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {takesPayment
              ? "お支払いに進む"
              : state === "sending"
                ? "送信中…"
                : "この内容で依頼する"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {takesPayment
              ? "お席が取れた時点でお支払いが確定します。お取りできなかった場合はお預かりを解除します。"
              : "送信後、48時間以内に状況をご連絡します。当社へのお支払いはありません。"}
          </p>
          {/* Shown at the point of collection, not just in the footer: this is
              the form that actually takes the name, email and phone number. */}
          <p className="mt-2 text-center text-xs text-muted">
            お預かりした情報の取り扱いは
            <a href="/privacy" className="underline hover:text-ink">
              プライバシーポリシー
            </a>
            をご覧ください。
          </p>
        </>
      )}
    </form>
  );
}

// A radio rendered as a full-width card. Used for both choices that must be
// made deliberately: the kind of request, and what to do about a full
// restaurant. Neither has a pre-selected option.
function TypeOption({
  checked,
  onSelect,
  title,
  note,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  note: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition ${
        checked ? "border-brand bg-sand" : "border-line hover:border-brand/50"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 accent-[var(--brand,#e8590c)]"
      />
      <span className="text-sm">
        <span className="block font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{note}</span>
      </span>
    </label>
  );
}

function GuestSelect({
  label,
  name,
  min,
  max,
  defaultValue,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
}) {
  const options = [];
  for (let n = min; n <= max; n++) options.push(n);
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-line px-2 py-2.5 text-sm"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  maxLength,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  // Controlled only where something else has to be able to fill it in (the
  // ?partner= prefill). Everything else stays uncontrolled.
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="mt-3 block text-xs font-bold">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        {...(onChange
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : {})}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
      />
    </div>
  );
}

// Tell GA4 that a request was submitted.
//
// Until 2026-09-03 the property only recorded page views, so it could say how
// many people arrived and never which of them booked — the site had run for
// weeks on the assumption that traffic was the problem, with no way to check.
// Attribution needs the conversion, not just the visit.
//
// Deliberately no name, email or phone: GA4 must not receive anything that
// identifies a guest. The kind of request, headcount and whether a card was
// authorized are enough to tell a channel that produces real bookings from one
// that does not.
//
// value is sent only when PayPal actually authorized an amount. A tour
// arrangement earns a commission from the partner that is not known here, and
// inventing an estimate would quietly mix guesses into revenue reporting.
function trackBookingRequest(
  values: FormValues,
  data: { authorized?: boolean; amount?: number | null },
) {
  // gtag is absent in dev and on preview deployments (see ANALYTICS_ENABLED),
  // and an analytics call must never break a submission that already succeeded.
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", "generate_lead", {
      currency: "USD",
      value: typeof data.amount === "number" ? data.amount : 0,
      request_type: values.requestType,
      guests: values.guests,
      payment_state: data.authorized ? "authorized" : "request_only",
    });
  } catch {
    // Analytics is never worth an error in front of the customer.
  }
}
