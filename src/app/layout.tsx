import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SITE_URL, GA_ID, ANALYTICS_ENABLED } from "@/lib/config";
import { OG_IMAGE } from "@/lib/images";

// Only the weights the design uses, to keep the font payload small.
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

// Site-wide metadata. These strings are the site's default title, description
// and social card on EVERY page that does not override them, which is why the
// old charter wording reached 106 of 107 built pages.
//
// Rewritten 2026-09-11 for the Oct 1 pivot: the business stops running its own
// guided charters on 2026-09-30 and becomes booking arrangement — partner
// activities (the guest pays us nothing) and restaurant reservations ($10, and
// nothing if the table can't be had). Nothing here may imply we drive, guide,
// or own a vehicle.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "グアムのレストラン予約代行・ツアー手配｜Mokaru Guam（モカルグアム）",
    template: "%s｜Mokaru Guam",
  },
  description:
    "グアムにいる日本人が、レストランやアクティビティの予約を代わりにお取りします。渡航前にメールだけで手配。レストランの予約代行は1件$10、お取りできなければ料金はいただきません。",
  keywords: [
    "グアム レストラン 予約代行",
    "グアム 予約 代行",
    "グアム 日本語 予約",
    "グアム アクティビティ 手配",
    "グアム ツアー 手配",
    "Mokaru Guam",
  ],
  openGraph: {
    title: "Mokaru Guam｜グアムのレストラン予約代行・ツアー手配",
    description:
      "着いてから探さない。グアムにいる日本人が、渡航前に日本語で予約をお取りします。",
    url: SITE_URL,
    siteName: "Mokaru Guam",
    locale: "ja_JP",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mokaru Guam｜グアムのレストラン予約代行・ツアー手配",
    description: "グアムにいる日本人が、代わりに予約します。",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} antialiased`}>
      <body className="bg-sand text-ink font-sans">{children}</body>
      {/* GA4 via gtag.js. Loaded after hydration, so it never blocks first
          paint. Absent locally and on previews — see ANALYTICS_ENABLED. */}
      {ANALYTICS_ENABLED && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
