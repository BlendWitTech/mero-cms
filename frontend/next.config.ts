import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: 'http://127.0.0.1:3001/sitemap.xml',
      },
      {
        source: '/sitemap-posts.xml',
        destination: 'http://127.0.0.1:3001/sitemap-posts.xml',
      },
      {
        source: '/sitemap-index.xml',
        destination: 'http://127.0.0.1:3001/sitemap-index.xml',
      },
    ];
  },
};

export default nextConfig;
