/**
 * Mero CMS Plugin Marketplace Catalog
 * ────────────────────────────────────
 * Static v1 catalog — the marketplace in front-end is a curated list of
 * plugins available for purchase or free install. In v2 this will move to a
 * remote registry (see v2.0.0 in task.md).
 *
 * All prices in NPR. `priceNPR: 0` is a free plugin.
 */

export type PluginCategory =
    | 'analytics'
    | 'seo'
    | 'commerce'
    | 'marketing'
    | 'security'
    | 'content'
    | 'utility';

/**
 * One field on a plugin-contributed widget. Same shape as the field
 * objects in a theme's moduleSchemas / widgetCatalog so the visual
 * editor's SectionEditor can render plugin widgets without a special-
 * case path.
 */
export interface PluginWidgetField {
    key: string;
    label: string;
    type: string; // accepted set lives in scripts/theme-validate.js KNOWN_FIELD_TYPES
    placeholder?: string;
    description?: string;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    required?: boolean;
    itemSchema?: PluginWidgetField[];
}

/**
 * A widget contributed by a plugin. Mirrors the entries in a theme's
 * `widgetCatalog`, with one extra `pluginSlug` stamp so the editor can
 * tell where the widget came from (and so the renderer in #89 can look
 * up the right component bundle).
 */
export interface PluginWidgetDefinition {
    /** Unique widget type. Convention: `<pluginSlug>:<WidgetName>` so
        two plugins can both ship a "Carousel" without colliding. */
    type: string;
    name: string;
    description?: string;
    /** Lucide icon name. Resolved by the icon-resolver in the editor. */
    icon?: string;
    category?: string;
    /** When true, only customers with the proWidgets capability can
        drop this widget onto a page. Tier gating layered by the
        themes controller. */
    premium?: boolean;
    fields: PluginWidgetField[];
}

export interface PluginManifest {
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    author: string;
    version: string;
    priceNPR: number;
    category: PluginCategory;
    icon?: string; // lucide-react icon name or emoji
    featured?: boolean;
    /** Minimum tier of the package a customer must be on to use this plugin.
        Maps to numeric tier 2 (premium), 3 (professional/enterprise),
        4 (custom). Enforced at install time by plugins.service. */
    minTier?: 'premium' | 'professional' | 'enterprise';
    /** Theme compatibility allowlist. Use ['*'] for "works with any
        theme". Use specific theme slugs (e.g. ['mero-pro']) to
        restrict installs to themes that actually expose what the
        plugin needs (e.g. sectionVariants in theme.json for the
        visual-editor plugin). Enforced at install time alongside
        minTier. Omitted means same as ['*']. */
    compatibleThemes?: string[];
    /** Required theme manifest fields. The install gate checks the
        active theme's theme.json for the presence of these top-level
        keys. Useful for plugins that depend on a specific theme
        feature like `sectionVariants` or `brandingFields`. */
    requiredThemeFields?: string[];
    tags?: string[];
    requirements?: string[]; // optional human-readable prerequisites
    docsUrl?: string;
    /** Widgets this plugin contributes to the visual editor's palette.
        When the plugin is installed AND enabled, these merge into the
        active theme's widgetCatalog so authors can drop them onto any
        page that supports widgets. The renderer side (theme-base /
        widget-registry) needs a corresponding component delivery —
        see Phase 6.2 (#89). Until that lands, plugin widgets show in
        the palette with a "renderer pending" marker. */
    widgets?: PluginWidgetDefinition[];
    /** Optional widget categories the plugin wants to contribute (so
        a brand-new category like "commerce" can show up in the palette
        sidebar even if no theme defines it). Same shape as a theme's
        widgetCategories. Merged into the catalog response. */
    widgetCategories?: { key: string; label: string; description?: string }[];
}

