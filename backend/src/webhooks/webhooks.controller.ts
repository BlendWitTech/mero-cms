import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WebhooksService, WEBHOOK_EVENTS } from './webhooks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireTier } from '../auth/require-tier.decorator';
import { Tier } from '../auth/tier.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@RequireTier(Tier.Premium)
@UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
@RequirePermissions(Permission.SETTINGS_EDIT)
@RequireLimit(PackageLimit.WEBHOOKS)
@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) { }

    @Get('events')
    getEvents() {
        return WEBHOOK_EVENTS;
    }

    @Get()
    findAll() {
        return this.webhooksService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.webhooksService.findOne(id);
    }

    @Post()
    create(@Body() dto: any) {
        return this.webhooksService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.webhooksService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.webhooksService.remove(id);
    }
}
