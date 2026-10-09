import type { NextConfig } from 'next';

// Static export: the hub is fully client-rendered, so `next build` emits ./out
// which the Cloudflare Worker (see worker/) serves as static assets alongside
// the /api/* routes and the Realtime signaling Durable Object.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
