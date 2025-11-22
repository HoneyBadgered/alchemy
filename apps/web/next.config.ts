import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@alchemy/core", "@alchemy/ui", "@alchemy/sdk"],
};

export default nextConfig;

