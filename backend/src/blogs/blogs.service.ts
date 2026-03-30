import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { SeoMetaService } from '../seo-meta/seo-meta.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { sanitizeContent } from '../common/sanitize.util';

@Injectable()
export class BlogsService {
    constructor(
        private prisma: PrismaService,
        private seoMetaService: SeoMetaService,
        private notificationsService: NotificationsService,
        private webhooksService: WebhooksService,
    ) { }

    async create(authorId: string, createPostDto: any) {
        const { categories, tags, seo, ...postData } = createPostDto;

        const { title, slug, content, excerpt, coverImage, status, featured, publishedAt } = postData;
        const data: any = {
            title,
            slug,
            content: sanitizeContent(content),
            excerpt,
            coverImage,
            status: status || 'DRAFT',
            featured: featured || false,
            authorId,
            publishedAt: status === 'PUBLISHED' ? new Date() : (publishedAt || null)
        };

        if (categories && categories.length > 0) {
            data.categories = {
                connect: categories.map((id: string) => ({ id }))
            };
        }

        if (tags && tags.length > 0) {
            data.tags = {
                connectOrCreate: tags.map((tag: string) => ({
                    where: { name: tag },
                    create: { name: tag, slug: tag.toLowerCase().replace(/ /g, '-') }
                }))
            };
        }

        const activeThemeSetting = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });
        data.theme = activeThemeSetting?.value || null;

        const post = await (this.prisma as any).post.create({ data });

        if (seo) {
            await this.seoMetaService.upsert({
                pageType: 'post',
                pageId: post.id,
                ...seo,
            });
        }

        await this.notificationsService.create({
            type: 'SUCCESS',
            title: 'New Blog Post',
            message: `Blog post "${post.title}" was created.`,
            link: `/dashboard/blog?edit=${post.id}`,
            targetRole: 'Admin'
        });

        if (post.status === 'PUBLISHED') {
            this.webhooksService.dispatch('post.published', { id: post.id, title: post.title, slug: post.slug }).catch(() => { });
        }

        return post;
    }

    async findAll(status?: string, category?: string, tag?: string) {
        const where: any = {};
        if (status) where.status = status;
        if (category) where.categories = { some: { slug: category } };
        if (tag) where.tags = { some: { slug: tag } };

        const posts = await (this.prisma as any).post.findMany({
            where,
            include: {
                author: { select: { name: true, email: true } },
                categories: true,
                tags: true,
                _count: { select: { comments: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        const postsWithSeo = await Promise.all(posts.map(async (post: any) => {
            const seo = await this.seoMetaService.findByPage('post', post.id);
            return { ...post, seo };
        }));

        return postsWithSeo;
    }

    async findOne(slug: string) {
        const post = await (this.prisma as any).post.findUnique({
            where: { slug },
            include: {
                author: { select: { name: true, email: true } },
                categories: true,
                tags: true,
                comments: { include: { user: true }, orderBy: { createdAt: 'desc' } }
            },
        });

        if (post) {
            const seo = await this.seoMetaService.findByPage('post', post.id);
            return { ...post, seo };
        }
        return null;
    }

    async findById(id: string) {
        const post = await (this.prisma as any).post.findUnique({
            where: { id },
            include: {
                author: { select: { name: true, email: true } },
                categories: true,
                tags: true,
            },
        });

        if (post) {
            const seo = await this.seoMetaService.findByPage('post', post.id);
            return { ...post, seo };
        }
        return null;
    }

    async update(id: string, updatePostDto: any) {
        const { categories, tags, seo, ...postData } = updatePostDto;
        const { title, slug, content, excerpt, coverImage, status, featured, publishedAt } = postData;
        const data: any = {
            title,
            slug,
            content: sanitizeContent(content),
            excerpt,
            coverImage,
            status,
            featured,
            publishedAt
        };

        if (categories) {
            data.categories = {
                set: [], // Clear existing relations
                connect: categories.map((id: string) => ({ id }))
            };
        }

        if (tags) {
            data.tags = {
                set: [],
                connectOrCreate: tags.map((tag: string) => ({
                    where: { name: tag },
                    create: { name: tag, slug: tag.toLowerCase().replace(/ /g, '-') }
                }))
            };
        }

        const post = await (this.prisma as any).post.update({
            where: { id },
            data,
        });

        if (seo) {
            await this.seoMetaService.upsert({
                pageType: 'post',
                pageId: post.id,
                ...seo,
            });
        }

        await this.notificationsService.create({
            type: 'INFO',
            title: 'Blog Post Updated',
            message: `Blog post "${post.title}" was updated.`,
            link: `/dashboard/blog?edit=${post.id}`,
            targetRole: 'Admin'
        });

        const event = post.status === 'PUBLISHED' ? 'post.published' : 'post.updated';
        this.webhooksService.dispatch(event, { id: post.id, title: post.title, slug: post.slug, status: post.status }).catch(() => { });

        return post;
    }

    async remove(id: string) {
        const post = await (this.prisma as any).post.findUnique({ where: { id } });
        if (post) {
            await this.seoMetaService.deleteByPage('post', id);
            await this.notificationsService.create({
                type: 'DANGER',
                title: 'Blog Post Deleted',
                message: `Blog post "${post.title}" was deleted.`,
                targetRole: 'Admin'
            });
        }
        const deleted = await (this.prisma as any).post.delete({ where: { id } });
        this.webhooksService.dispatch('post.deleted', { id, title: post?.title }).catch(() => { });
        return deleted;
    }

    async bulkDelete(ids: string[]) {
        // Clean up SEO meta for each post
        for (const id of ids) {
            await this.seoMetaService.deleteByPage('post', id).catch(() => { });
        }
        const result = await (this.prisma as any).post.deleteMany({ where: { id: { in: ids } } });
        return { deleted: result.count };
    }

    async bulkUpdateStatus(ids: string[], status: string) {
        const result = await (this.prisma as any).post.updateMany({
            where: { id: { in: ids } },
            data: {
                status,
                ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
            },
        });
        return { updated: result.count };
    }

    async duplicate(id: string, authorId: string) {
        const post = await (this.prisma as any).post.findUnique({
            where: { id },
            include: {
                categories: { select: { id: true } },
                tags: { select: { id: true } },
            },
        });
        if (!post) throw new Error(`Post ${id} not found`);

        const baseSlug = `${post.slug}-copy`;
        let slug = baseSlug;
        let suffix = 1;
        while (await (this.prisma as any).post.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${suffix++}`;
        }

        return (this.prisma as any).post.create({
            data: {
                title: `${post.title} (Copy)`,
                slug,
                content: post.content,
                excerpt: post.excerpt,
                coverImage: post.coverImage,
                status: 'DRAFT',
                featured: false,
                authorId,
                categories: { connect: post.categories.map((c: any) => ({ id: c.id })) },
                tags: { connect: post.tags.map((t: any) => ({ id: t.id })) },
            },
        });
    }

    // Public methods (no auth required)
    async findPublished(page: number = 1, limit: number = 10, category?: string, tag?: string, featured?: boolean) {
        const skip = (page - 1) * limit;
        const where: any = { status: 'PUBLISHED' };

        if (category) where.categories = { some: { slug: category } };
        if (tag) where.tags = { some: { slug: tag } };
        if (featured) where.featured = true;

        const [posts, total] = await Promise.all([
            (this.prisma as any).post.findMany({
                where,
                include: {
                    author: { select: { name: true, avatar: true } },
                    categories: true,
                    tags: true,
                    _count: { select: { comments: true } }
                },
                orderBy: { publishedAt: 'desc' },
                skip,
                take: limit,
            }),
            (this.prisma as any).post.count({ where }),
        ]);

        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findPublishedBySlug(slug: string) {
        const post = await (this.prisma as any).post.findFirst({
            where: { slug, status: 'PUBLISHED' },
            include: {
                author: { select: { name: true, avatar: true, bio: true } },
                categories: true,
                tags: true,
                comments: {
                    where: { status: 'APPROVED' },
                    include: { user: { select: { name: true, avatar: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                _count: { select: { comments: true } }
            },
        });

        if (!post) {
            throw new Error('Post not found');
        }

        // Get related posts (same category, excluding current post)
        const relatedPosts = await (this.prisma as any).post.findMany({
            where: {
                status: 'PUBLISHED',
                id: { not: post.id },
                categories: {
                    some: {
                        id: { in: post.categories.map((c: any) => c.id) }
                    }
                }
            },
            include: {
                author: { select: { name: true, avatar: true } },
                categories: true,
                _count: { select: { comments: true } }
            },
            take: 3,
            orderBy: { publishedAt: 'desc' },
        });

        return {
            ...post,
            featuredImageUrl: post.coverImage ?? null,
            seo: await this.seoMetaService.findByPage('post', post.id),
            relatedPosts,
        };
    }
}
