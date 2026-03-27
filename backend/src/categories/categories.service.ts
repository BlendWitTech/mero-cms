import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const { name, slug, description } = data;

        // Auto-generate slug if not provided
        const generatedSlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        return this.prisma.category.create({ data: { name, description, slug: generatedSlug } });
    }

    findAll() {
        return this.prisma.category.findMany({
            include: { _count: { select: { posts: true } } }
        });
    }

    findOne(id: string) {
        return this.prisma.category.findUnique({ where: { id } });
    }

    update(id: string, data: any) {
        const { name, slug, description } = data;
        return this.prisma.category.update({
            where: { id },
            data: { name, slug, description }
        });
    }

    remove(id: string) {
        return this.prisma.category.delete({ where: { id } });
    }
}
