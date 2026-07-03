import Image from "next/image";
import { IMAGES } from "@/lib/images";

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[70vh] items-end overflow-hidden text-white">
      {/* LCP element: the ONLY image with priority so it loads first.
          next/image serves AVIF/WebP + a responsive srcset automatically. */}
      <Image
        src={IMAGES.hero}
        alt="グアムの海と貸切ツアーのイメージ"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Gradient overlay for text legibility. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/75" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-12 pt-14">
        <h1 className="text-3xl font-bold leading-tight drop-shadow-lg sm:text-5xl">
          グアムを、
          <br />
          あなただけの貸切で。
        </h1>
        <p className="mt-4 max-w-2xl text-base drop-shadow sm:text-lg">
          日本語ガイド＋専用車で、行きたい場所を自由に。グアム唯一の完全貸切ガイドチャーター「Mokaru
          Guam」。3時間 $170〜、人数が増えるほどおトク。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {/* Primary CTA: booking request in brand orange (was LINE green). */}
          <a
            href="#booking"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            リクエスト予約・空き確認
          </a>
          <a
            href="#price"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/70 bg-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            料金プランを見る
          </a>
        </div>
      </div>
    </section>
  );
}
