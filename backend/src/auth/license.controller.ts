import { Controller, Get } from '@nestjs/common';
import { SaasLicenseService } from '../packages/license.service';

/** Alias for /packages/license — kept for backward compat. */
@Controller('license')
export class LicenseController {
    constructor(private licenseService: SaasLicenseService) {}

    @Get('status')
    getStatus() {
        return this.licenseService.getLicenseInfo();
    }
}
