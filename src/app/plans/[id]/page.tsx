import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { OG_IMAGE, photoFor } from "@/lib/images";
import { PARTNER_CANCEL_POLICY } from "@/lib/config";
import {
  PARTNERS_WITH_PAGE,
  getPartnerWithPage,
  partnerRequestLabel,
} from "@/lib/partners";

// A page per partner operator. Only partners with `details` in lib/partners.ts
// get one — those are the ones whose facts we have read off their own site.
export function generateStaticParams() {
  return PARTNERS_WITH_PAGE.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getPartnerWithPage(id);
  if (!p) return { title: "ページが見つかりません" };
  const desc = `${p.company}の${p.activity}。${p.blurb} Mokaru Guam が日本語で手配を代行します（当社へのお支払いはありません）。`;
  return {
    title: `${p.company}｜${p.activity}`,
    description: desc,
    alternates: { canonical: `/plans/${p.id}` },
    openGraph: {
      title: `${p.company}｜Mokaru Guam`,
      description: desc,
      url: `/plans/${p.id}`,
      type: "article",
      images: [OG_IMAGE],
    },
  };
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = getPartnerWithPage(id);
  if (!p) notFound();
  const d = p.details;

  // 🔴 Our own form, never the operator's booking page: the commission is owed
  // on bookings we send (see lib/partners.ts).
  const requestHref = `/reserve?type=tour&partner=${encodeURIComponent(partnerRequestLabel(p))}`;

  return (
    <PageShell>
      {d.photo ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
          <Image
            src={photoFor(d.photo.seed)}
            alt={d.photo.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-5xl px-5 pb-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffd7a8]">
              Partner ／ 提携先
            </p>
            <h1 className="mt-1 text-3xl font-bold drop-shadow sm:text-4xl">
              {p.company}
            </h1>
            <p className="mt-1 text-sm drop-shadow">{p.activity}</p>
          </div>
        </div>
      ) : (
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-5xl px-5 py-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Partner ／ 提携先
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{p.company}</h1>
            <p className="mt-2 text-muted">{p.activity}</p>
          </div>
        </section>
      )}

      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-lg font-bold text-brand">{p.blurb}</p>

        {/* Price + request, first thing after the lead: it is what the guest
            came to check. */}
        <div className="mt-6 rounded-2xl border-2 border-brand bg-white p-5">
          <h2 className="text-sm font-bold">料金（{p.company}の料金）</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {d.prices.map((x) => (
                <tr key={x.label} className="border-t border-line first:border-t-0">
                  <td className="py-2 pr-3 text-muted">{x.label}</td>
                  <td className="py-2 text-right text-lg font-bold text-ink">{x.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            <li>
              <b className="text-ink">当社へのお支払いはありません。</b>
              ツアー代金は当日、{p.company}へ直接お支払いください。
            </li>
            <li>{p.duration && <>所要 {p.duration}。</>}最新の料金は手配時にご案内します。</li>
          </ul>
          <Link
            href={requestHref}
            className="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            モカル経由で手配を依頼する
          </Link>
        </div>

        <h2 className="mt-10 text-xl font-bold">どんなツアー？</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink">
          {d.course.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>

        {/* 🔴 The rules sit high and boxed. The request form cannot enforce the
            8-year minimum, so a family with a young child has to see it here. */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-800">参加できる方・ご注意</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {d.rules.map((t) => (
              <li key={t}>
                <span className="mr-1.5 font-bold text-amber-700">!</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-sm font-bold">集合場所</h2>
            <p className="mt-2 text-sm text-muted">{d.meetingPoint}</p>
            <h2 className="mt-5 text-sm font-bold">当日の流れ</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {d.onTheDay.map((t) => (
                <li key={t}>
                  <span className="mr-1.5 font-bold text-brand">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-sm font-bold">持ち物</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {d.bring.map((t) => (
                <li key={t}>
                  <span className="mr-1.5 font-bold text-brand">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Partner terms confirmed with both operators — same constant the
            confirmation mail uses, so the page and the mail cannot disagree. */}
        <div className="mt-8 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-bold">キャンセルについて</h2>
          <p className="mt-2 text-sm text-muted">{PARTNER_CANCEL_POLICY}</p>
        </div>

        <h2 className="mt-10 text-xl font-bold">{p.company}について</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink">
          {d.about.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={requestHref}
            className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            モカル経由で手配を依頼する
          </Link>
          <Link
            href="/plans"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
          >
            ← できること・料金へ
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted">
          当社は手配を代行する立場であり、ツアーの実施者ではありません。ツアーに関する契約は、お客様と{p.company}との間に成立します。
          掲載内容は{p.company}の公式サイト（{d.source.readOn} 時点）に基づきます。変更されている場合があるため、手配時に最新の内容をご案内します。
        </p>
      </article>

      <BookingCta />
    </PageShell>
  );
}
