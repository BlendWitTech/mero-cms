import type { NextConfig } from "next";

// BACKEND_URL is server-only — the rewrite below is performed by the Next.js
// edge so the browser never sees this. NEXT_PUBLIC_API_URL is the legacy
// override that customers can still set when running admin and backend on
// different domains; when unset, the client uses relative `/api/*` paths
// and this rewrite forwards them to the configured backend.
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack(config) {
    // Prevent webpack from watching/resolving files inside standalone theme dirs.
    // Each theme under themes/* is its own standalone Next.js app with its own
    // node_modules — they must not be picked up by the root compiler.
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/themes/*/node_modules/**',
        '**/themes/*/.next/**',
        '**/node_modules/**',
      ],
    };
    return config;
  },
  async rewrites() {
    return [
      // Same-origin API proxy. Lets the admin client call /api/* without
      // needing NEXT_PUBLIC_API_URL configured — the rewrite forwards every
      // request to the backend host. Self-hosted customers run admin and
      // backend on the same machine, so this just works out of the box.
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
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
