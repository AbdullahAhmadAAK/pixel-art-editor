import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.b3.fun",
      },
      {
        protocol: "https",
        hostname: "game-cdn.b3.fun",
      },
    ],
  },
};

export default nextConfig;
