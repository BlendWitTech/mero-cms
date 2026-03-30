import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentItemsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: any) {
        return this.prisma.collectionItem.create({ data: dto });
    }

    async findAll(collectionId?: string) {
        return this.prisma.collectionItem.findMany({
            where: collectionId ? { collectionId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const item = await this.prisma.collectionItem.findUnique({ where: { id } });
        if (!item) throw new NotFoundException(`Content item ${id} not found`);
        return item;
    }

    async update(id: string, dto: any) {
        return this.prisma.collectionItem.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        return this.prisma.collectionItem.delete({ where: { id } });
    }
}
