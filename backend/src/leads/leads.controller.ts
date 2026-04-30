import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule } from '../setup/require-module.decorator';
import { Tier } from '../auth/tier.enum';
import { RequireTier } from '../auth/require-tier.decorator';

@RequireModule('leads')
@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    create(@Body() data: any) {
        // Public submission: no auth/tier required
        return this.leadsService.create(data);
    }

    @Get()
    @RequireTier(Tier.Premium)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_VIEW)
    findAll(@Query('status') status?: string, @Query('search') search?: string) {
        return this.leadsService.findAll({ status, search });
    }

    /**
     * Daily lead counts for the dashboard analytics widget.
     * Returns up to N most recent days as [{ date: 'YYYY-MM-DD', count }].
     * Days with zero leads are still emitted (zero-fill) so the chart line
     * is continuous instead of skipping gaps.
     *
     * Declared BEFORE the `:id` routes — `:id` is single-segment so it
     * won't match `analytics/by-day` either way, but placing specific
     * paths first is the safer convention.
     */
    @Get('analytics/by-day')
    @RequireTier(Tier.Premium)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_VIEW)
    leadsByDay(@Query('days') daysParam?: string) {
        const days = Math.min(Math.max(Number(daysParam) || 30, 1), 365);
        return this.leadsService.countByDay(days);
    }

    @Get(':id')
    @RequireTier(Tier.Premium)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_VIEW)
    findOne(@Param('id') id: string) {
        return this.leadsService.findById(id);
    }

    @Patch(':id')
    @RequireTier(Tier.Premium)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_MANAGE)
    update(@Param('id') id: string, @Body() data: any) {
        return this.leadsService.update(id, data);
    }

    @Delete(':id')
    @RequireTier(Tier.Premium)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_MANAGE)
    remove(@Param('id') id: string) {
        return this.leadsService.remove(id);
    }
}
