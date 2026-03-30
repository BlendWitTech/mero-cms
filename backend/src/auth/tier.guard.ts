import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TIER_KEY } from './require-tier.decorator';
import { Tier } from './tier.enum';
import { LicenseService } from './license.service';

/**
 * Blocks access to endpoints decorated with @RequireTier() when the active
 * deployment tier (from the verified LICENSE_KEY) is below the required level.
 *
 * Registered globally in AppModule as an APP_GUARD.
 */
@Injectable()
export class TierGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private licenseService: LicenseService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Tier>(TIER_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!required) return true;

        const { tier } = this.licenseService.getLicenseStatus();

        if (tier < required) {
            const tierName = Tier[required];
            throw new ForbiddenException(
                `This feature requires the ${tierName} tier or higher. ` +
                `Upgrade your Mero CMS license to access it.`,
            );
        }

        return true;
    }
}
