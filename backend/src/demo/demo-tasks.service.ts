import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ThemesService } from '../themes/themes.service';

@Injectable()
export class DemoTasksService {
    private readonly logger = new Logger(DemoTasksService.name);

    constructor(
        private prisma: PrismaService,
        private themesService: ThemesService,
    ) {}

    /**
     * Reset demo data every 2 hours.
     * Clears all content, re-seeds from theme seedData, reactivates demo users.
     */
    @Cron('0 */2 * * *')
    async resetDemoData() {
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
