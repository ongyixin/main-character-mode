import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // NanoBanana / generated image CDN domains go here
      { protocol: "https", hostname: "**.googleapis.com" },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
