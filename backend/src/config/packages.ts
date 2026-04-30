export type WebsiteType = 'personal' | 'organizational';
export type PackageId =
    | 'personal-basic' | 'personal-premium' | 'personal-professional' | 'personal-custom'
    | 'org-basic' | 'org-premium' | 'org-enterprise' | 'org-custom';

// Per-tier feature capabilities. Boolean gates and numeric (-1 == unlimited) limits.
export interface PackageCapabilities {
    // Numeric limits
    themeCount: number; // how many themes may be activated
    // Boolean feature gates
    pluginMarketplace: boolean;
    themeCodeEdit: boolean;
    /** Whether the user can launch the visual editor at all. */
    visualThemeEditor: boolean;
    /** Whether the visual editor's PRO widget pack (Form, Carousel, Tabs,
        Accordion, Pricing Table, Testimonial Slider, Countdown, Custom HTML,
        etc.) is unlocked. Bundled into Professional+ tiers and used by the
        editor's palette to show lock icons + upgrade prompts on advanced
        widgets for lower tiers. The basic widget palette (Hero, Heading,
        Text, Image, Button, Spacer, Divider, etc.) is unlocked on every
        tier so even Basic users get a usable editor. */
    proWidgets: boolean;
    dashboardBranding: boolean;
    webhooks: boolean;
    collections: boolean;
    forms: boolean;
    analytics: boolean;
    auditLog: boolean;
    siteEditor: boolean;
    seoFull: boolean;
}

export interface CmsPackage {
    id: PackageId;
    name: string;
    websiteType: WebsiteType;
    tier: 1 | 2 | 3 | 4;
    aiEnabled: boolean;
    /** One-time license fee. We moved away from price ranges (Apr 2026
        rebalance v2) — ranged prices created signup friction. Custom
        tier still uses the 'custom' sentinel but anchors with
        priceFrom in the marketing UI. */
    priceNPR: number | 'custom';
    /** Anchor price displayed for Custom tiers — "Starting at NPR X".
        Optional; only set on Custom-tier packages. */
    priceFromNPR?: number;
    /** Optional annual maintenance fee. ~18% of license — covers
        security patches, version upgrades, and priority bug fixes.
        Customers can let it lapse and keep using their current
        version; only future updates are gated on it. */
    maintenanceNPR?: number;
    tagline: string;
    features: string[];
    comingSoon?: string[];
    starterThemes: string[];
    supportLevel: 'email' | 'priority' | 'dedicated';
    highlighted?: boolean;
    // Enforcement metadata
    storageLimitGB: number;
    teamLimit: number; // -1 for unlimited
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    capabilities: PackageCapabilities;
}

const BASIC_CAPS: PackageCapabilities = {
    themeCount: 1,
    pluginMarketplace: false,
    themeCodeEdit: false,
    visualThemeEditor: false,
    proWidgets: false,
    dashboardBranding: false,
    webhooks: false,
    collections: false,
    // forms moved into Basic (Apr 2026 rebalance v2). A contact form is
    // table-stakes for any personal site — telling Basic users "pay
    // Premium just to capture an email" is a cliff that hurt activation.
    // Basic gets the lead inbox view + a single contact form. Premium
    // keeps the form-builder UI, multi-form management, and webhooks.
    forms: true,
    analytics: false,
    auditLog: false,
    siteEditor: false,
    seoFull: false,
};

const PREMIUM_CAPS: PackageCapabilities = {
    themeCount: 3,
    pluginMarketplace: true,
    // Premium gets code-level theme editing by default. The full Visual /
    // Website UI Editor is reserved for Enterprise; Premium users who want
    // that experience must buy it as a marketplace add-on plugin.
    themeCodeEdit: true,
    visualThemeEditor: false,
    // Premium can't launch the visual editor at all (it's the upsell hook
    // into Professional). proWidgets defaults to false here too — even if
    // a Premium user buys the visual-editor add-on plugin, the advanced
    // widget pack stays locked until they upgrade tiers.
    proWidgets: false,
    dashboardBranding: false,
    // Forms + webhooks moved down to Premium (Apr 2026 rebalance). Contact
    // forms are table-stakes for a CMS site; webhooks have a legitimate
    // Premium-tier use case ("Slack ping on new post"). Collections remain
    // Pro+ because custom content types are a developer-focused feature.
    webhooks: true,
    collections: false,
    forms: true,
    analytics: true,
    auditLog: true,
    siteEditor: true,
    seoFull: true,
};

