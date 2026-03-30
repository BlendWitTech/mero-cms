import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TIER_KEY } from './require-tier.decorator';
import { Tier, getActiveTier } from './tier.enum';

/**
 * Blocks access to endpoints decorated with @RequireTier() when the active
 * deployment tier is below the required level.
 *
 * Register globally in AppModule or apply per-controller as needed.
 * The active tier is read from the TIER env var at request time so it can be
 * changed without restart (useful for license key validation in Track D).
 */
@Injectable()
export class TierGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Tier>(TIER_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!required) return true; // No tier restriction on this endpoint

        const active = getActiveTier();

        if (active < required) {
            const tierName = Tier[required];
            throw new ForbiddenException(
                `This feature requires the ${tierName} tier or higher. ` +
                `Upgrade your license to access it.`,
            );
        }

        return true;
    }
}
