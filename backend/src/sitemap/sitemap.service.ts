import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SitemapService {
    constructor(
        private prisma: PrismaService,
        // SettingsService.getSiteUrl() is the canonical way to resolve
        // the public site URL. Falls through to FRONTEND_URL/APP_URL/
        // NEXT_PUBLIC_SITE_URL env vars when no DB setting is set.
        private settings: SettingsService,
    ) { }

    async generateSitemap() {
        const baseUrl = await this.settings.getSiteUrl();

        // Get all published posts
        const posts = await this.prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                slug: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Get all published pages
        const pages = await this.prisma.page.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                slug: true,
                updatedAt: true,
            },
        });

        // Get all categories
        const categories = await this.prisma.category.findMany({
            select: {
                slug: true,
                updatedAt: true,
            },
        });

        // Get all tags
        const tags = await this.prisma.tag.findMany({
            select: {
                slug: true,
                updatedAt: true,
            },
        });

        // Build sitemap XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Homepage
        xml += this.createUrlEntry(`${baseUrl}/`, new Date(), 'daily', '1.0');

        // Pages
        pages.forEach(page => {
            const loc = page.slug === 'home' ? `${baseUrl}/` : `${baseUrl}/${page.slug}`;
            if (page.slug !== 'home') {
                xml += this.createUrlEntry(loc, page.updatedAt, 'monthly', '0.8');
            }
        });

        // Blog index
        xml += this.createUrlEntry(`${baseUrl}/blog`, new Date(), 'daily', '0.9');

        // Blog posts
        posts.forEach(post => {
            xml += this.createUrlEntry(
                `${baseUrl}/blog/${post.slug}`,
                post.updatedAt,
                'weekly',
                '0.8'
            );
        });

        // Categories
        categories.forEach(category => {
            xml += this.createUrlEntry(
                `${baseUrl}/blog/category/${category.slug}`,
                category.updatedAt,
                'weekly',
                '0.7'
            );
        });

        // Tags
        tags.forEach(tag => {
            xml += this.createUrlEntry(
                `${baseUrl}/blog/tag/${tag.slug}`,
                tag.updatedAt,
                'weekly',
                '0.6'
            );
        });

        xml += '</urlset>';

        return xml;
    }

    async generatePostsSitemap() {
        const baseUrl = await this.settings.getSiteUrl();

        const posts = await this.prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                slug: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        posts.forEach(post => {
            xml += this.createUrlEntry(
                `${baseUrl}/blog/${post.slug}`,
                post.updatedAt,
                'weekly',
                '0.8'
            );
        });

        xml += '</urlset>';

        return xml;
    }

    async generateSitemapIndex() {
        const baseUrl = await this.settings.getSiteUrl();

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Main sitemap
        xml += this.createSitemapEntry(`${baseUrl}/sitemap.xml`, new Date());

        // Posts sitemap
        xml += this.createSitemapEntry(`${baseUrl}/sitemap-posts.xml`, new Date());

        xml += '</sitemapindex>';

        return xml;
    }

    private createUrlEntry(
        loc: string,
        lastmod: Date,
        changefreq: string,
        priority: string
    ): string {
        return `  <url>
    <loc>${this.escapeXml(loc)}</loc>
    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
    }

    private createSitemapEntry(loc: string, lastmod: Date): string {
        return `  <sitemap>
    <loc>${this.escapeXml(loc)}</loc>
    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
  </sitemap>\n`;
    }

    private escapeXml(unsafe: string): string {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
