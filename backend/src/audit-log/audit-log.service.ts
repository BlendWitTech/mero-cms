import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
    constructor(private prisma: PrismaService) { }

    async log(userId: string, action: string, metadata?: any, status: 'INFO' | 'WARNING' | 'DANGER' = 'INFO') {
        return this.prisma.activityLog.create({
            data: {
                userId,
                action,
                metadata: metadata || {},
                status,
            },
        });
    }

    async findAll(userId?: string, limit = 50) {
        const whereClause = userId ? { userId } : {};

        return this.prisma.activityLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: { select: { name: true } }
                    }
                }
            }
        });
    }

    async findPaginated(filters: {
        userId?: string;
        action?: string;
        status?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
        if (filters.status) where.status = filters.status;
        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) where.createdAt.gte = new Date(filters.from);
            if (filters.to) where.createdAt.lte = new Date(filters.to);
        }

        const include = {
            user: { select: { name: true, email: true, role: { select: { name: true } } } }
        };

        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include }),
            this.prisma.activityLog.count({ where }),
        ]);

        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}
