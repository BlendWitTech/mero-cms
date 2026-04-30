/**
 * Mero CMS backend client.
 *
 * Talks to the NestJS backend (default :3001 in dev). All endpoint paths
 * are direct controller paths — there is no global `/api` prefix on the
 * backend. See `docs/INTEGRATION_NOTES.md` for the full surface.
 *
 * Pattern: every fetch goes through `safeFetch()` which catches network
 * errors and returns a sensible fallback. Sections use the returned
 * data when present, and fall back to component-local DEFAULTS when
 * `siteData` is null (offline/dev) or a field isn't authored.
 */

/**
 * Pick the right backend base URL for the current execution context.
 *
 * Why this is split: server-side fetches (in Server Components, route
 * handlers, generateMetadata, etc.) run inside Node where Node's
 * fetch refuses relative URLs — it needs an origin. Client-side
 * fetches in the browser can use a relative `/api/*` path which the
 * Next.js rewrite forwards to the backend.
 *
 *   • In the browser → `/api` so the same-origin proxy handles it.
 *   • On the server → BACKEND_URL or NEXT_PUBLIC_API_URL or
 *     `http://localhost:3001` (the default backend port) so Node's
 *     fetch has a real URL to connect to.
 *
 * The previous "always /api" default broke SSR in self-hosted
 * deploys because the pricing page (a Server Component) couldn't
 * resolve the relative URL.
 */
function resolveApiBase(): string {
    if (typeof window === 'undefined') {
        return (
            process.env.BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            'http://localhost:3001'
        );
    }
    return process.env.NEXT_PUBLIC_API_URL || '/api';
}

const MEDIA_HOST = process.env.NEXT_PUBLIC_MEDIA_HOST || 'localhost';

/* ── Internal helpers ───────────────────────────────────────────── */

interface FetchOptions extends RequestInit {
    /** Tag for ISR revalidation. Defaults to 'mero-cms' so admin saves can
        revalidate everything theme-side via a single tag. */
    tag?: string;
    /** Seconds the response is cached. Defaults to 120s for content. */
    revalidate?: number;
    /** Per-request timeout in milliseconds. Defaults to 3000 — short
        enough that a slow / not-yet-booted backend doesn't stall the
        SSR pipeline; the safeFetch fallback kicks in instead. */
    timeoutMs?: number;
}

async function apiFetch<T>(path: string, fallback: T, options: FetchOptions = {}): Promise<T> {
    const { tag = 'mero-cms', revalidate = 120, timeoutMs = 3000, ...init } = options;
    try {
        const res = await fetch(`${resolveApiBase()}${path}`, {
            ...init,
            // AbortSignal.timeout guarantees the fetch rejects after
            // `timeoutMs` ms. This is critical during `npm run dev:all`
            // where the theme can boot before the backend's migrations
            // finish — without a timeout the first SSR can hang for
            // 30+ seconds before failing.
            signal: init.signal || AbortSignal.timeout(timeoutMs),
            headers: {
                Accept: 'application/json',
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
                ...init.headers,
            },
            // ISR: cache for `revalidate` seconds, taggable for invalidation.
            next: init.method && init.method !== 'GET'
                ? undefined
                : { revalidate, tags: [tag] },
        });
        if (!res.ok) return fallback;
        return (await res.json()) as T;
    } catch {
        // Network error / timeout / backend offline — fall back so the
        // page still renders from component-local defaults.
        return fallback;
    }
}

/** POST helper (no caching, no fallback — surfaces errors to the caller).
    Has its own (longer) timeout so form submissions don't hang forever. */
async function apiPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
    const res = await fetch(`${resolveApiBase()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Request failed (${res.status})`);
    }
    return (await res.json()) as TRes;
}

/* ── Types — mirror the actual backend response shapes ──────────── */

export interface SiteDataSettings {
    siteTitle: string;
    tagline: string;
    copyrightText: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    /** Public site URL (used by sitemap, robots, OG canonical). Configurable
        in admin → Branding instead of via NEXT_PUBLIC_SITE_URL env var. */
    siteUrl: string | null;
    /** Optional media host override for next/image. Falls back to siteUrl
        host when null. */
    mediaHost: string | null;
    primaryColor: string | null;
    cmsTitle: string;
    cmsSubtitle: string | null;
    cmsLogo: string | null;
    footerText: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    socialLinks: Record<string, string> | null;
    activeTheme: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    heroBgImage: string | null;
    heroBgVideo: string | null;
    aboutTitle: string | null;
    aboutContent: string | null;
    aboutImage: string | null;
    ctaText: string | null;
    ctaUrl: string | null;
    metaDescription: string | null;
    googleAnalyticsId: string | null;
    headingFont: string | null;
    bodyFont: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    // Interface color palette — drive --ink, --ink-2, --link, --ink-3 in CSS.
    textColor: string | null;
    headingColor: string | null;
    linkColor: string | null;
    mutedTextColor: string | null;
    // Typography scale + weight — drive --base-fs, --hw, --bw.
    baseFontSize: string | null;     // e.g. "16px" or "1rem"
    headingWeight: string | null;    // e.g. "700"
    bodyWeight: string | null;       // e.g. "400"
    // Layout tokens — drive --r-md and --density.
    borderRadius: string | null;     // e.g. "12px"
    layoutDensity: string | null;    // "compact" | "comfortable" | "spacious" or px value
    listingMode: 'load-more' | 'pagination';
}

