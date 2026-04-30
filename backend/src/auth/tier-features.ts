import { Tier } from './tier.enum';

/**
 * Maps each product tier to the set of module keys it unlocks.
 * Every tier includes all features of tiers below it.
 *
 * Keys match the ENABLED_MODULES values used in app.module.ts.
 */
export const TIER_FEATURES: Record<Tier, string[]> = {
    // Personal Basic / Org Basic — core content, blog, menus, media, basic SEO
    [Tier.Basic]: [
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
    ],
    // Personal Premium / Org Premium — adds team, services, testimonials, leads, full SEO, analytics
    [Tier.Premium]: [
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
        'team',
        'services',
        'testimonials',
        'leads',
        'seo',
        'redirects',
        'analytics',
        'sitemap',
        'robots',
    ],
    // Personal Professional / Org Enterprise — adds webhooks, collections, forms, comments, API
    [Tier.Enterprise]: [
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
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
        'forms',
        'comments',
    ],
    // Personal Custom / Org Custom — all modules
    [Tier.Custom]: [
        'blogs',
        'categories',
        'tags',
        'pages',
        'menus',
        'media',
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
        'forms',
        'comments',
    ],
};

/** Returns all module keys available at or below the given tier. */
export function getFeaturesForTier(tier: Tier): string[] {
    return TIER_FEATURES[tier] ?? TIER_FEATURES[Tier.Basic];
}
