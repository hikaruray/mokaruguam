"use client";

import { useState } from "react";
import { PLANS, priceFor, perPerson, MAX_GUESTS } from "@/lib/pricing";
import { Eyebrow, SectionHeading, Sub } from "./Section";

// Interactive pricing: a guest slider updates the per-person amount live, so the
// "cheaper as the group grows" value is obvious. Numbers come from lib/pricing.ts.
export default function Pricing() {
  const [guests, setGuests] = useState(4);

  return (
    <section id="price" className="mx-auto max-w-5xl px-5 py-16">
      <Eyebrow>Pricing</Eyebrow>
      <SectionHeading>シンプルな時間制プラン</SectionHeading>
      <Sub>料金は1台あたり。人数が増えるほど、1人あたりはおトクになります。</Sub>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <label
          htmlFor="guests"
          className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold"
        >
          <span>ご参加人数で1人あたりを計算</span>
          <span className="text-brand">
            {guests}名{guests >= 5 && "（5〜7名 +$20）"}
          </span>
        </label>
        <input
          id="guests"
          type="range"
          min={1}
          max={MAX_GUESTS}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="mt-3 w-full accent-[#ea5a0c]"
          aria-label="参加人数"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>1名</span>
          <span>{MAX_GUESTS}名</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const total = priceFor(plan, guests);
          const pp = perPerson(plan, guests);
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl bg-white p-6 text-center ${
                plan.popular
                  ? "border-2 border-brand"
                  : "border border-line"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-3.5 py-1 text-xs font-bold text-white">
                  いちばん人気
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2 text-4xl font-bold text-brand">
                ${total}
                <small className="text-base font-medium text-muted"> /台</small>
              </div>
              <div className="mt-1 text-sm font-bold text-brand">
                {guests}名なら1人あたり 約${pp}
              </div>
              <ul className="mt-3.5 inline-block text-left text-sm text-muted">
                {plan.blurb.map((b) => (
                  <li key={b} className="my-1.5">
                    <span className="mr-1.5 font-bold text-brand">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        ※ 5〜7名は各プラン +$20。繁忙期（GW・夏休み・年末年始等）は別料金です。詳しくはお問い合わせください。
      </p>
    </section>
  );
}
