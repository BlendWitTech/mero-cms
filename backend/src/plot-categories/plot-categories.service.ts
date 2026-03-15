import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlotCategoriesService {
    constructor(private prisma: PrismaService) {}

    private async getActiveTheme(): Promise<string | null> {
        const s = await this.prisma.setting.findUnique({ where: { key: 'active_theme' } });
        return s?.value ?? null;
    }

    async create(data: { name: string; description?: string; slug?: string }) {
        const slug = data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const theme = await this.getActiveTheme();
        return (this.prisma as any).plotCategory.create({
            data: { ...data, slug, theme },
            include: { _count: { select: { plots: true } } },
        });
    }

    async findAll() {
        const activeTheme = await this.getActiveTheme();
        return (this.prisma as any).plotCategory.findMany({
            where: activeTheme ? { theme: activeTheme } : undefined,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { plots: true } } },
        });
    }

    async findOne(id: string) {
        const cat = await (this.prisma as any).plotCategory.findUnique({
            where: { id },
            include: { _count: { select: { plots: true } } },
        });
        if (!cat) throw new NotFoundException(`Plot Category ${id} not found`);
        return cat;
    }

    async update(id: string, data: { name?: string; description?: string; slug?: string }) {
        const cat = await (this.prisma as any).plotCategory.findUnique({ where: { id } });
        if (!cat) throw new NotFoundException(`Plot Category ${id} not found`);
        if (data.name && !data.slug && !cat.slug) {
            data.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        return (this.prisma as any).plotCategory.update({
            where: { id },
            data,
            include: { _count: { select: { plots: true } } },
        });
    }

    async remove(id: string) {
        return (this.prisma as any).plotCategory.delete({ where: { id } });
    }
}
