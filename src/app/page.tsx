import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Strengths from "@/components/Strengths";
import Pricing from "@/components/Pricing";
import Spots from "@/components/Spots";
import Reviews from "@/components/Reviews";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import MobileCta from "@/components/MobileCta";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { organizationLd, websiteLd } from "@/lib/structured-data";

// Title and description come from the layout defaults. Only the canonical is
// set here: every other page declares one and the home page did not (found
// 2026-10-15). It must not go in the layout, where it would be inherited by
// every page that forgets its own and point them all at "/".
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd()]} />
      <Header />
      <main className="pb-16 md:pb-0">
        <Hero />
        <TrustBar />
        <Strengths />
        <Pricing />
        <Spots />
        <Reviews />
        <Booking />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
