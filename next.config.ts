import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prototype/placeholder images are served from picsum.photos and the current
    // WordPress site. Replace with the production photo host (or local /public
    // assets) once the owner provides real photos.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "www.mokaruguam.com" },
      { protocol: "https", hostname: "mokaruguam.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // next/image serves modern formats automatically; AVIF first, then WebP.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