export interface SiteDataLimits {
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    storageLimitGB: number;
    teamLimit: number;
}

export interface SectionInstance {
    id: string;
    type: string;
    data: Record<string, unknown>;
    _variant?: string;
}

export interface PageRecord {
    id: string;
    slug: string;
    title: string;
    description?: string;
    content?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
    theme: string | null;
    data?: { sections?: SectionInstance[] };
    createdAt: string;
    updatedAt: string;
}

export interface MenuItem {
    id: string;
    menuId: string;
    label: string;
    url: string;
    order: number;
    parentId: string | null;
    children: MenuItem[];
    icon?: string;
    isActive: boolean;
}

export interface MenuRecord {
    id: string;
    slug: string;
    name: string;
    theme: string | null;
    items: MenuItem[];
    createdAt: string;
    updatedAt: string;
}

export interface TestimonialRecord {
    id: string;
    clientName: string;
    name: string;
    clientRole?: string;
    role?: string;
    clientCompany?: string;
    content: string;
    rating: number;
    clientAvatar?: string;
    avatarUrl?: string;
    order: number;
    isActive: boolean;
}

export interface TeamMemberRecord {
    id: string;
    name: string;
    role: string;
    bio?: string;
    avatar?: string;
    order: number;
    socialLinks?: Record<string, string>;
    isActive: boolean;
}

export interface ServiceRecord {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    image?: string;
    order: number;
    isActive: boolean;
}

export interface PostRecord {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    featuredImageUrl?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
    featured: boolean;
    publishedAt?: string;
    authorId: string;
    author: { name: string };
    categories: { name: string; slug: string }[];
    tags?: { id: string; name: string; slug: string }[];
    createdAt: string;
    updatedAt: string;
}

export interface CollectionRecord {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: string;
    fields: { name: string; label: string; type: string; required?: boolean }[];
    items: CollectionItemRecord[];
}

