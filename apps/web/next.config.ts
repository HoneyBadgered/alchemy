import type { NextConfig } from "next";
import { createSecureHeaders } from "next-secure-headers";
import { securityConfig } from "./src/config/security";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@alchemy/core", "@alchemy/ui", "@alchemy/sdk"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: createSecureHeaders({
          contentSecurityPolicy: {
            directives: securityConfig.csp,
          },
          forceHTTPSRedirect: [true, securityConfig.hsts],
          referrerPolicy: securityConfig.referrerPolicy,
        }),
      },
    ];
  },
};

export default nextConfig;

