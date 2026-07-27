import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side native modules that need to be bundled correctly
  // These modules use native Node.js features and must be excluded from bundling
  serverExternalPackages: [
    'pg',
    'argon2',
    'nodemailer',
    '@libsql/client',
  ],
};

export default nextConfig;
