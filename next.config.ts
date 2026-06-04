import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
  env: {
    DATABASE_URL: "postgresql://neondb_owner:npg_dZQpnADIRq85@ep-wild-union-alvg035f-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  },
};

export default nextConfig;