export interface CollectionItemRecord {
    id: string;
    collectionId: string;
    data: Record<string, unknown>;
    slug?: string;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PackageRecord {
    id: string;
    name: string;
    description?: string;
    /** One-time license price in NPR. May be 'custom' for the Custom tier. */
    price: number;
    /** Anchor for Custom-tier pricing — "Starting at NPR X". */
    priceFromNPR?: number;
    /** Optional annual maintenance fee — covers updates + patches. */
    maintenanceNPR?: number;
    currency?: string;
    websiteType: 'personal' | 'organizational';
    tier: number;
    features: string[];
    tagline?: string;
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    storageLimitGB: number;
    teamLimit: number;
    highlighted?: boolean;
}

/**
 * Mero Cloud managed-hosting tier — separate from CMS license. Customers
 * who want zero ops add one of these annually. Lifecycle/billing flow
 * is in the marketing checkout, not the CMS itself.
 */
export interface CloudTierRecord {
    id: string;
    name: string;
    pairsWith: ('personal' | 'organizational')[];
    annualNPR: number;
    tagline: string;
    features: string[];
    storageLimitGB: number;
    bandwidthGB: number;
    sites: number;
    backupRetentionDays: number;
}

export function getCloudTiers(): Promise<CloudTierRecord[]> {
    return apiFetch<CloudTierRecord[]>('/public/cloud-tiers', []);
}

/**
 * Raw packages config — bypasses the DB-backed /packages endpoint so the
 * marketing site renders prices straight from `config/packages.ts`. Use
 * this for the pricing page; use `getPackages()` for the admin context
 * (which may have customized labels in the DB).
 */
export interface PackagesConfigRecord {
    id: string;
    name: string;
    websiteType: 'personal' | 'organizational';
    tier: number;
    aiEnabled: boolean;
    priceNPR: number | 'custom';
    priceFromNPR?: number;
    maintenanceNPR?: number;
    tagline: string;
    features: string[];
    comingSoon?: string[];
    starterThemes: string[];
    supportLevel: 'email' | 'priority' | 'dedicated';
    highlighted?: boolean;
    storageLimitGB: number;
    teamLimit: number;
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
}

export function getPackagesConfig(type?: 'personal' | 'organizational'): Promise<PackagesConfigRecord[]> {
    const qs = type ? `?type=${type}` : '';
    return apiFetch<PackagesConfigRecord[]>(`/public/packages-config${qs}`, []);
}

/* ── Payments ──────────────────────────────────────────────────── */

export interface PaymentProviderRecord {
    id: 'stripe' | 'khalti' | 'esewa';
    displayName: string;
    currencies: string[];
}

export function getPaymentProviders(): Promise<PaymentProviderRecord[]> {
    return apiFetch<{ providers: PaymentProviderRecord[] }>(`/payments/providers`, { providers: [] })
        .then(r => r.providers);
}

export interface CreateOrderInput {
    customerEmail: string;
    customerName?: string;
    customerPhone?: string;
    itemType: 'package' | 'plugin' | 'cloud-tier' | 'maintenance';
    packageId?: string;
    pluginSlug?: string;
    cloudTierId?: string;
    amountNPR: number;
    provider: 'stripe' | 'khalti' | 'esewa';
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, any>;
}

export interface CreateOrderResult {
    orderId: string;
    redirectUrl?: string;
    formParams?: Record<string, string>;
    providerOrderId: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    return apiPost('/payments/orders', input);
}

export interface OrderStatusRecord {
    id: string;
    status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
    customerEmail: string;
    licenseKey: string | null;
    licenseExpiresAt: string | null;
    paidAt: string | null;
    failureReason: string | null;
    itemType: string;
    packageId: string | null;
    pluginSlug: string | null;
    cloudTierId: string | null;
    amountNPR: number;
    currency: string;
}

export function getOrder(id: string): Promise<OrderStatusRecord | null> {
    return apiFetch<OrderStatusRecord | null>(`/payments/orders/${id}`, null);
}

export interface PageSchemaSection {
    id: string;
    type: string;
    label?: string;
    description?: string;
    variants?: { key: string; label: string; description?: string }[];
}

export interface PageSchema {
    slug: string;
    name: string;
    label: string;
    description?: string;
    sections: PageSchemaSection[];
}

export interface SiteDataBundle {
    pageSchema: PageSchema[];
    moduleAliases: Record<string, string>;
    settings: SiteDataSettings;
    limits: SiteDataLimits;
    enabledModules: string[];
    menus?: MenuRecord[];
    pages?: PageRecord[];
    team?: TeamMemberRecord[];
    testimonials?: TestimonialRecord[];
    services?: ServiceRecord[];
    recentPosts?: PostRecord[];
    collections?: CollectionRecord[];
    demoNextReset?: string;
}

export interface CapabilityMap {
    package: {
        id: string;
        name: string;
        tier: number;
        websiteType: string;
        supportLevel: 'email' | 'priority' | 'dedicated';
    } | null;
    capabilities: Record<string, boolean>;
    limits: {
        storageGB: number;
        teamMembers: number;
        hasWhiteLabel: boolean;
        hasApiAccess: boolean;
        aiEnabled: boolean;
        themeCount: number;
    };
    supportLevel: string;
    installedPlugins: string[];
    themeCompat?: {
        minPackageTier: number;
        isCompatible: boolean;
        requiredCapabilities: string[];
        missingRequired: string[];
        pluginIntegrations: Record<string, unknown>;
        supportedPlugins: Record<string, unknown>;
    };
}

export interface SeoMetaRecord {
    id: string;
    pageType: 'page' | 'post' | 'collection' | 'category';
    pageId: string;
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    robots?: string;
}

export interface RedirectRule {
    fromPath: string;
    toPath: string;
    statusCode: number;
}

export interface CategoryRecord {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: { id: string; email: string; name: string; [k: string]: unknown };
}

/* ── Public read API ────────────────────────────────────────────── */

/**
 * Fetch the entire site-data bundle. The spine of every page —
 * settings, menus, recentPosts, testimonials, etc. all come from here.
 */
export function getSiteData(): Promise<SiteDataBundle | null> {
    return apiFetch<SiteDataBundle | null>('/public/site-data', null);
}

/** Get a single page by slug (e.g. 'home', 'about'). */
export function getPage(slug: string): Promise<PageRecord | null> {
    return apiFetch<PageRecord | null>(`/public/pages/${encodeURIComponent(slug)}`, null);
}

/** Get all enabled pages (full list returned by site-data already). */
export function getCapabilities(): Promise<CapabilityMap | null> {
    return apiFetch<CapabilityMap | null>('/public/capabilities', null);
}

/** List packages, optionally filtered by website type. */
export function getPackages(type?: 'personal' | 'organizational'): Promise<PackageRecord[]> {
    const qs = type ? `?type=${type}` : '';
    return apiFetch<PackageRecord[]>(`/public/packages${qs}`, []);
}

/** Paginated public posts. */
export function getPosts(
    page = 1,
    limit = 10,
    status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' = 'PUBLISHED',
): Promise<{ data: PostRecord[]; total: number; page: number; limit: number }> {
    return apiFetch(
        `/public/posts?page=${page}&limit=${limit}&status=${status}`,
        { data: [], total: 0, page, limit },
    );
}

/** Single post by slug. */
export function getPost(slug: string): Promise<PostRecord | null> {
    return apiFetch<PostRecord | null>(`/public/posts/${encodeURIComponent(slug)}`, null);
}

/** Single collection (with first 50 items). */
export function getCollection(slug: string): Promise<CollectionRecord | null> {
    return apiFetch<CollectionRecord | null>(`/public/collections/${encodeURIComponent(slug)}`, null);
}

/** Paginated collection items. */
export function getCollectionItems(
    slug: string,
    page = 1,
    limit = 20,
    search?: string,
): Promise<{ data: CollectionItemRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) qs.set('search', search);
    return apiFetch(
        `/public/collections/${encodeURIComponent(slug)}/items?${qs.toString()}`,
        { data: [], total: 0, page, limit, totalPages: 0 },
    );
}

