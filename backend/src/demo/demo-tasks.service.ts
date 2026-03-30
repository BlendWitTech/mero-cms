import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ThemesService } from '../themes/themes.service';

/**
 * Demo-only scheduled tasks.
 * This service is only registered when DEMO_MODE=true (via DemoModule).
 */
@Injectable()
export class DemoTasksService {
    private readonly logger = new Logger(DemoTasksService.name);

    constructor(
        private prisma: PrismaService,
        private themesService: ThemesService,
    ) { }

    /**
     * Every 2 hours: wipe all demo content and re-seed from the active theme.
     */
    @Cron('0 */2 * * *')
    async resetDemoData() {
        this.logger.log('[Demo] Starting scheduled reset…');
        try {
            // 1. Wipe all content back to base state
            await this.themesService.resetToBaseState();

            // 2. Find the active theme
            const activeTheme = await this.themesService.getActiveTheme();
            if (!activeTheme) {
                this.logger.warn('[Demo] No active theme — skipping re-seed');
                return;
            }

            // 3. Mark setup type as FRESH so seedData is re-imported on next activation
            await this.prisma.setting.upsert({
                where: { key: `theme_setup_type_${activeTheme}` },
                create: { key: `theme_setup_type_${activeTheme}`, value: 'FRESH' },
                update: { value: 'FRESH' },
            });

            // 4. Re-activate the theme with demo content
            await this.themesService.setActiveTheme(activeTheme, true);

            // 5. Persist the next reset time for the countdown banner
            const nextReset = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
            await this.prisma.setting.upsert({
                where: { key: 'demo_next_reset' },
                create: { key: 'demo_next_reset', value: nextReset },
                update: { value: nextReset },
            });

            this.logger.log(`[Demo] Reset complete. Next reset: ${nextReset}`);
        } catch (err: any) {
            this.logger.error('[Demo] Reset failed:', err.message);
        }
    }
}
