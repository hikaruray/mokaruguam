import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { Eyebrow, SectionHeading, Sub } from "./Section";

export default function Spots() {
  return (
    <section id="spots" className="mx-auto max-w-5xl px-5 py-16">
      <Eyebrow>Popular spots</Eyebrow>
      <SectionHeading>みんなが訪れる、人気スポット</SectionHeading>
      <Sub>定番から穴場まで。あなたの「行きたい」を組み合わせてプランを作れます。</Sub>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {IMAGES.spots.map((spot) => (
          <div
            key={spot.seed}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
          >
            <Image
              src={spot.src}
              alt={spot.label}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3.5 pb-3 pt-6 text-sm font-bold text-white">
              {spot.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