/** Single collection item by collection slug + item slug. */
export function getCollectionItem(slug: string, itemSlug: string): Promise<CollectionItemRecord | null> {
    return apiFetch<CollectionItemRecord | null>(
        `/public/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemSlug)}`,
        null,
    );
}

/** Menu by slug (e.g. 'main-nav', 'footer-product'). */
export function getMenu(slug: string): Promise<MenuRecord | null> {
    return apiFetch<MenuRecord | null>(`/menus/slug/${encodeURIComponent(slug)}`, null);
}

/** All blog categories. */
export function getCategories(): Promise<CategoryRecord[]> {
    return apiFetch<CategoryRecord[]>('/categories', []);
}

/** Per-page SEO override (returns null when no override is set). */
export function getSeoMeta(
    pageType: 'page' | 'post' | 'collection' | 'category',
    pageId: string,
): Promise<SeoMetaRecord | null> {
    return apiFetch<SeoMetaRecord | null>(`/seo-meta/${pageType}/${encodeURIComponent(pageId)}`, null);
}

/**
 * Check if a path has an active redirect rule. Used by Next.js
 * middleware to redirect on the edge.
 */
export function checkRedirect(path: string): Promise<RedirectRule | null> {
    return apiFetch<RedirectRule | null>(`/redirects/check/${encodeURIComponent(path)}`, null, {
        revalidate: 60,
    });
}

/* ── Form + lead submission ─────────────────────────────────────── */

/**
 * Submit a form by ID. The body is arbitrary JSON keyed by field
 * names from the form's schema (set in the admin). Backend rate-limits
 * to 10 requests/minute per IP.
 */
export function submitForm(
    formId: string,
    body: Record<string, unknown>,
): Promise<{ success: boolean; id?: string; message?: string }> {
    return apiPost(`/public/forms/${encodeURIComponent(formId)}/submit`, body);
}

/** Submit a lead (contact-style form). */
export function submitLead(body: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    source?: string;
}): Promise<{ success: boolean; id: string; message: string }> {
    return apiPost('/public/leads', body);
}

/* ── Auth ───────────────────────────────────────────────────────── */

export function login(body: {
    email: string;
    password: string;
    rememberMe?: boolean;
}): Promise<AuthResponse> {
    return apiPost<typeof body, AuthResponse>('/auth/login', body);
}

export function register(body: {
    email: string;
    password: string;
    name: string;
}): Promise<{ success: boolean; user?: AuthResponse['user']; error?: string }> {
    return apiPost('/auth/register', body);
}

export function refreshToken(refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
    return apiPost('/auth/refresh', { refresh_token });
}

export function logout(refresh_token?: string): Promise<{ success: boolean; message: string }> {
    return apiPost('/auth/logout', { refresh_token });
}

/* ── Helpers ────────────────────────────────────────────────────── */

/**
 * Resolve a media URL. The backend returns paths like '/uploads/foo.png';
 * this helper prepends the API URL so the browser fetches from the
 * right host. Pass-through for absolute URLs.
 */
export function mediaUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    return `${resolveApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Pick a section's data slot from a Page record by section ID.
 * Returns the section's `data` field (the editor-authored content) or
 * an empty object so callers can spread it over their DEFAULTS.
 */
export function pickSection<T extends Record<string, unknown>>(
    page: PageRecord | null,
    sectionId: string,
): Partial<T> {
    if (!page?.data?.sections) return {};
    const section = page.data.sections.find(s => s.id === sectionId);
    return (section?.data as Partial<T>) || {};
}

// Suppress unused-warning for fields we plan to use later in this phase.
export { MEDIA_HOST };
