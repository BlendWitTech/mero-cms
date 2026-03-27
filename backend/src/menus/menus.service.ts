import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const { items, ...menuData } = data;
        const siteSettings = await (this.prisma as any).setting.findMany({
            where: { key: 'active_theme' }
        });
        const activeTheme = siteSettings[0]?.value;

        return this.prisma.menu.create({
            data: {
                ...menuData,
                theme: activeTheme,
                items: {
                    create: items || []
                }
            },
            include: { items: true }
        });
    }

    async findAll() {
        return this.prisma.menu.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!menu) throw new NotFoundException(`Menu with ID ${id} not found`);
        return menu;
    }

    async findBySlug(slug: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { slug },
            include: { items: { orderBy: { order: 'asc' } } }
        });
        if (!menu) throw new NotFoundException(`Menu with slug ${slug} not found`);
        return menu;
    }

    async update(id: string, data: any) {
        const { items, ...menuData } = data;
        // Only keep safe fields for menu update
        const safeMenuData: any = {};
        if (menuData.name !== undefined) safeMenuData.name = menuData.name;
        if (menuData.slug !== undefined) safeMenuData.slug = menuData.slug;

        if (items && Array.isArray(items)) {
            // Strip DB-managed / relation fields so Prisma nested create doesn't fail
            const cleanItems = items.map((item: any, idx: number) => ({
                label: item.label || '',
                url: item.url || '',
                target: item.target || '_self',
                order: item.order ?? idx,
                parentId: item.parentId ?? null,
            }));
            await this.prisma.menuItem.deleteMany({ where: { menuId: id } });
            return this.prisma.menu.update({
                where: { id },
                data: {
                    ...safeMenuData,
                    items: { create: cleanItems }
                },
                include: { items: { orderBy: { order: 'asc' } } }
            });
        }

        return this.prisma.menu.update({
            where: { id },
            data: safeMenuData,
            include: { items: { orderBy: { order: 'asc' } } }
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.menu.delete({ where: { id } });
    }
}
