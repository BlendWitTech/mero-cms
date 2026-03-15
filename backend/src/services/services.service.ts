import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    async create(createServiceDto: any) {
        const siteSettings = await (this.prisma as any).setting.findMany({
            where: { key: 'active_theme' }
        });
        const activeTheme = siteSettings[0]?.value;

        return (this.prisma as any).service.create({
            data: {
                ...createServiceDto,
                theme: activeTheme
            },
        });
    }

    async findAll() {
        return (this.prisma as any).service.findMany({
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: string) {
        return (this.prisma as any).service.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateServiceDto: any) {
        return (this.prisma as any).service.update({
            where: { id },
            data: updateServiceDto,
        });
    }

    async remove(id: string) {
        return (this.prisma as any).service.delete({
            where: { id },
        });
    }

    async reorder(updates: Array<{ id: string; order: number }>) {
        const promises = updates.map(({ id, order }) =>
            (this.prisma as any).service.update({
                where: { id },
                data: { order },
            })
        );
        return Promise.all(promises);
    }
}
