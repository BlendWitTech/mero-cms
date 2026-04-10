import { Controller, Get, Post, Body, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SetupService, OPTIONAL_MODULES, CORE_MODULES, MODULE_LABELS, MODULE_TIERS } from './setup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LicenseService } from '../auth/license.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@Controller('setup')
export class SetupController {
    constructor(
        private readonly setupService: SetupService,
        private readonly licenseService: LicenseService,
    ) { }

    @Get('status')
    async getStatus() {
        const complete = await this.setupService.isSetupComplete();
        return { setupComplete: complete };
    }

    @Get('modules')
    async getModules() {
        const status = this.licenseService.getLicenseStatus();
        const optionalWithMeta = OPTIONAL_MODULES.map((key) => ({
            key,
            ...(MODULE_LABELS[key] || { label: key, description: '', group: 'Other' }),
            requiredTier: MODULE_TIERS[key] || 1, // Default to Basic if not mapped
        }));

        return {
            core: CORE_MODULES,
            optional: optionalWithMeta,
            currentTier: status.tier,
            branch: process.env.CMS_BRANCH || 'marketing',
        };
    }

    @Post('verify-license')
    async verifyLicense(@Body() body: { licenseKey: string }) {
        if (!body.licenseKey?.trim()) throw new BadRequestException('licenseKey is required');
        const status = this.licenseService.verifyKey(body.licenseKey);
        if (!status.valid) throw new UnauthorizedException(status.error || 'Invalid license key');
        return { valid: true, tier: status.tier };
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
