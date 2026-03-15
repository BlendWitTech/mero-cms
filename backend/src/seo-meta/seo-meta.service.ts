import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeoMetaService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        // 1. Count total posts, pages and projects
        const totalPosts = await (this.prisma as any).post.count();
        const totalPages = await (this.prisma as any).page.count();
        const totalProjects = await (this.prisma as any).project.count();
        const combinedTotal = totalPosts + totalPages + totalProjects;

        // 2. Count items with SEO metadata (only those that actually exist in their respective tables)
        const [postsWithSeo, pagesWithSeo, projectsWithSeo] = await Promise.all([
            (this.prisma as any).seoMeta.count({
                where: {
                    pageType: { in: ['post', 'POST'] },
                    pageId: { not: null },
                }
            }),
            (this.prisma as any).seoMeta.count({
                where: {
                    pageType: { in: ['page', 'PAGE'] },
                    pageId: { not: null }
                }
            }),
            (this.prisma as any).seoMeta.count({
                where: {
                    pageType: { in: ['project', 'PROJECT', 'Project'] }
                }
            })
        ]);

        // To be 100% accurate, we should count occurrences in metaMap
        // But for dashboard stats, we'll cap it at the total content count to avoid score > 100
        const itemsWithSeo = Math.min(combinedTotal, postsWithSeo + pagesWithSeo + projectsWithSeo);

        // 3. Count active redirects
        const activeRedirects = await (this.prisma as any).redirect.count({
            where: { isActive: true }
        });

        return {
            totalPosts: combinedTotal,
            postsWithSeo: itemsWithSeo,
            redirects: activeRedirects,
            sitemapLastGenerated: new Date(),
        };
    }

    async getContentList() {
        const posts = await (this.prisma as any).post.findMany({
            select: { id: true, title: true, slug: true, status: true },
            orderBy: { updatedAt: 'desc' }
        });

        const pages = await (this.prisma as any).page.findMany({
            select: { id: true, title: true, slug: true, status: true },
            orderBy: { updatedAt: 'desc' }
        });

        const projects = await (this.prisma as any).project.findMany({
            select: { id: true, title: true, slug: true, status: true },
            orderBy: { updatedAt: 'desc' }
        });

        const allMeta = await (this.prisma as any).seoMeta.findMany({
            where: {
                OR: [
                    { pageType: { in: ['post', 'POST'] } },
                    { pageType: { in: ['page', 'PAGE'] } },
                    { pageType: { in: ['project', 'PROJECT', 'Project'] } }
                ]
            }
        });

        const metaMap = new Map();
        allMeta.forEach(m => {
            if (m.pageId) {
                metaMap.set(`${m.pageType.toLowerCase()}:${m.pageId}`, m);
            }
        });

        return [
            ...pages.map(p => ({
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
            ...projects.map(p => ({
                id: p.id,
                title: p.title,
                slug: `/projects/${p.slug}`,
                type: 'project',
                status: p.status,
                seo: metaMap.get(`project:${p.id}`) || null,
                lastModified: new Date(),
            }))
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
