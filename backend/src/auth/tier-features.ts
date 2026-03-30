import { Tier } from './tier.enum';

/**
 * Maps each product tier to the set of module keys it unlocks.
 * Every tier includes all features of tiers below it.
 *
 * Keys match the ENABLED_MODULES values used in app.module.ts.
 */
export const TIER_FEATURES: Record<Tier, string[]> = {
    [Tier.Basic]: [
        // Core content
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
        'forms',
    ],
    [Tier.Premium]: [
        // Basic +
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
        'forms',
        'team',
        'services',
        'testimonials',
        'leads',
        'seo',
        'redirects',
        'analytics',
        'sitemap',
        'robots',
        'webhooks',
    ],
    [Tier.Enterprise]: [
        // Premium +
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
        'forms',
        'team',
        'services',
        'testimonials',
        'leads',
        'seo',
        'redirects',
        'analytics',
        'sitemap',
        'robots',
        'webhooks',
        'collections',
        'comments',
    ],
    [Tier.Custom]: [
        // All modules — used for bespoke / white-label deployments
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
        'forms',
        'team',
        'services',
        'testimonials',
        'leads',
        'seo',
        'redirects',
        'analytics',
        'sitemap',
        'robots',
        'webhooks',
        'collections',
        'comments',
    ],
};

/** Returns all module keys available at or below the given tier. */
export function getFeaturesForTier(tier: Tier): string[] {
    return TIER_FEATURES[tier] ?? TIER_FEATURES[Tier.Basic];
}
