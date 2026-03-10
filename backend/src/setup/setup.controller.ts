import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { SetupService, OPTIONAL_MODULES, CORE_MODULES, MODULE_LABELS } from './setup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@Controller('setup')
export class SetupController {
    constructor(private readonly setupService: SetupService) { }

    @Get('status')
    async getStatus() {
        const complete = await this.setupService.isSetupComplete();
        return { setupComplete: complete };
    }

    @Get('modules')
    async getModules() {
        const optionalWithMeta = OPTIONAL_MODULES.map((key) => ({
            key,
            ...(MODULE_LABELS[key] || { label: key, description: '', group: 'Other' }),
        }));

        return {
            core: CORE_MODULES,
            optional: optionalWithMeta,
        };
    }

    @Get('enabled-modules')
    async getEnabledModules() {
        const modules = await this.setupService.getEnabledModules();
        return { enabledModules: modules };
    }

    @Post('complete')
    async complete(
        @Body() body: {
            siteName: string;
            adminEmail: string;
            adminPassword: string;
            adminName: string;
            enabledModules: string[];
        },
    ) {
        if (!body.siteName || !body.adminEmail || !body.adminPassword || !body.adminName) {
            throw new BadRequestException('siteName, adminEmail, adminPassword, and adminName are required');
        }
        return this.setupService.completeSetup(body);
    }

    @Post('modules')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async updateModules(@Body() body: { enabledModules: string[] }) {
        return this.setupService.updateEnabledModules(body.enabledModules);
    }
}