/**
 * Map plugin minTier → numeric tier from packages.ts. Kept here so the
 * catalog file is the single source of truth for what each tier label
 * means in numeric terms.
 *   1 = Basic
 *   2 = Premium
 *   3 = Professional / Enterprise
 *   4 = Custom
 */
export const MIN_TIER_MAP: Record<NonNullable<PluginManifest['minTier']>, number> = {
    premium: 2,
    professional: 3,
    enterprise: 3,
};

export const PLUGIN_CATALOG: PluginManifest[] = [
    {
        slug: 'visual-editor',
        name: 'Visual / Website UI Editor',
        shortDescription: 'WordPress-style visual page builder — click any section to edit inline.',
        description:
            "Ships the full Visual Theme Editor experience to tiers that don't include it by default. Split-pane live preview, click-to-edit sections, per-section style controls, drag-drop reorder, and the component variant picker. This is the same editor that ships with Enterprise — available here as a one-time purchase for Premium and Professional users.",
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 12000,
        category: 'utility',
        icon: 'Palette',
        featured: true,
        minTier: 'premium',
        // Only themes that declare `sectionVariants` AND `brandingFields`
        // can be edited visually. Other themes can install but the editor
        // would have nothing to render — so the install gate refuses.
        requiredThemeFields: ['sectionVariants'],
        tags: ['editor', 'visual', 'page-builder', 'wordpress-style'],
        requirements: [
            'An active theme with sectionVariants declared in theme.json',
            'Modern browser (Chrome 120+, Safari 17+, Firefox 120+)',
        ],
    },
    {
        slug: 'advanced-analytics',
        name: 'Advanced Analytics',
        shortDescription: 'Funnels, cohorts, and retention on top of your existing analytics.',
        description:
            'Adds funnel analysis, cohort retention, and exit-intent tracking to the Nimble analytics module. Adds a new "Funnels" entry to the admin sidebar and a widget to the dashboard.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 5000,
        category: 'analytics',
        icon: 'TrendingUp',
        featured: true,
        minTier: 'premium',
        tags: ['analytics', 'funnels', 'cohorts'],
    },
    {
        slug: 'seo-boost',
        name: 'SEO Boost',
        shortDescription: 'Automated meta generation, sitemaps, and schema.org markup.',
        description:
            'Automatically generates meta descriptions and OpenGraph tags for every post and page. Adds JSON-LD schema markup (Article, BlogPosting, Organization) to your theme. Integrates with Google Search Console.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 3500,
        category: 'seo',
        icon: 'Search',
        featured: true,
        minTier: 'premium',
        tags: ['seo', 'meta', 'schema'],
    },
    {
        slug: 'newsletter-kit',
        name: 'Newsletter Kit',
        shortDescription: 'Mailchimp / Buttondown / MailerLite sync for your blog.',
        description:
            'Automatically syncs new blog posts to your mailing list on publish. Supports Mailchimp, Buttondown, and MailerLite out of the box. Adds a subscribe form section to the theme.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 4500,
        category: 'marketing',
        icon: 'Mail',
        minTier: 'premium',
        tags: ['email', 'newsletter', 'mailchimp'],
    },
    {
        slug: 'cloudflare-turnstile',
        name: 'Cloudflare Turnstile',
        shortDescription: 'Drop-in bot protection for forms. No captcha clicks.',
        description:
            'Adds Cloudflare Turnstile to every public form submission endpoint. Stops 99% of form spam without annoying real users.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,
        category: 'security',
        icon: 'ShieldCheck',
        featured: true,
        minTier: 'premium',
        tags: ['security', 'captcha', 'forms'],
    },
    {
        slug: 'stripe-checkout',
        name: 'Stripe Checkout',
        shortDescription: 'Accept payments on your site in under 5 minutes.',
        description:
            'Drop a Stripe Checkout button on any page or section. Supports one-time payments, subscriptions, and donations. Webhooks handle fulfillment automatically.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 7500,
        category: 'commerce',
        icon: 'CreditCard',
        minTier: 'professional',
        tags: ['payments', 'stripe', 'commerce'],
    },
    {
        slug: 'ai-alt-text',
        name: 'AI Alt Text Generator',
        shortDescription: 'Auto-generate alt text for every image you upload.',
        description:
            "Runs every image through a vision model and fills the alt-text field automatically. Improves accessibility and SEO without any manual work.",
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 2500,
        category: 'content',
        icon: 'Sparkles',
        minTier: 'premium',
        tags: ['ai', 'a11y', 'seo'],
    },
    {
        slug: 'multilingual-lite',
        name: 'Multilingual Lite',
        shortDescription: 'Translate your content into 10 languages with one click.',
        description:
            'Adds a language toggle to your admin. Translate any post, page, or section between English, Nepali, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, and Portuguese. Uses your own OpenAI or Anthropic key.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 6000,
        category: 'content',
        icon: 'Globe',
        minTier: 'professional',
        tags: ['i18n', 'translation', 'ai'],
    },
    {
        slug: 'backup-scheduler',
        name: 'Backup Scheduler',
        shortDescription: 'Nightly database + media backups to S3 or R2.',
        description:
            'Schedules automatic daily/weekly backups of your database and media files to S3-compatible storage (AWS S3, Cloudflare R2, DigitalOcean Spaces). Restore with one click.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,
        category: 'utility',
        icon: 'HardDrive',
        minTier: 'premium',
        tags: ['backup', 'disaster-recovery'],
    },

    // ─── Free Basic-tier utilities ──────────────────────────────────────
    // Every plugin above requires Premium or higher, which means a fresh
    // install on Basic sees an entirely-locked marketplace. The four
    // plugins below are pure cosmetic / utility add-ons with no Premium
    // capability dependency, so they pass the install gate on any tier
    // and give Basic users somewhere to start exploring the store.
    {
        slug: 'cookie-consent',
        name: 'Cookie Consent Banner',
        shortDescription: 'EU-compliant cookie consent banner with two clicks.',
        description:
            'Adds a bottom-of-page cookie consent banner. Three pre-built styles (minimal, branded, modal). Stores user choice in localStorage. GDPR / ePrivacy / CalOPPA copy templates included.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,
        category: 'utility',
        icon: 'Cookie',
        tags: ['gdpr', 'consent', 'compliance'],
    },
    {
        slug: 'reading-progress',
        name: 'Reading Progress Bar',
        shortDescription: 'Top-of-page scroll indicator for blog posts.',
        description:
            'Drops a thin progress bar at the top of every blog post that fills as the reader scrolls. Picks up your brand colour automatically. Auto-disables on listing pages.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,
        category: 'utility',
        icon: 'Activity',
        tags: ['blog', 'reading', 'ui'],
    },
    {
        slug: 'back-to-top',
        name: 'Back to Top',
        shortDescription: 'Floating "scroll to top" button for long pages.',
        description:
            'A small circular button appears in the corner once the reader scrolls past the fold. Click to smooth-scroll back to the top. Customisable position (left / right) and offset.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,
        category: 'utility',
        icon: 'ArrowUp',
        tags: ['ui', 'navigation'],
    },
    {
        slug: 'code-highlighter',
        name: 'Code Syntax Highlighting',
        shortDescription: 'Pretty-print <code> blocks in blog posts and docs.',
        description:
            'Adds Prism-based syntax highlighting to any <pre><code> block. Detects the language from the class name. Bundles 30+ language grammars and 4 colour schemes (light, dark, dim, dracula).',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,
        category: 'content',
        icon: 'Code2',
        tags: ['blog', 'docs', 'code'],
    },
];

/** Quick lookup by slug — returns undefined if the plugin isn't in the catalog. */
export function getManifest(slug: string): PluginManifest | undefined {
    return PLUGIN_CATALOG.find((p) => p.slug === slug);
}
