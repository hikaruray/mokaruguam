import { Eyebrow, SectionHeading, Sub } from "./Section";

const STRENGTHS = [
  {
    icon: "🚐",
    title: "完全貸切",
    body: "他のお客様との相乗りなし。家族・グループだけの気兼ねない時間を過ごせます。",
  },
  {
    icon: "🗺️",
    title: "自由なプラン",
    body: "行きたいスポットを送るだけ。時間内で回れるようガイドが最適ルートをご提案。",
  },
  {
    icon: "🇯🇵",
    title: "日本語ガイド",
    body: "言葉の心配なし。写真撮影やおすすめ情報まで、日本語で丁寧にご案内します。",
  },
  {
    icon: "💰",
    title: "人数追加もおトク",
    body: "料金は1台あたり。人数が増えるほど1人あたりの負担が下がります。",
  },
];

export default function Strengths() {
  return (
    <section id="strength" className="mx-auto max-w-5xl px-5 py-16">
      <Eyebrow>Why Mokaru</Eyebrow>
      <SectionHeading>「自分たちだけ」の時間を、まるごと。</SectionHeading>
      <Sub>
        決まったコースに合わせるのではなく、あなたの「行きたい」に合わせる。だから満足度が高い。
      </Sub>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STRENGTHS.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-line bg-white p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdeadd] text-2xl">
              {s.icon}
            </div>
            <h3 className="mt-3.5 mb-1.5 text-lg font-bold">{s.title}</h3>
            <p className="text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
