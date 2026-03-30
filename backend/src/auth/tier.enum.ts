/**
 * Product tiers in ascending capability order.
 * The active tier is read from the TIER env var (default: 'premium').
 * Full RSA-signed license key validation is in Track D (D1).
 */
export enum Tier {
    Basic = 1,
    Premium = 2,
    Enterprise = 3,
    Custom = 4,
}

const TIER_MAP: Record<string, Tier> = {
    basic: Tier.Basic,
    premium: Tier.Premium,
    enterprise: Tier.Enterprise,
    custom: Tier.Custom,
};

export function getActiveTier(): Tier {
    const raw = (process.env.TIER || 'premium').toLowerCase();
    return TIER_MAP[raw] ?? Tier.Premium;
}
