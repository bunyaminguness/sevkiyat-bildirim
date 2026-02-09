import type { NextConfig } from "next";

// Backend URL for API proxy
// In production: uses NEXT_PUBLIC_BACKEND_URL or same-origin (Cloudflare Tunnel)
// In development: defaults to local backend
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sevkiyat.toplumplatformu.com';

const nextConfig: NextConfig = {
  // Proxy all /api/* requests to the ASP.NET Core backend
  // This ensures deterministic routing regardless of env var configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
