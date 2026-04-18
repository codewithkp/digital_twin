import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // NEXT_PUBLIC_* vars are exposed to the browser automatically.
  // Set these in Vercel project settings or a local .env.local file.
  // See .env.example for the full list.
};

export default nextConfig;
