import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Site photos are local files in /public/photos, so no host is needed for
    // them. These remote hosts cover the legacy WordPress media still linked in
    // places and YouTube thumbnails.
    remotePatterns: [
      { protocol: "https", hostname: "www.mokaruguam.com" },
      { protocol: "https", hostname: "mokaruguam.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // next/image serves modern formats automatically; AVIF first, then WebP.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
