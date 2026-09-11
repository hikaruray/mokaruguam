import Image from "next/image";
import { IMAGES } from "@/lib/images";

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[70vh] items-end overflow-hidden text-white">
      {/* LCP element: the ONLY image with priority so it loads first.
          next/image serves AVIF/WebP + a responsive srcset automatically. */}
      <Image
        src={IMAGES.hero}
        alt="グアムの海"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Gradient overlay for text legibility. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/75" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-12 pt-14">
        {/* The H1 is the single line that says what the business is, so it says
            it plainly. The charter it replaced ends 2026-09-30, along with the
            $170 price and the「グアム唯一」claim that went with it. */}
        <h1 className="text-3xl font-bold leading-tight drop-shadow-lg sm:text-5xl">
          グアムにいる日本人が、
          <br />
          代わりに予約します。
        </h1>
        <p className="mt-4 max-w-2xl text-base drop-shadow sm:text-lg">
          <b>着いてから探さない。</b>
          レストランもアクティビティも、渡航前に日本語で手配できます。レストランの予約代行は1件
          $10、お取りできなければ0円です。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#booking"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            手配を依頼する
          </a>
          <a
            href="#price"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/70 bg-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            できること・料金を見る
          </a>
        </div>
      </div>
    </section>
  );
}
