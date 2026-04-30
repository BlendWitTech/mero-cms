import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { theme?: string, isActive?: boolean }): Promise<any[]> {
        return (this.prisma as any).service.findMany({
            where: {
                ...(filters.theme ? { theme: filters.theme } : {}),
                ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
            },
            orderBy: { order: 'asc' },
        });
    }

    async findById(id: string): Promise<any | null> {
        return (this.prisma as any).service.findUnique({ where: { id } });
    }

    async create(data: any): Promise<any> {
        return (this.prisma as any).service.create({ data });
    }

    async update(id: string, data: any): Promise<any> {
        return (this.prisma as any).service.update({ where: { id }, data });
    }

    async remove(id: string): Promise<any> {
        return (this.prisma as any).service.delete({ where: { id } });
    }
}
