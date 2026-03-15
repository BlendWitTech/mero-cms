import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestimonialsService {
    constructor(private prisma: PrismaService) { }

    async create(createTestimonialDto: any) {
        const siteSettings = await (this.prisma as any).setting.findMany({
            where: { key: 'active_theme' }
        });
        const activeTheme = siteSettings[0]?.value;

        return (this.prisma as any).testimonial.create({
            data: {
                ...createTestimonialDto,
                theme: activeTheme
            },
        });
    }

    async findAll() {
        return (this.prisma as any).testimonial.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return (this.prisma as any).testimonial.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateTestimonialDto: any) {
        return (this.prisma as any).testimonial.update({
            where: { id },
            data: updateTestimonialDto,
        });
    }

    async remove(id: string) {
        return (this.prisma as any).testimonial.delete({
            where: { id },
        });
    }

    async findFeatured(limit: number = 5) {
        return (this.prisma as any).testimonial.findMany({
            where: { rating: { gte: 4 } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
