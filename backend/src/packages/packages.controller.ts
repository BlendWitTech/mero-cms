import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { SaasLicenseService } from './license.service';

@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackagesController {
    constructor(
        private readonly packagesService: PackagesService,
        private readonly licenseService: SaasLicenseService,
    ) {}

    @Get('license')
    @RequirePermissions(Permission.SETTINGS_VIEW)
    getLicenseInfo() {
        return this.licenseService.getLicenseInfo();
    }

    @Post('activate')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    activate(@Body() data: { key: string }) {
        return this.licenseService.activateLicense(data.key);
    }

    @Post('set-active')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    setActivePackage(@Body() data: { packageId: string }) {
        return this.licenseService.setActivePackage(data.packageId);
    }

    @Get()
    @RequirePermissions(Permission.SETTINGS_VIEW)
    findAll() {
        return this.packagesService.findAllAdmin();
    }

    @Patch(':id')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    update(@Param('id') id: string, @Body() body: any) {
        return this.packagesService.update(id, body);
    }

    @Get('usage')
    @RequirePermissions(Permission.SETTINGS_VIEW)
    getUsage() {
        return this.packagesService.getUsage();
    }

    @Post('reset-defaults')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    resetToDefaults() {
        return this.packagesService.resetToDefaults();
    }

    @Delete('license')
    @RequirePermissions(Permission.SETTINGS_EDIT)
    deactivateLicense() {
        return this.licenseService.deactivateLicense();
    }
}
