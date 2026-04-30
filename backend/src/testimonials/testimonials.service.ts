import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { theme?: string, isActive?: boolean }): Promise<any[]> {
        return (this.prisma as any).testimonial.findMany({
            where: {
                ...(filters.theme ? { theme: filters.theme } : {}),
                ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
            },
            orderBy: { order: 'asc' },
        });
    }

    async findById(id: string): Promise<any | null> {
        return (this.prisma as any).testimonial.findUnique({ where: { id } });
    }

    async create(data: any): Promise<any> {
        return (this.prisma as any).testimonial.create({ data });
    }

    async update(id: string, data: any): Promise<any> {
        return (this.prisma as any).testimonial.update({ where: { id }, data });
    }

    async remove(id: string): Promise<any> {
        return (this.prisma as any).testimonial.delete({ where: { id } });
    }
}
