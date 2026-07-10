import Link from "next/link";
import Image from "next/image";
import { LINE_URL } from "@/lib/config";

// Nav targets. Section anchors use "/#id" so they work from any subpage
// (they jump to the home page section). Subpages are real routes.
const NAV = [
  { href: "/plans", label: "料金・プラン" },
  { href: "/spots", label: "人気スポット" },
  { href: "/reviews", label: "お客様の声" },
  { href: "/faq", label: "よくある質問" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center" aria-label="Mokaru Guam ホーム">
          {/* Black/gray logo on the light header. Height-fixed for CLS safety. */}
          <Image
            src="/mokaru-logo.png"
            alt="Mokaru Guam"
            width={52}
            height={52}
            priority
            className="h-13 w-auto"
            style={{ height: 52, width: "auto" }}
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* Secondary: LINE is a question/consultation channel, not booking.
              Lower emphasis (outline, LINE green). Hidden on the smallest screens
              where the sticky bottom bar covers the actions. */}
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-[#06c755] px-3.5 py-1.5 text-sm font-medium text-[#06c755] transition hover:bg-[#06c755]/10 sm:inline-block"
          >
            質問・相談はLINEで
          </a>
          {/* Primary: booking request — brand orange, most prominent.
              Points to the dedicated /reserve page. */}
          <Link
            href="/reserve"
            className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            リクエスト予約
          </Link>
        </div>
      </div>
    </header>
  );
}
