import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: any) {
        return this.prisma.collection.create({ data: dto });
    }

    async findAll() {
        return this.prisma.collection.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const collection = await this.prisma.collection.findUnique({ where: { id } });
        if (!collection) throw new NotFoundException(`Collection ${id} not found`);
        return collection;
    }

    async findBySlug(slug: string) {
        const collection = await this.prisma.collection.findUnique({ where: { slug } });
        if (!collection) throw new NotFoundException(`Collection "${slug}" not found`);
        return collection;
    }

    async update(id: string, dto: any) {
        return this.prisma.collection.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        return this.prisma.collection.delete({ where: { id } });
    }
}
