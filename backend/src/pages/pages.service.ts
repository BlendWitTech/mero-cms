import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SeoMetaService } from '../seo-meta/seo-meta.service';

@Injectable()
export class PagesService {
    constructor(
        private prisma: PrismaService,
        private seoMetaService: SeoMetaService,
        private notificationsService: NotificationsService
    ) { }

    async create(createPageDto: any) {
        const { seo, ...pageData } = createPageDto;
        
        const activeThemeSetting = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });
        const theme = activeThemeSetting?.value || null;

        const page = await (this.prisma as any).page.create({
            data: {
                ...pageData,
                theme
            }
        });

        if (seo) {
            await this.seoMetaService.upsert({
                pageType: 'page',
                pageId: page.id,
                title: seo.title,
                description: seo.description
            });
        }

        await this.notificationsService.create({
            type: 'SUCCESS',
            title: 'New Static Page',
            message: `Static page "${page.title}" was created.`,
            link: `/dashboard/pages?edit=${page.id}`,
            targetRole: 'Admin'
        });

        return page;
    }

    async findAll() {
        const activeThemeSetting = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });
        const activeTheme = activeThemeSetting?.value || null;

        const pages = await (this.prisma as any).page.findMany({
            where: activeTheme ? { theme: activeTheme } : undefined,
            orderBy: { updatedAt: 'desc' },
        });

        const pagesWithSeo = await Promise.all(pages.map(async (page: any) => {
            const seo = await this.seoMetaService.findByPage('page', page.id);
            return { ...page, seo };
        }));

        return pagesWithSeo;
    }

    async findById(idOrSlug: string) {
        // Try to find by ID (UUID format)
        let page: any = null;
        const isUuid = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(idOrSlug);

        if (isUuid) {
            page = await (this.prisma as any).page.findUnique({
                where: { id: idOrSlug },
            });
        }

        // If not found by ID, try format as slug
        if (!page) {
            page = await (this.prisma as any).page.findUnique({
                where: { slug: idOrSlug },
            });
        }

        if (page) {
            const seo = await this.seoMetaService.findByPage('page', page.id);
            return { ...page, seo };
        }

        throw new NotFoundException(`Page with identifier '${idOrSlug}' not found`);
    }

    async update(idOrSlug: string, updatePageDto: any) {
        // Resolve ID first
        let id = idOrSlug;
        const isUuid = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(idOrSlug);

        if (!isUuid) {
            const existing = await (this.prisma as any).page.findUnique({ where: { slug: idOrSlug } });
            if (existing) id = existing.id;
        }

        console.log('Update Page Payload:', JSON.stringify(updatePageDto, null, 2));

        const { seo, ...pageData } = updatePageDto;
        const data: any = { ...pageData };

        const page = await (this.prisma as any).page.update({
            where: { id },
            data,
        });

        if (seo) {
            await this.seoMetaService.upsert({
                pageType: 'page',
                pageId: page.id,
                title: seo.title,
                description: seo.description
            });
        }

        await this.notificationsService.create({
            type: 'INFO',
            title: 'Static Page Updated',
            message: `Static page "${page.title}" was updated.`,
            link: `/dashboard/pages?edit=${page.id}`,
            targetRole: 'Admin'
        });

        return page;
    }

    async remove(id: string) {
        const page = await (this.prisma as any).page.findUnique({ where: { id } });
        if (page) {
            await this.seoMetaService.deleteByPage('page', id);
            await this.notificationsService.create({
                type: 'DANGER',
                title: 'Static Page Deleted',
                message: `Static page "${page.title}" was deleted.`,
                targetRole: 'Admin'
            });
        }
        return (this.prisma as any).page.delete({
            where: { id },
        });
    }

    /** Upsert a page by slug — used by the Site Pages section editor. */
    async upsertBySlug(slug, dto) {
        const existing = await (this.prisma as any).page.findFirst({ where: { slug } });
        if (existing) {
            return (this.prisma as any).page.update({
                where: { id: existing.id },
                data: {
                    ...(dto.title ? { title: dto.title } : {}),
                    ...(dto.data !== undefined ? { data: dto.data } : {}),
                    ...(dto.status ? { status: dto.status } : {}),
                },
            });
        }

        const activeThemeSetting = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });

        return (this.prisma as any).page.create({
            data: {
                slug,
                title: dto.title || slug,
                data: dto.data || {},
                status: dto.status || 'PUBLISHED',
                theme: activeThemeSetting?.value || null
            },
        });
    }

}