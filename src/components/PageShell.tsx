import Header from "./Header";
import Footer from "./Footer";
import MobileCta from "./MobileCta";

// Common shell for subpages: shared header/footer/CTA, matching the home page.
// `bottom-padding` on <main> keeps content clear of the sticky mobile CTA bar.
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileCta />
    </>
  );
}

// Simple page hero (title band) reused across subpages.
export function PageHero({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
          {eyebrow}
        </div>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-muted">{lead}</p>}
      </div>
    </section>
  );
}