const PROFESSIONAL_CAPS: PackageCapabilities = {
    // Changed from unlimited → 5 (Apr 2026). Pro positions as "up to 5
    // themes from our portfolio"; customers who need more can upgrade to
    // Custom, which ships with unlimited themes + custom development scope.
    themeCount: 5,
    pluginMarketplace: true,
    themeCodeEdit: true,
    // Professional is the Personal tier equivalent of Org Enterprise, so it
    // ships with the full Visual / Website UI Editor included.
    visualThemeEditor: true,
    // Pro widget pack lights up at Professional+ — Form, Carousel, Tabs,
    // Accordion, Pricing Table, Testimonial Slider, Countdown, Custom HTML.
    // Basic + Premium customers see these in the palette but they render
    // with a lock icon and an upgrade CTA.
    proWidgets: true,
    dashboardBranding: false, // only Org Enterprise + both Customs get this
    webhooks: true,
    collections: true,
    forms: true,
    analytics: true,
    auditLog: true,
    siteEditor: true,
    seoFull: true,
};

const ENTERPRISE_CAPS: PackageCapabilities = {
    // Changed from unlimited → 5 (Apr 2026); see PROFESSIONAL_CAPS rationale.
    themeCount: 5,
    pluginMarketplace: true,
    themeCodeEdit: true,
    visualThemeEditor: true,
    proWidgets: true,
    dashboardBranding: true,
    webhooks: true,
    collections: true,
    forms: true,
    analytics: true,
    auditLog: true,
    siteEditor: true,
    seoFull: true,
};

const CUSTOM_CAPS: PackageCapabilities = {
    themeCount: -1,
    pluginMarketplace: true,
    themeCodeEdit: true,
    visualThemeEditor: true,
    proWidgets: true,
    dashboardBranding: true,
    webhooks: true,
    collections: true,
    forms: true,
    analytics: true,
    auditLog: true,
    siteEditor: true,
    seoFull: true,
};

