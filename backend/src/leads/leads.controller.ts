import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequireModule, REQUIRE_MODULE_KEY } from '../setup/require-module.decorator';

@RequireModule('leads')
@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post('public/submit')
    @SetMetadata(REQUIRE_MODULE_KEY, null) // bypass class-level @RequireModule so public submissions always work
    createPublic(@Body() createLeadDto: any) {
        return this.leadsService.create(createLeadDto);
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_MANAGE)
    create(@Body() createLeadDto: any) {
        return this.leadsService.create(createLeadDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_VIEW)
    findAll(@Query('status') status?: string) {
        return this.leadsService.findAll(status);
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_VIEW)
    getStats() {
        return this.leadsService.getStats();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_VIEW)
    findOne(@Param('id') id: string) {
        return this.leadsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_MANAGE)
    update(@Param('id') id: string, @Body() updateLeadDto: any) {
        return this.leadsService.update(id, updateLeadDto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_MANAGE)
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.leadsService.updateStatus(id, status);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.LEADS_MANAGE) // Could use LEADS_DELETE if exists, relying on MANAGE for now per enum analysis
    remove(@Param('id') id: string) {
        return this.leadsService.remove(id);
    }
}
