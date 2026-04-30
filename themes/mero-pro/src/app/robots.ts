import type { MetadataRoute } from 'next';
import { getSiteData } from '@/lib/api';

/**
 * robots.txt generator. Uses the standard rule set: allow everything
 * except admin + auth + uploads. Points search engines at the sitemap.
 *
 * Site URL precedence: `siteData.settings.siteUrl` (admin-configurable) →
 * `NEXT_PUBLIC_SITE_URL` env var (legacy) → `http://localhost:3002`.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
    const site = await getSiteData();
    const SITE_URL =
        site?.settings?.siteUrl?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3002';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/login', '/signup', '/uploads', '/api'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
