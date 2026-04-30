import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Content scheduler — flips posts & pages whose `status = 'SCHEDULED'` and
 * `publishAt <= now` to `PUBLISHED`. Runs every minute. Idempotent: records
 * already past their publish time simply process once and stay published.
 */
@Injectable()
export class ContentSchedulerService {
    private readonly logger = new Logger(ContentSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly webhooks: WebhooksService,
        private readonly auditLog: AuditLogService,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE, { name: 'content-scheduler' })
    async publishDue() {
        const now = new Date();

        try {
            await this.publishDuePosts(now);
        } catch (err: any) {
            this.logger.error(`publishDuePosts failed: ${err?.message ?? err}`);
        }

        try {
            await this.publishDuePages(now);
        } catch (err: any) {
            this.logger.error(`publishDuePages failed: ${err?.message ?? err}`);
        }
    }

    private async publishDuePosts(now: Date) {
        const prisma = this.prisma as any;
        if (!prisma.post) return;

        const due: any[] = await prisma.post.findMany({
            where: {
                status: 'SCHEDULED',
                publishAt: { lte: now },
            },
            select: { id: true, title: true, slug: true, publishAt: true },
        });
        if (due.length === 0) return;

        for (const row of due) {
            try {
                await prisma.post.update({
                    where: { id: row.id },
                    data: {
                        status: 'PUBLISHED',
                        publishedAt: row.publishAt ?? now,
                    },
                });
                this.logger.log(`Published scheduled post "${row.slug}"`);
                this.webhooks.dispatch('post.published', { id: row.id, slug: row.slug, title: row.title, scheduled: true }).catch(() => {});
                this.auditLog.log('system', 'POST_AUTO_PUBLISHED', { id: row.id, slug: row.slug }).catch(() => {});
            } catch (err: any) {
                this.logger.error(`Failed to auto-publish post ${row.slug}: ${err?.message ?? err}`);
            }
        }
    }

    private async publishDuePages(now: Date) {
        const prisma = this.prisma as any;
        if (!prisma.page) return;

        const due: any[] = await prisma.page.findMany({
            where: {
                status: 'SCHEDULED',
                publishAt: { lte: now },
            },
            select: { id: true, title: true, slug: true, publishAt: true },
        });
        if (due.length === 0) return;

        for (const row of due) {
            try {
                await prisma.page.update({
                    where: { id: row.id },
                    data: {
                        status: 'PUBLISHED',
                        publishedAt: row.publishAt ?? now,
                    },
                });
                this.logger.log(`Published scheduled page "${row.slug}"`);
                this.webhooks.dispatch('page.published', { id: row.id, slug: row.slug, title: row.title, scheduled: true }).catch(() => {});
                this.auditLog.log('system', 'PAGE_AUTO_PUBLISHED', { id: row.id, slug: row.slug }).catch(() => {});
            } catch (err: any) {
                this.logger.error(`Failed to auto-publish page ${row.slug}: ${err?.message ?? err}`);
            }
        }
    }

    /**
     * Public helper — summary counts + the next few upcoming scheduled items.
     * Exposed via a controller endpoint so the admin UI can show "scheduled"
     * counts without every caller having to write a query.
     */
    async getSchedule(): Promise<{ posts: any[]; pages: any[]; counts: { posts: number; pages: number } }> {
        const prisma = this.prisma as any;
        const [posts, pages, postCount, pageCount] = await Promise.all([
            prisma.post?.findMany({
                where: { status: 'SCHEDULED' },
                orderBy: { publishAt: 'asc' },
                take: 10,
                select: { id: true, title: true, slug: true, publishAt: true },
            }) ?? Promise.resolve([]),
            prisma.page?.findMany({
                where: { status: 'SCHEDULED' },
                orderBy: { publishAt: 'asc' },
                take: 10,
                select: { id: true, title: true, slug: true, publishAt: true },
            }) ?? Promise.resolve([]),
            prisma.post?.count({ where: { status: 'SCHEDULED' } }) ?? Promise.resolve(0),
            prisma.page?.count({ where: { status: 'SCHEDULED' } }) ?? Promise.resolve(0),
        ]);
        return {
            posts,
            pages,
            counts: { posts: postCount, pages: pageCount },
        };
    }
}
