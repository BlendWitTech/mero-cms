import { SetMetadata } from '@nestjs/common';
import { Tier } from './tier.enum';

export const TIER_KEY = 'requiredTier';

/**
 * Restrict an endpoint to deployments at or above the given tier.
 *
 * @example
 * @RequireTier(Tier.Enterprise)
 * @Get('advanced-feature')
 */
export const RequireTier = (tier: Tier) => SetMetadata(TIER_KEY, tier);
