import Link from "next/link";
import Image from "next/image";

// Nav targets. Section anchors use "/#id" so they work from any subpage
// (they jump to the home page section). Subpages are real routes.
const NAV = [
  { href: "/plans", label: "できること・料金" },
  { href: "/spots", label: "人気スポット" },
  { href: "/reviews", label: "お客様の声" },
  { href: "/faq", label: "よくある質問" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center" aria-label="Mokaru Guam ホーム">
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
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* The LINE consultation button was removed 2026-09-11. The pivot runs
              on email only, so a second channel would be an inbox nobody
              watches. Do not re-add it — see the note on LINE_URL in config.ts. */}
          {/* Primary: the arrangement request — brand orange, most prominent.
              Points to the dedicated /reserve page. */}
          <Link
            href="/reserve"
            className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            手配を依頼する
          </Link>
        </div>
      </div>
    </header>
  );
}
