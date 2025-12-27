import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
      },
    ],
  },
};

export default nextConfig;
