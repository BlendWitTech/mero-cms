import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeoMetaService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const safe = async (fn: () => Promise<number>): Promise<number> => {
            try { return await fn(); } catch { return 0; }
        };

        // 1. Count total content items that exist in this CMS
        const [totalPosts, totalPages, totalPlots] = await Promise.all([
            safe(() => this.prisma.post.count()),
            safe(() => (this.prisma as any).page.count()),
            safe(() => this.prisma.plot.count()),
        ]);
        const combinedTotal = totalPosts + totalPages + totalPlots;

        // 2. Count items with SEO metadata
        const [postsWithSeo, pagesWithSeo, plotsWithSeo] = await Promise.all([
            safe(() => (this.prisma as any).seoMeta.count({
                where: { pageType: { in: ['post', 'POST'] }, pageId: { not: null } }
            })),
            safe(() => (this.prisma as any).seoMeta.count({
                where: { pageType: { in: ['page', 'PAGE'] }, pageId: { not: null } }
            })),
            // Plots store SEO as a JSON field directly on the Plot model
            safe(() => (this.prisma as any).plot.count({ where: { seo: { not: null } } })),
        ]);

        const itemsWithSeo = Math.min(combinedTotal, postsWithSeo + pagesWithSeo + plotsWithSeo);

        // 3. Count active redirects
        const activeRedirects = await safe(() => this.prisma.redirect.count({ where: { isActive: true } }));

        return {
            totalPosts: combinedTotal,
            postsWithSeo: itemsWithSeo,
            redirects: activeRedirects,
            sitemapLastGenerated: new Date(),
        };
    }

    async getContentList() {
        const safeFind = async (fn: () => Promise<any[]>): Promise<any[]> => {
            try { return await fn(); } catch { return []; }
        };

        const [posts, pages, plots] = await Promise.all([
            safeFind(() => (this.prisma as any).post.findMany({
                select: { id: true, title: true, slug: true, status: true },
                orderBy: { updatedAt: 'desc' }
            })),
            safeFind(() => (this.prisma as any).page.findMany({
                select: { id: true, title: true, slug: true, status: true },
                orderBy: { updatedAt: 'desc' }
            })),
            safeFind(() => (this.prisma as any).plot.findMany({
                select: { id: true, title: true, slug: true, status: true, seo: true },
                orderBy: { updatedAt: 'desc' }
            })),
        ]);

        const allMeta = await safeFind(() => (this.prisma as any).seoMeta.findMany({
            where: {
                OR: [
                    { pageType: { in: ['post', 'POST'] } },
                    { pageType: { in: ['page', 'PAGE'] } },
                ]
            }
        }));

        const metaMap = new Map();
        allMeta.forEach(m => {
            if (m.pageId) {
                metaMap.set(`${m.pageType.toLowerCase()}:${m.pageId}`, m);
            }
        });

        // Fetch SEO meta for static theme pages (keyed by slug, no pageId)
        const staticMeta = await safeFind(() => (this.prisma as any).seoMeta.findMany({
            where: { pageType: { in: ['static', 'STATIC'] } }
        }));
        const staticMetaMap = new Map();
        staticMeta.forEach(m => {
            if (m.pageId) staticMetaMap.set(m.pageId, m); // pageId holds the slug for static pages
        });

        // Static theme pages (always present regardless of DB content)
        const staticPages = [
            { id: 'static-home', title: 'Home', slug: '/', pageId: 'home' },
            { id: 'static-about', title: 'About Us', slug: '/about', pageId: 'about' },
            { id: 'static-plots', title: 'Plots Listing', slug: '/plots', pageId: 'plots' },
            { id: 'static-services', title: 'Services', slug: '/services', pageId: 'services' },
            { id: 'static-blog', title: 'Blog Listing', slug: '/blog', pageId: 'blog' },
            { id: 'static-contact', title: 'Contact', slug: '/contact', pageId: 'contact' },
        ];

        // Slugs already covered by static pages — exclude to avoid duplicates
        const reservedSlugs = new Set(['home', 'about', 'plots', 'services', 'blog', 'contact']);
        const filteredPages = pages.filter(p => !reservedSlugs.has(p.slug));

        return [
            // Static theme pages first
            ...staticPages.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                type: 'static',
                status: 'PUBLISHED',
                seo: staticMetaMap.get(p.pageId) || null,
                lastModified: new Date(),
            })),
            ...filteredPages.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug === 'home' ? '/' : `/${p.slug}`,
                type: 'page',
                status: p.status,
                seo: metaMap.get(`page:${p.id}`) || null,
                lastModified: new Date(),
            })),
            ...posts.map(p => ({
                id: p.id,
                title: p.title,
                slug: `/blog/${p.slug}`,
                type: 'post',
                status: p.status,
                seo: metaMap.get(`post:${p.id}`) || null,
                lastModified: new Date(),
            })),
            ...plots.map(p => ({
                id: p.id,
                title: p.title,
                slug: `/plots/${p.slug}`,
                type: 'plot',
                status: p.status,
                seo: p.seo || null,
                lastModified: new Date(),
            })),
        ];
    }

    async findByPage(pageType: string, pageId?: string) {
        const type = pageType.toLowerCase();
        return (this.prisma as any).seoMeta.findFirst({
            where: {
                pageType: { in: [type, type.toUpperCase()] },
                pageId: pageId || null
            },
        });
    }

    async upsert(data: any) {
        const { pageType, pageId, ...rest } = data;
        const type = pageType?.toLowerCase();

        const existing = await (this.prisma as any).seoMeta.findFirst({
            where: {
                pageType: { in: [type, type?.toUpperCase()] },
                pageId: pageId || null
            },
        });

        if (existing) {
            return (this.prisma as any).seoMeta.update({
                where: { id: existing.id },
                data: rest,
            });
        }

        return (this.prisma as any).seoMeta.create({
            data: { pageType: type, pageId, ...rest },
        });
    }

    async delete(id: string) {
        return (this.prisma as any).seoMeta.delete({
            where: { id },
        });
    }

    async deleteByPage(pageType: string, pageId: string) {
        const type = pageType.toLowerCase();
        const existing = await this.findByPage(type, pageId);
        if (existing) {
            return (this.prisma as any).seoMeta.delete({
                where: { id: existing.id }
            });
        }
    }

    async analyzeSeo(content: string, meta: any) {
        const suggestions: string[] = [];
        const warnings: string[] = [];
        let score = 100;

        // Title analysis
        if (!meta?.title) {
            warnings.push('Missing meta title');
            score -= 15;
        } else if (meta.title.length < 30) {
            suggestions.push('Title is too short (recommended: 50-60 characters)');
            score -= 5;
        } else if (meta.title.length > 60) {
            warnings.push('Title is too long (recommended: 50-60 characters)');
            score -= 10;
        }

        // Description analysis
        if (!meta?.description) {
            warnings.push('Missing meta description');
            score -= 15;
        } else if (meta.description.length < 120) {
            suggestions.push('Description is too short (recommended: 150-160 characters)');
            score -= 5;
        } else if (meta.description.length > 160) {
            warnings.push('Description is too long (recommended: 150-160 characters)');
            score -= 10;
        }

        // Open Graph
        if (!meta?.ogImage) {
            suggestions.push('Add an Open Graph image for better social sharing');
            score -= 5;
        }

        // Content analysis
        const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
        const h1Count = (content.match(/<h1[^>]*>.*?<\/h1>/gi) || []).length;

        if (h1Count === 0) {
            warnings.push('Missing H1 heading');
            score -= 10;
        } else if (h1Count > 1) {
            warnings.push('Multiple H1 headings found (should have only one)');
            score -= 5;
        }

        if (headings.length < 2) {
            suggestions.push('Add more headings to improve content structure');
            score -= 3;
        }

        // Image alt text
        const images = content.match(/<img[^>]*>/gi) || [];
        const imagesWithoutAlt = images.filter(img => !img.includes('alt=')).length;
        if (imagesWithoutAlt > 0) {
            warnings.push(`${imagesWithoutAlt} image(s) missing alt text`);
            score -= Math.min(imagesWithoutAlt * 2, 10);
        }

        // Links
        const links = content.match(/<a[^>]*href=[^>]*>/gi) || [];
        const externalLinks = links.filter(link => link.includes('http')).length;
        if (links.length === 0) {
            suggestions.push('Consider adding internal links to improve SEO');
            score -= 3;
        }

        // Content length
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 300) {
            suggestions.push('Content is short (recommended: 300+ words for better SEO)');
            score -= 5;
        }

        return {
            score: Math.max(0, score),
            suggestions,
            warnings,
            stats: {
                titleLength: meta?.title?.length || 0,
                descriptionLength: meta?.description?.length || 0,
                h1Count,
                headingCount: headings.length,
                imageCount: images.length,
                imagesWithoutAlt,
                linkCount: links.length,
                externalLinkCount: externalLinks,
                wordCount,
            },
        };
    }
}
