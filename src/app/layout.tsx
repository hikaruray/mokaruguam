import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

// Only the weights the design uses, to keep the font payload small.
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "グアム完全貸切ガイドチャーター｜Mokaru Guam（モカルグアム）",
    template: "%s｜Mokaru Guam",
  },
  description:
    "グアム唯一の完全貸切ガイドチャーター。日本語ガイド＋専用車で、行きたい場所を自由に。3時間$170〜、人数が増えるほどおトク。まずはリクエスト予約から。",
  keywords: [
    "グアム 貸切",
    "グアム チャーター",
    "グアム 日本語ガイド",
    "グアム 観光 車",
    "グアム プライベートツアー",
    "Mokaru Guam",
  ],
  openGraph: {
    title: "Mokaru Guam｜グアム完全貸切ガイドチャーター",
    description:
      "あなただけの貸切で、行きたい場所を自由に。日本語ガイド＋専用車でグアムを満喫。",
    url: SITE_URL,
    siteName: "Mokaru Guam",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mokaru Guam｜グアム完全貸切ガイドチャーター",
    description: "日本語ガイド＋専用車で、あなただけのグアムを。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} antialiased`}>
      <body className="bg-sand text-ink font-sans">{children}</body>
    </html>
  );
}
