import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { status?: string, search?: string }): Promise<any[]> {
        return (this.prisma as any).lead.findMany({
            where: {
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.search ? {
                    OR: [
                        { name: { contains: filters.search, mode: 'insensitive' } },
                        { email: { contains: filters.search, mode: 'insensitive' } },
                        { company: { contains: filters.search, mode: 'insensitive' } },
                    ],
                } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string): Promise<any | null> {
        return (this.prisma as any).lead.findUnique({ where: { id } });
    }

    async create(data: any): Promise<any> {
        return (this.prisma as any).lead.create({ data });
    }

    async update(id: string, data: any): Promise<any> {
        return (this.prisma as any).lead.update({ where: { id }, data });
    }

    async remove(id: string): Promise<any> {
        return (this.prisma as any).lead.delete({ where: { id } });
    }

    /**
     * Daily lead counts for the last `days` days (zero-filled). Used by
     * the dashboard's leads-over-time chart.
     *
     * Why we zero-fill in code instead of SQL: Postgres can do
     * generate_series + LEFT JOIN, but that requires raw SQL which
     * differs by dialect. Doing it in app land keeps us portable to
     * MySQL/SQLite if we ever add them.
     */
    async countByDay(days: number): Promise<Array<{ date: string; count: number }>> {
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (days - 1));

        const rows: Array<{ createdAt: Date }> = await (this.prisma as any).lead.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true },
        });

        // Bucket into a map keyed by YYYY-MM-DD.
        const buckets = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            buckets.set(this.toIsoDate(d), 0);
        }
        for (const row of rows) {
            const key = this.toIsoDate(row.createdAt);
            if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
        }

        return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
    }

    private toIsoDate(d: Date): string {
        return d.toISOString().slice(0, 10);
    }
}
