import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ThemesService } from '../themes/themes.service';
import { DemoProvisioningService } from './demo-provisioning.service';

@Injectable()
export class DemoTasksService {
    private readonly logger = new Logger(DemoTasksService.name);

    constructor(
        private prisma: PrismaService,
        private themesService: ThemesService,
        private provisioning: DemoProvisioningService,
    ) {}

    /**
     * Drops isolated demo databases that have exceeded their 1-hour lifecycle.
     *
     * Defensively guarded — the `DemoSession` model only exists on
     * Mero-Cloud installs that opted into the demo-instance feature.
     * Regular self-hosted installs don't have the model in their
     * Prisma schema, so `this.prisma.demoSession` is `undefined` and
     * calling `.findMany` on it threw every hour. The guard makes the
     * cron a no-op there instead of spamming the logs.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredDemos() {
        const demoSession = (this.prisma as any).demoSession;
        if (!demoSession || typeof demoSession.findMany !== 'function') {
            // Model not in this install's schema — silently skip.
            return;
        }
        this.logger.log('Cleaning up expired demo databases...');

        const expired = await demoSession.findMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });

        for (const session of expired) {
            try {
                this.logger.log(`Dropping expired database: ${session.databaseName}`);
                await this.provisioning.dropDatabase(session.databaseName);
                await demoSession.delete({ where: { id: session.id } });
            } catch (error) {
                this.logger.error(`Failed to drop database ${session.databaseName}: ${error.message}`);
            }
        }
    }

    /**
     * Reset demo data every 2 hours.
     * Clears all content, re-seeds from theme seedData, reactivates demo users.
     *
     * GATED: this is destructive and only meant for hosted demo
     * instances. Without the gate, regular self-hosted installs would
     * see their content wiped every 2 hours. The cron only runs when
     * the `is_demo_instance` setting is explicitly truthy OR the
     * MERO_DEMO_MODE env var is set. Anything else short-circuits
     * before touching content.
     */
    @Cron('0 */2 * * *')
    async resetDemoData() {
        const demoFlag = await (this.prisma as any).setting.findUnique({
            where: { key: 'is_demo_instance' },
        }).catch(() => null);
        const flagValue = (demoFlag?.value || '').toString().toLowerCase();
        const isDemoInstance =
            flagValue === 'true' || flagValue === '1' || flagValue === 'yes' ||
            !!process.env.MERO_DEMO_MODE;
        if (!isDemoInstance) {
            // Production / dev install — leave the customer's data alone.
            return;
        }

        this.logger.log('Demo reset starting...');
        try {
            // 1. Clear all content tables and settings
            const result = await this.themesService.resetToBaseState();
            this.logger.log(`Demo reset cleared: ${JSON.stringify(result.cleared)}`);

            // 2. Re-seed from active theme
            const activeTheme = await this.themesService.getActiveTheme();
            if (activeTheme) {
                // Mark theme as FRESH so setActiveTheme will import seed data
                await this.prisma.setting.upsert({
                    where: { key: `theme_setup_type_${activeTheme}` },
                    update: { value: 'FRESH' },
                    create: { key: `theme_setup_type_${activeTheme}`, value: 'FRESH' },
                });
                await this.themesService.setActiveTheme(activeTheme, true);
            }
            this.logger.log('Demo theme re-seeded');

            // 3. Mark setup as FRESH
            await (this.prisma as any).setting.upsert({
                where: { key: 'setup_type' },
                update: { value: 'FRESH' },
                create: { key: 'setup_type', value: 'FRESH' },
            });

            // 4. Reactivate all demo users
            await (this.prisma as any).user.updateMany({
                where: { isActive: false },
                data: { isActive: true },
            });

            // 5. Update next reset timestamp
            const nextReset = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
            await (this.prisma as any).setting.upsert({
                where: { key: 'demo_next_reset' },
                update: { value: nextReset },
                create: { key: 'demo_next_reset', value: nextReset },
            });

            this.logger.log(`Demo reset complete. Next reset at ${nextReset}`);
        } catch (err: any) {
            this.logger.error(`Demo reset failed: ${err.message}`, err.stack);
        }
    }
}
