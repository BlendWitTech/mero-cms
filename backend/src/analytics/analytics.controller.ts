import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';
import { RequireTier } from '../auth/require-tier.decorator';
import { Tier } from '../auth/tier.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@RequireTier(Tier.Premium)
@RequireModule('analytics')
@UseGuards(JwtAuthGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.ANALYTICS)
@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly auditLog: AuditLogService,
    ) { }

    @Get('config')
    async getConfig() {
        return this.analyticsService.getConfig();
    }

    @Post('config')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async updateConfig(@Body() data: any, @Request() req) {
        try {
            const result = await this.analyticsService.updateConfig(data);
            await this.auditLog.log(req.user.id, 'ANALYTICS_CONFIG_UPDATE', data);
            return result;
        } catch (err) {
            console.error('Error in AnalyticsController.updateConfig:', err);
            throw err;
        }
    }

    @Post('test')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async testConfig(@Body() data: any) {
        return this.analyticsService.testConnection(data);
    }

    @Get('trend')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.ANALYTICS_VIEW)
    async getTrend(@Query('days') days?: string) {
        return this.analyticsService.getTrend(days ? parseInt(days) : 7);
    }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.ANALYTICS_VIEW)
    async getDashboard() {
        try {
            return await this.analyticsService.getDashboardMetrics();
        } catch (error) {
            // We want to return the error message so the frontend can display it
            // Instead of throwing 500, we might want to return a specific structure or
            // just let the global exception filter handle it.
            // But since we want the dashboard to show "Error loading data" with a specific reason:
            throw error;
        }
    }

    /**
     * Top pages by view count over the last 30 days. Used by the
     * dashboard's top-pages panel (Pro/Enterprise only — gated by
     * tier upstream of this controller via the analytics capability).
     *
     * Returns up to `limit` rows of { title, slug, views }. If no
     * page-view tracking is configured (no GA4 or in-app tracker),
     * returns [] so the panel renders its empty-state instead of
     * 500ing.
     */
    @Get('top-pages')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.ANALYTICS_VIEW)
    async topPages(@Query('limit') limitParam?: string) {
        const limit = Math.min(Math.max(Number(limitParam) || 5, 1), 50);
        try {
            return await this.analyticsService.getTopPages(limit);
        } catch {
            // Tracker not configured / no data — empty array keeps the
            // dashboard panel happy.
            return [];
        }
    }
}
