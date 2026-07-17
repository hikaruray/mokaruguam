import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import BookingCta from "@/components/BookingCta";
import { OG_IMAGE } from "@/lib/images";
import {
  LEGACY_SLUGS,
  getLegacyArticle,
  isLegacySlug,
} from "@/lib/legacy-articles";
import { ctaFor } from "@/lib/legacy-cta";

// Restored legacy blog articles. See src/lib/legacy-articles.ts for why these
// exist and how the URLs line up with the old site.
//
// SAFETY: `dynamicParams = false` means ONLY the slugs returned below are ever
// served — everything else 404s. This route therefore cannot shadow a real page
// (/plans, /reserve, /spots, /faq, /admin, /api, …), and a future page added at
// the root keeps working. It is an explicit allow-list, not a catch-all.
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGACY_SLUGS.map((slug) => ({ slug }));
}

/** First ~110 chars of body text — good enough for a meta description. */
function excerpt(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 110 ? `${text.slice(0, 110)}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getLegacyArticle(slug);
  if (!article) return { title: "記事が見つかりません" };

  const desc = excerpt(article.html);
  return {
    title: article.title,
    description: desc,
    // Point at the final URL of the old redirect chain (www, no trailing
    // slash). The old HTML claimed the apex+slash URL, which now redirects —
    // leaving that in place would tell Google the canonical is a redirect.
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: `${article.title}｜Mokaru Guam`,
      description: desc,
      url: `/${slug}`,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.modified,
      images: [OG_IMAGE],
    },
  };
}

export default async function LegacyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegacySlug(slug)) notFound();

  const article = getLegacyArticle(slug);
  if (!article) notFound();

  const cta = ctaFor(slug);

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-5 py-12">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
          Guam Guide
        </div>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{article.title}</h1>
        <p className="mt-3 text-sm text-muted">
          <time dateTime={article.modified}>
            {article.modified.slice(0, 10).replace(/-/g, "/")}
          </time>
          {" 更新"}
        </p>

        {/* Body comes from our own WordPress export (no user input), and is
            stripped of scripts/styles in cleanHtml(). */}
        <div
          className="legacy-article mt-8"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />

        {/* Route into the funnel, phrased for this article's subject. The
            article itself is left exactly as written — this is appended. */}
        <aside className="mt-12 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-bold">{cta.heading}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {cta.lead}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {cta.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-bold text-brand underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </article>

      <BookingCta />
    </PageShell>
  );
}
