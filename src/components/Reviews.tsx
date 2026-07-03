import { Eyebrow, SectionHeading, Sub } from "./Section";

// NOTE: placeholder review copy. Real VELTRA reviews go here once transcription
// permission is confirmed (see the "掲載許諾確認中" note below).
const REVIEWS = [
  {
    text: "子連れでも安心でした。行きたい場所を伝えるだけで完璧なルートに。ガイドさんの写真も最高！",
    who: "40代・ご家族／5時間プラン",
  },
  {
    text: "相乗りがないので自分たちのペースで回れました。エメラルドバレーは一生の思い出です。",
    who: "30代・カップル／8時間プラン",
  },
  {
    text: "初めてのグアムで不安でしたが、日本語で何でも聞けて安心。また利用します。",
    who: "20代・ご友人同士／3時間プラン",
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <Eyebrow>Reviews</Eyebrow>
        <SectionHeading>お客様の声</SectionHeading>
        <Sub>VELTRA に寄せられた声を、このサイトでもご紹介予定です。</Sub>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <div key={i} className="rounded-2xl border border-line p-5">
              <div className="tracking-widest text-[#ffb400]">★★★★★</div>
              <p className="my-3 text-sm">「{r.text}」</p>
              <div className="text-xs font-medium text-muted">{r.who}</div>
              <span className="mt-1 inline-block text-[11px] font-bold text-brand">
                VELTRA レビューより（予定）
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 inline-block rounded-lg border border-[#ffe1a1] bg-[#fff3d6] px-3 py-1.5 text-xs text-[#9a6a00]">
          ※ 実際の口コミ文面・お名前は、VELTRA への掲載許諾を確認のうえ差し替えます（現在は仮の文章です）。
        </div>
      </div>
    </section>
  );
}
