import { Controller, Get } from '@nestjs/common';
import { LicenseService } from './license.service';

@Controller('license')
export class LicenseController {
    constructor(private licenseService: LicenseService) {}

    /**
     * Returns the current license status.
     * Used by the Settings > License tab in the frontend.
     * Requires authentication (default JWT guard applies).
     */
    @Get('status')
    getStatus() {
        return this.licenseService.getLicenseStatus();
    }
}
