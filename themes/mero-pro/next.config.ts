import type { NextConfig } from 'next';

// BACKEND_URL is server-only; the rewrite below forwards same-origin
// `/api/*` requests to the backend. Lets self-hosted customers run the
// theme without touching env vars — relative API paths just work.
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
    // Theme is served by the Mero backend at runtime — keep ISR on so the
    // home page stays fresh as admins edit copy in /admin.
    experimental: {
        // Lets us pass typed search params + dynamic content to RSC pages.
        typedRoutes: false,
    },
    images: {
        // Permissive remotePatterns so the customer doesn't need to
        // configure NEXT_PUBLIC_MEDIA_HOST. The actual security boundary
        // for media is the backend's `/api/media` ACL, not Next.js's host
        // whitelist; allowing any HTTPS host here just lets `<Image>`
        // render whatever the CMS sends back without env config.
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'http', hostname: '127.0.0.1' },
        ],
    },
    async rewrites() {
        return [
            {
                // Same-origin API proxy — admin and backend co-deployed get
                // zero env config. BACKEND_URL only used server-side.
                source: '/api/:path*',
                destination: `${BACKEND_URL}/:path*`,
            },
        ];
    },
};

export default nextConfig;
