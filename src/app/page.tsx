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

export default function Home() {
  return (
    <>
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