export const PACKAGES: CmsPackage[] = [
    // ─── Personal Websites ──────────────────────────────────────────────────────
    {
        id: 'personal-basic',
        name: 'Basic',
        websiteType: 'personal',
        tier: 1,
        aiEnabled: false,
        priceNPR: 20000,
        maintenanceNPR: 3600,
        tagline: 'Essential tools to get your personal site online.',
        features: [
            '1 Starter Theme',
            'Blog (posts, categories, tags)',
            'Theme-related sections',
            'Menu & section content management',
            'Single contact form + lead inbox',
            'Basic branding & settings',
            'Basic SEO (titles, meta descriptions)',
            '5GB Storage',
            'Email Support',
        ],
        comingSoon: ['Plugin Marketplace (not included)'],
        starterThemes: ['mero-pro'],
        supportLevel: 'email',
        highlighted: false,
        storageLimitGB: 5,
        teamLimit: 1,
        hasWhiteLabel: false,
        hasApiAccess: false,
        capabilities: BASIC_CAPS,
    },
    {
        id: 'personal-premium',
        name: 'Premium',
        websiteType: 'personal',
        tier: 2,
        aiEnabled: false,
        priceNPR: 30000,
        maintenanceNPR: 5400,
        tagline: 'More themes, more power — with full SEO & analytics.',
        features: [
            'Up to 3 Themes',
            'Plugin Marketplace (plugins purchased separately)',
            'Full branding & settings control',
            'Theme sections & DB content management (menus & sections)',
            'Complete SEO suite',
            'Analytics integration',
            'Audit Log',
            'Full Site Editor & Site Pages',
            'Code-level theme editing (like WordPress)',
            'Forms (builder + submission inbox)',
            'Webhooks (notify external services on events)',
            'Visual Theme Editor — available as a marketplace add-on',
            '20GB Storage',
            'Priority Support',
        ],
        starterThemes: ['mero-pro'],
        supportLevel: 'priority',
        highlighted: true,
        storageLimitGB: 20,
        teamLimit: 3,
        hasWhiteLabel: false,
        hasApiAccess: false,
        capabilities: PREMIUM_CAPS,
    },
    {
        id: 'personal-professional',
        name: 'Professional',
        websiteType: 'personal',
        tier: 3,
        aiEnabled: true,
        priceNPR: 75000,
        maintenanceNPR: 13500,
        tagline: 'Up to 5 themes, visual editor, white-label, and API access.',
        features: [
            'Up to 5 Themes from our portfolio',
            'Everything in Premium',
            'Code-level theme editing (like WordPress)',
            'Collections (custom content types)',
            'Visual Theme Editor — swap sections & components visually',
            'Website analytics dashboard (in-app)',
            'Complete settings suite',
            'White-label (hide "Powered by Mero")',
            'API access (REST + scoped API keys)',
            'AI Studio',
            '100GB Storage',
            'Dedicated Support',
        ],
        starterThemes: ['any'],
        supportLevel: 'dedicated',
        highlighted: false,
        storageLimitGB: 100,
        teamLimit: 5,
        hasWhiteLabel: true,
        hasApiAccess: true,
        capabilities: PROFESSIONAL_CAPS,
    },
    {
        id: 'personal-custom',
        name: 'Custom',
        websiteType: 'personal',
        tier: 4,
        aiEnabled: true,
        priceNPR: 'custom',
        priceFromNPR: 150000,
        tagline: 'A fully tailored package built around your exact needs.',
        features: [
            'Everything in Professional',
            'Unlimited themes',
            'Custom development scope',
            'Custom integrations',
            'Dedicated infrastructure',
            'On-premise option',
            '24/7 Dedicated Support',
            'Training & onboarding',
        ],
        starterThemes: ['any'],
        supportLevel: 'dedicated',
        highlighted: false,
        storageLimitGB: -1,
        teamLimit: -1,
        hasWhiteLabel: true,
        hasApiAccess: true,
        capabilities: CUSTOM_CAPS,
    },

    // ─── Organizational Websites ─────────────────────────────────────────────────
    {
        id: 'org-basic',
        name: 'Basic',
        websiteType: 'organizational',
        tier: 1,
        aiEnabled: false,
        // Dropped from NPR 35k → 25k (Apr 2026 rebalance v2). Previously
        // priced same as Personal-Premium with fewer features — that's
        // a hard sell. New positioning: cheap entry point for small
        // teams, with multi-user as the "you're a team" differentiator.
        priceNPR: 25000,
        maintenanceNPR: 4500,
        tagline: 'Essential tools for small organizations — with multi-user from day one.',
        features: [
            '1 Starter Theme',
            'Up to 3 team members',
            'Blog (posts, categories, tags)',
            'Theme-related sections',
            'Menu & section content management',
            'Single contact form + lead inbox',
            'Basic branding & settings',
            'Basic SEO (titles, meta descriptions)',
            '20GB Storage',
            'Email Support',
        ],
        comingSoon: ['Plugin Marketplace (not included)'],
        starterThemes: ['mero-pro'],
        supportLevel: 'email',
        highlighted: false,
        storageLimitGB: 20,
        teamLimit: 3,
        hasWhiteLabel: false,
        hasApiAccess: false,
        capabilities: BASIC_CAPS,
    },
    {
        id: 'org-premium',
        name: 'Premium',
        websiteType: 'organizational',
        tier: 2,
        aiEnabled: false,
        priceNPR: 70000,
        maintenanceNPR: 12600,
        tagline: 'Full CMS power with analytics, audit logs, and code-level theme editing.',
        features: [
            'Up to 3 Themes',
            'Plugin Marketplace (plugins purchased separately)',
            'Full branding & settings control',
            'Theme sections & DB content management (menus & sections)',
            'Complete SEO suite',
            'Analytics integration',
            'Audit Log',
            'Full Site Editor & Site Pages',
            'Code-level theme editing (like WordPress)',
            'Forms (builder + submission inbox)',
            'Webhooks (notify external services on events)',
            'Visual Theme Editor — available as a marketplace add-on',
            '50GB Storage',
            'Priority Support',
        ],
        starterThemes: ['mero-pro'],
        supportLevel: 'priority',
        highlighted: true,
        storageLimitGB: 50,
        teamLimit: 10,
        hasWhiteLabel: false,
        hasApiAccess: false,
        capabilities: PREMIUM_CAPS,
    },
    {
        id: 'org-enterprise',
        name: 'Enterprise',
        websiteType: 'organizational',
        tier: 3,
        aiEnabled: true,
        priceNPR: 125000,
        maintenanceNPR: 22500,
        tagline: 'Up to 5 themes, visual editor, dashboard branding, and full org controls.',
        features: [
            'Up to 5 Themes from our portfolio',
            'Everything in Premium',
            'Code-level theme editing (like WordPress)',
            'Collections (custom content types)',
            'Visual Theme Editor — swap sections & components visually',
            'CMS Dashboard branding (color & font customization)',
            'White-label (hide "Powered by Mero")',
            'API access (REST + scoped API keys)',
            'AI Studio',
            'Website analytics dashboard (in-app)',
            '200GB Storage',
            'Dedicated Support',
        ],
        starterThemes: ['any'],
        supportLevel: 'dedicated',
        highlighted: false,
        storageLimitGB: 200,
        teamLimit: -1,
        hasWhiteLabel: true,
        hasApiAccess: true,
        capabilities: ENTERPRISE_CAPS,
    },
    {
        id: 'org-custom',
        name: 'Custom',
        websiteType: 'organizational',
        tier: 4,
        aiEnabled: true,
        priceNPR: 'custom',
        priceFromNPR: 250000,
        tagline: 'A fully tailored enterprise package for your organization.',
        features: [
            'Everything in Enterprise',
            'Unlimited themes',
            'Custom development scope',
            'Custom integrations',
            'Dedicated infrastructure',
            'On-premise option',
            '24/7 Dedicated Support',
            'Training & onboarding',
        ],
        starterThemes: ['any'],
        supportLevel: 'dedicated',
        highlighted: false,
        storageLimitGB: -1,
        teamLimit: -1,
        hasWhiteLabel: true,
        hasApiAccess: true,
        capabilities: CUSTOM_CAPS,
    },
];

