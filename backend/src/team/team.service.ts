import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { theme?: string, isActive?: boolean }): Promise<any[]> {
        return (this.prisma as any).teamMember.findMany({
            where: {
                ...(filters.theme ? { theme: filters.theme } : {}),
                ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
            },
            orderBy: { order: 'asc' },
        });
    }

    async findById(id: string): Promise<any | null> {
        return (this.prisma as any).teamMember.findUnique({ where: { id } });
    }

    async create(data: any): Promise<any> {
        return (this.prisma as any).teamMember.create({ data });
    }

    async update(id: string, data: any): Promise<any> {
        return (this.prisma as any).teamMember.update({ where: { id }, data });
    }

    async remove(id: string): Promise<any> {
        return (this.prisma as any).teamMember.delete({ where: { id } });
    }
}
