import { Eyebrow, SectionHeading, Sub } from "./Section";

const STRENGTHS = [
  {
    icon: "🇯🇵",
    title: "日本語で手配",
    body: "お店や実施会社とのやり取りは当社が行います。英語でご連絡いただく必要はありません。",
  },
  {
    icon: "📍",
    title: "現地スタッフが知っている",
    body: "グアム在住の日本人スタッフが手配します。満席のときは、代わりのお店もご提案できます。",
  },
  {
    icon: "✈️",
    title: "渡航前から",
    body: "着いてから探す必要がありません。出発前に、人気店やアクティビティの予約を済ませておけます。",
  },
  {
    icon: "💰",
    title: "取れなければ0円",
    body: "レストランの手配料は1件 $10。お席をお取りできなかった場合、料金はいただきません。",
  },
];

export default function Strengths() {
  return (
    <section id="strength" className="mx-auto max-w-5xl px-5 py-16">
      <Eyebrow>Why Mokaru</Eyebrow>
      <SectionHeading>予約の手間を、こちらへ。</SectionHeading>
      <Sub>
        人気店は英語での電話予約が必要なことも。その一手間を、グアムにいる日本人が代わりに引き受けます。
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
