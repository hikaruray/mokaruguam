import Link from "next/link";
import Image from "next/image";

// Nav targets. Section anchors use "/#id" so they work from any subpage
// (they jump to the home page section). Subpages are real routes.
// `lgOnly`: shown from 1024px. Measured 2026-09-19 at a 768px viewport: logo
// 157 + request button 130 + all five items 540 = 827px, in a 713px bar — 114
// short, so something had to give, and what gave was the request button
// (squeezed to three lines). Four items fit at 768 with room to spare, five fit
// from 1024. The footer menu carries every item at every width.
const NAV: { href: string; label: string; lgOnly?: boolean }[] = [
  { href: "/plans", label: "できること・料金" },
  { href: "/dining", label: "おすすめレストラン", lgOnly: true },
  { href: "/spots", label: "人気スポット" },
  { href: "/reviews", label: "お客様の声" },
  { href: "/faq", label: "よくある質問" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        {/* shrink-0 here and on the button: when the nav outgrows the bar, the
            nav must be what gives — never the logo or the request button. */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="Mokaru Guam ホーム">
          {/* Same horizontal logo as the footer (turtle + white MOKARU GUAM
              wordmark). The logo art has a dark background, so it sits on a small
              dark "chip" to stay legible on the light header. Height-fixed for CLS. */}
          <span className="inline-flex items-center rounded-lg bg-ink px-3 py-1.5">
            <Image
              src="/logo-horizontal.png"
              alt="Mokaru Guam"
              width={500}
              height={120}
              priority
              className="w-auto"
              style={{ height: 32, width: "auto" }}
            />
          </span>
        </Link>
        {/* nowrap: a label that wraps doubles the header's content height. */}
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex lg:gap-6">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap hover:text-brand ${n.lgOnly ? "hidden lg:inline" : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {/* The LINE consultation button was removed 2026-09-11. The pivot runs
              on email only, so a second channel would be an inbox nobody
              watches. Do not re-add it — see the note on LINE_URL in config.ts. */}
          {/* Primary: the arrangement request — brand orange, most prominent.
              Points to the dedicated /reserve page. */}
          <Link
            href="/reserve"
            className="whitespace-nowrap rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            手配を依頼する
          </Link>
        </div>
      </div>
    </header>
  );
}
