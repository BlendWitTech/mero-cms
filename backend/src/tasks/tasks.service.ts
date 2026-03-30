import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Every minute: publish any posts whose publishedAt has passed
     * but are still in SCHEDULED status.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async publishScheduledPosts() {
        const now = new Date();
        const result = await (this.prisma as any).post.updateMany({
            where: {
                status: 'SCHEDULED',
                publishedAt: { lte: now },
            },
            data: { status: 'PUBLISHED' },
        });
        if (result.count > 0) {
            this.logger.log(`Auto-published ${result.count} scheduled post(s).`);
        }
    }

    /**
     * Daily at midnight: clean up expired password reset tokens.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyMaintenance() {
        const result = await (this.prisma as any).user.updateMany({
            where: {
                passwordResetExpiry: { lt: new Date() },
                passwordResetToken: { not: null },
            },
            data: {
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });
        if (result.count > 0) {
            this.logger.log(`Cleared ${result.count} expired password reset token(s).`);
        }
    }
}
