import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Strengths from "@/components/Strengths";
import Pricing from "@/components/Pricing";
import Spots from "@/components/Spots";
import Reviews from "@/components/Reviews";
import VideoSection from "@/components/VideoSection";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import MobileCta from "@/components/MobileCta";
import { USING_PLACEHOLDER_PHOTOS } from "@/lib/images";

export default function Home() {
  return (
    <>
      {USING_PLACEHOLDER_PHOTOS && (
        <div className="bg-ink px-4 py-2 text-center text-[13px] text-white">
          これは <b className="text-[#ffd7a8]">リニューアル試作</b>{" "}
          です。写真はすべて仮画像で、本番は Mokaru の実写真・動画に差し替えます。
        </div>
      )}
      <Header />
      <main className="pb-16 md:pb-0">
        <Hero />
        <TrustBar />
        <Strengths />
        <Pricing />
        <Spots />
        <Reviews />
        <VideoSection />
        <Booking />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
