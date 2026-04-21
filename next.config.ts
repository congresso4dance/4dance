import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.**',
      },
      {
        protocol: 'https',
        hostname: 'pxvcgautbaobysvhyfzi.supabase.co',
      }
    ],
  },
};

export default nextConfig;
