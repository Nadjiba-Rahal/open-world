import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@afterlight/shared", "@afterlight/game-core"]
};

export default nextConfig;
