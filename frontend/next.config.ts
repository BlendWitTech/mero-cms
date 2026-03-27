import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: `${API_URL}/sitemap.xml`,
      },
      {
        source: '/sitemap-posts.xml',
        destination: `${API_URL}/sitemap-posts.xml`,
      },
      {
        source: '/sitemap-index.xml',
        destination: `${API_URL}/sitemap-index.xml`,
      },
    ];
  },
};

export default nextConfig;
