/**
 * Product tiers in ascending capability order.
 *
 * **DO NOT use `getActiveTier()` as the authoritative tier source.**
 * It only reads `process.env.TIER` (defaulting to `'premium'`/tier 2),
 * which is a development convenience — it never consults the customer's
 * activated license. Authoritative callers must read the active
 * package id from settings (`active_package_id`) and look up
 * `Package.tier`. Examples that do it right:
 *
 *   - `themes.service.currentTier()` — internal helper that reads
 *     `active_package_id` → `Package.tier` and returns
 *     `{ shortName, tier, pkgType }`. Use this for any gate inside
 *     ThemesService.
 *   - `packagesService.getActivePackage()` — same flow with JWT
 *     decode as a fallback. Use this in services that don't have
 *     ThemesService injected.
 *   - `licenseService.getLicenseInfo()` — full license verification
 *     including JWT signature check. Use this for the user-facing
 *     "what's my tier" question.
 *
 * `getActiveTier()` stays around only as a last-resort fallback
 * inside license.service when JWT verification fails AND no
 * active_package_id is set — i.e. on a fresh install with neither a
 * paid license nor a defaulted package row. New code should never
 * reach for this function.
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

/**
 * @deprecated Reads `process.env.TIER` only. Use a tier-resolution
 * path that consults the active license — see the docblock at the
 * top of this file for canonical alternatives.
 */
export function getActiveTier(): Tier {
    const raw = (process.env.TIER || 'premium').toLowerCase();
    return TIER_MAP[raw] ?? Tier.Premium;
}
