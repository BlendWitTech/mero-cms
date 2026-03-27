import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PlotsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) {}

    private async getActiveTheme(): Promise<string | null> {
        const s = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });
        return s?.value ?? null;
    }

    private buildPlotData(dto: any) {
        const { categoryId, ...rest } = dto;
        const data: any = { ...rest };
        if (categoryId) {
            data.category = { connect: { id: categoryId } };
        } else if ('categoryId' in dto) {
            data.category = { disconnect: true };
        }
        return data;
    }

    async create(dto: any) {
        const activeTheme = await this.getActiveTheme();
        const plot = await (this.prisma as any).plot.create({
            data: { ...this.buildPlotData(dto), theme: activeTheme },
            include: { category: true },
        });
        await this.notificationsService.create({
            type: 'SUCCESS',
            title: 'New Plot',
            message: `Plot "${plot.title}" was created.`,
            link: `/dashboard/plots?edit=${plot.id}`,
            targetRole: 'Admin',
        });
        return plot;
    }

    async findAll(status?: string, category?: string, featured?: boolean) {
        const activeTheme = await this.getActiveTheme();
        const where: any = {};
        if (activeTheme) where.theme = activeTheme;
        if (status) where.status = status;
        if (category) where.category = { slug: category };
        if (featured !== undefined) where.featured = featured;
        return (this.prisma as any).plot.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
        });
    }

    async findById(id: string) {
        return (this.prisma as any).plot.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    async findOne(slug: string) {
        return (this.prisma as any).plot.findUnique({
            where: { slug },
            include: { category: true },
        });
    }

    async update(id: string, dto: any) {
        const plot = await (this.prisma as any).plot.update({
            where: { id },
            data: this.buildPlotData(dto),
            include: { category: true },
        });
        await this.notificationsService.create({
            type: 'INFO',
            title: 'Plot Updated',
            message: `Plot "${plot.title}" was updated.`,
            link: `/dashboard/plots?edit=${plot.id}`,
            targetRole: 'Admin',
        });
        return plot;
    }

    async remove(id: string) {
        const plot = await (this.prisma as any).plot.findUnique({ where: { id } });
        if (plot) {
            await this.notificationsService.create({
                type: 'DANGER',
                title: 'Plot Deleted',
                message: `Plot "${plot.title}" was deleted.`,
                targetRole: 'Admin',
            });
        }
        return (this.prisma as any).plot.delete({ where: { id } });
    }

    // Public methods
    async findPublished(page = 1, limit = 10, category?: string, status?: string, search?: string) {
        const skip = (page - 1) * limit;
        const where: any = { NOT: { status: 'hidden' } };
        if (category) where.category = { slug: category };
        if (status) where.status = status;
        if (search) where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
        ];
        const [plots, total] = await Promise.all([
            (this.prisma as any).plot.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { category: true },
            }),
            (this.prisma as any).plot.count({ where }),
        ]);
        return {
            data: plots.map((p: any) => ({ ...p, featuredImageUrl: p.coverImage || null, images: p.gallery || [] })),
            total,
            page,
            limit,
        };
    }

    async findFeatured() {
        const activeTheme = await this.getActiveTheme();
        const plots = await (this.prisma as any).plot.findMany({
            where: { featured: true, NOT: { status: 'hidden' }, ...(activeTheme ? { theme: activeTheme } : {}) },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: { category: true },
        });
        return plots.map((p: any) => ({ ...p, featuredImageUrl: p.coverImage || null, images: p.gallery || [] }));
    }
}
