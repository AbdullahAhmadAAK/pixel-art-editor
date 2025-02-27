import type { NextConfig } from "next";

// This will ensure that if the environment variables are not set, any build will not be successful, thus runtime errors in deployments.
// In my opinion, it would be more scalable if the other environment variables validations were shifted here as well.
if (!process.env.LIVEBLOCKS_SECRET_KEY) throw new Error("LIVEBLOCKS_SECRET_KEY not set in environment variables");

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