// Helper: resolve capabilities for a given package id (falls back to BASIC_CAPS).
export function getCapabilities(packageId: string | null | undefined): PackageCapabilities {
    const pkg = PACKAGES.find((p) => p.id === packageId);
    return pkg?.capabilities ?? BASIC_CAPS;
}

// ─── Mero Cloud (managed hosting add-on) ─────────────────────────────
//
// Self-hosting a CMS isn't for everyone. Mero Cloud takes the same
// licensed CMS and runs it on infrastructure we manage — the customer
// gets one URL, an SSL certificate, daily backups, and never thinks
// about Linux, PostgreSQL, or systemd. Sold as an annual subscription
// alongside the one-time CMS license.

export type CloudTierId = 'cloud-starter' | 'cloud-business' | 'cloud-scale';

export interface CloudTier {
    id: CloudTierId;
    name: string;
    pairsWith: ('personal' | 'organizational')[];
    annualNPR: number;
    tagline: string;
    features: string[];
    storageLimitGB: number;
    bandwidthGB: number; // monthly
    sites: number;
    backupRetentionDays: number;
}

export const CLOUD_TIERS: CloudTier[] = [
    {
        id: 'cloud-starter',
        name: 'Cloud Starter',
        pairsWith: ['personal'],
        annualNPR: 12000,
        tagline: 'Hosted, backed up, on your own subdomain or custom domain.',
        features: [
            '1 site',
            'Free *.merocloud.com subdomain or bring your own domain',
            'Free SSL via Let’s Encrypt',
            '10GB managed storage',
            '50GB monthly bandwidth',
            'Daily backups · 14-day retention',
            'Email support',
        ],
        storageLimitGB: 10,
        bandwidthGB: 50,
        sites: 1,
        backupRetentionDays: 14,
    },
    {
        id: 'cloud-business',
        name: 'Cloud Business',
        pairsWith: ['personal', 'organizational'],
        annualNPR: 30000,
        tagline: 'Managed Postgres, dedicated cluster, faster response times.',
        features: [
            'Up to 3 sites on one license',
            'Custom domains on every site, free SSL',
            'Managed PostgreSQL with point-in-time recovery',
            '50GB managed storage',
            '250GB monthly bandwidth',
            'Daily backups · 30-day retention',
            'Priority support · 4-hour business-hours response',
        ],
        storageLimitGB: 50,
        bandwidthGB: 250,
        sites: 3,
        backupRetentionDays: 30,
    },
    {
        id: 'cloud-scale',
        name: 'Cloud Scale',
        pairsWith: ['organizational'],
        annualNPR: 80000,
        tagline: 'Dedicated infrastructure for high-traffic organizations.',
        features: [
            'Unlimited sites on one license',
            'Dedicated cluster · isolated workloads',
            'Region selection (Asia / EU / US)',
            'Managed PostgreSQL HA · daily snapshots',
            '500GB managed storage',
            '2TB monthly bandwidth',
            'Hourly backups · 90-day retention',
            'Dedicated support engineer · 1-hour SLA',
        ],
        storageLimitGB: 500,
        bandwidthGB: 2000,
        sites: -1,
        backupRetentionDays: 90,
    },
];
