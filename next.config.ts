import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: [
      "argon2",
      "@prisma/client",
      "@prisma/adapter-pg",
      "pg",
      "kiteconnect",
    ],
};

export default nextConfig;
