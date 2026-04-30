import type { MetadataRoute } from 'next';
import { getPosts, getSiteData } from '@/lib/api';

/**
 * sitemap.xml generator.
 *
 * Static routes (home, pricing, features, about, contact, blog, etc.)
 * are listed unconditionally. Dynamic routes (each blog post) come
 * from /public/posts. Pages authored in the admin would also be added
 * here from `siteData.pages`.
 *
 * Site URL precedence: `siteData.settings.siteUrl` (admin-configurable) →
 * `NEXT_PUBLIC_SITE_URL` env var (legacy) → `http://localhost:3002`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [postsRes, site] = await Promise.all([getPosts(1, 200), getSiteData()]);

    const SITE_URL =
        site?.settings?.siteUrl?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3002';

    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        '',
        '/pricing',
        '/features',
        '/contact',
        '/about',
        '/blog',
        '/customers',
        '/careers',
        '/changelog',
        '/roadmap',
        '/themes',
        '/docs',
        '/docs/api',
        '/legal/terms',
        '/legal/privacy',
        '/legal/security',
        '/legal/dpa',
    ].map(path => ({
        url: `${SITE_URL}${path}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: path === '' ? 1.0 : 0.7,
    }));

    const blogRoutes: MetadataRoute.Sitemap = postsRes.data.map(post => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    // Pages authored in the admin (about, contact, etc. when CMS-backed).
    const cmsPageRoutes: MetadataRoute.Sitemap =
        site?.pages?.map(p => ({
            url: `${SITE_URL}/${p.slug}`,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
            changeFrequency: 'weekly' as const,
            priority: 0.65,
        })) || [];

    return [...staticRoutes, ...blogRoutes, ...cmsPageRoutes];
}
