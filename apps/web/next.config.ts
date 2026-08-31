import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@afterlight/shared", "@afterlight/game-core", "@afterlight/networking"]
};

export default nextConfig;
