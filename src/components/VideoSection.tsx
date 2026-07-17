"use client";

import { useState } from "react";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { Eyebrow, SectionHeading, Sub } from "./Section";

// Lightweight "lite YouTube" facade: show a poster + play button, and only load
// the heavy YouTube iframe after the user clicks. Keeps the page fast (the
// iframe would otherwise pull ~500KB+ of scripts on every visit).
//
// Mokaru Guam LONG プラン紹介ムービー（YouTube: MokaruGuam チャンネル）
// https://www.youtube.com/watch?v=KHwH1ByuBcM
const YOUTUBE_ID = "KHwH1ByuBcM";

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);
  const hasVideo = YOUTUBE_ID.length > 0;

  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <Eyebrow>Movie</Eyebrow>
      <SectionHeading>動画で見るツアーの雰囲気</SectionHeading>
      <Sub>
        長尺の動画は YouTube に置いて埋め込み。クリックで再生するので、サイトは軽いままです。
      </Sub>

      <div className="relative mt-7 aspect-video overflow-hidden rounded-2xl bg-ink-dark">
        {playing && hasVideo ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`}
            title="Mokaru Guam LONGプラン紹介ムービー"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => hasVideo && setPlaying(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-white"
            aria-label="LONGプラン紹介ムービーを再生"
          >
            <Image
              src={IMAGES.video}
              alt="ツアー動画のサムネイル"
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover opacity-75"
            />
            <span className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white/90 text-3xl text-brand">
              ▶
            </span>
            <span className="relative font-bold">
              {hasVideo
                ? "LONGプラン紹介ムービーを再生"
                : "ツアー紹介ムービー（YouTube 埋め込み予定）"}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
