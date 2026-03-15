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

        // Simplified update: delete current items and recreate
        // In a production app, we'd do a more sophisticated sync (upsert/delete)
        if (items) {
            await this.prisma.menuItem.deleteMany({ where: { menuId: id } });
            return this.prisma.menu.update({
                where: { id },
                data: {
                    ...menuData,
                    items: {
                        create: items
                    }
                },
                include: { items: true }
            });
        }

        return this.prisma.menu.update({
            where: { id },
            data: menuData,
            include: { items: true }
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.menu.delete({ where: { id } });
    }
}
