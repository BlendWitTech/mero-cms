# Mero CMS — Plugin Developer Guide

Last revision: April 2026 · v1.4.0

This guide covers how to build, ship, and price plugins for the Mero CMS marketplace. Plugins extend the CMS with optional functionality — analytics, payment integrations, AI tools, security add-ons — that customers buy à la carte.

**Audience.** Developers contracted by Blendwit or third-party studios building marketplace plugins. Familiarity with NestJS (backend) and React/Next (frontend if the plugin has UI) is assumed.

---

## 1. What a plugin is

A plugin is a self-contained unit that:

1. **Declares itself** in a manifest entry under `backend/src/plugins/catalog.ts`.
2. **Optionally adds backend modules** (NestJS modules with controllers, services, guards).
3. **Optionally adds frontend UI** (admin pages, hooks into existing pages).
4. **Optionally adds theme integrations** (sections, hooks rendered when the plugin is installed).
5. **Sells itself** through the marketplace — free or paid via Khalti/Stripe/eSewa.

Today's plugin model is **static catalog + dynamic install**. The catalog ships with the CMS; customers install plugins from it. A future v2 will move to a remote registry — manifests can stay the same shape.

---

## 2. The PluginManifest

Defined in `backend/src/plugins/catalog.ts`:

```ts
export interface PluginManifest {
    slug: string;                  // unique kebab-case id
    name: string;                  // display name
    shortDescription: string;      // one-liner on marketplace card
    description: string;           // longer paragraph, modal/details view
    author: string;                // 'Mero CMS Labs', 'Studio Name'
    version: string;               // semver
    priceNPR: number;              // 0 = free; >0 = paid
    category: PluginCategory;      // 'analytics' | 'seo' | 'commerce' | 'marketing' | 'security' | 'content' | 'utility'
    icon?: string;                 // lucide-react icon name OR emoji
    featured?: boolean;            // promotes to top of marketplace

    // Tier gate
    minTier?: 'premium' | 'professional' | 'enterprise';

    // Theme compatibility gate
    compatibleThemes?: string[];   // ['*'] = any theme; otherwise allowlist of slugs
    requiredThemeFields?: string[]; // require these top-level keys in theme.json

    tags?: string[];
    requirements?: string[];       // human-readable prerequisites
    docsUrl?: string;
}
```

### 2.1 The dual gate

Every plugin install passes through two gates simultaneously:

**Tier gate.** `minTier` against the customer's licensed tier (numeric: premium=2, professional=3, enterprise=3). Plugin install refused if customer's tier is below.

**Theme gate.** Two ways:

- `compatibleThemes: ['*']` — any theme works (most plugins).
- `compatibleThemes: ['mero-pro', 'starter-pro']` — only these themes.
- `requiredThemeFields: ['sectionVariants']` — the active theme's `theme.json` must have these top-level keys (used by the Visual Editor plugin).

The gate logic is in `PluginsService.checkInstallGates(manifest)`. It returns:

```ts
{
    status: 'ok' | 'tier' | 'theme' | 'both',
    installable: boolean,
    requiredTier?: number,
    requiredTierLabel?: string,
    currentTier: number,
    requiredThemeFields?: string[],
    compatibleThemes?: string[],
    currentThemeSlug: string | null,
    message?: string,
}
```

The marketplace UI uses this to render per-card banners ("Requires Premium → Upgrade your license", "Theme must declare sectionVariants → Switch themes"). Customers can see exactly what they need.

### 2.2 Pricing

`priceNPR: 0` = free, installs immediately. `priceNPR > 0` requires the customer to pay first via the standard payments pipeline (Khalti/Stripe/eSewa). On success, the marketplace's verify endpoint installs the plugin with the issued license key.

Plugin pricing is **one-time** by default. For subscription plugins, a future v2 will add a `subscription: 'monthly' | 'annual'` field; for now subscription-style plugins are sold annually via the maintenance pattern (you pay each year for continued updates).

---

## 3. Adding a plugin to the catalog

### 3.1 Add the manifest entry

`backend/src/plugins/catalog.ts`:

```ts
export const PLUGIN_CATALOG: PluginManifest[] = [
    // … existing plugins
    {
        slug: 'instagram-feed',
        name: 'Instagram Feed',
        shortDescription: 'Embed your Instagram feed on any page.',
        description: 'Adds an `<InstagramFeed>` section to your theme. Pulls the latest 12 posts from a configured account, caches them for 60 minutes, lazy-loads images, and degrades to a static gallery if Instagram is rate-limiting.',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 3500,
        category: 'content',
        icon: 'Instagram',
        minTier: 'premium',
        compatibleThemes: ['*'],
        tags: ['social', 'instagram', 'feed'],
        requirements: ['Instagram Basic Display API access token'],
        docsUrl: 'https://docs.mero.cms/plugins/instagram-feed',
    },
];
```

That's it for the marketplace listing. The plugin now appears in `/dashboard/plugins` with the right gate state per customer.

### 3.2 Implementing the plugin's behaviour

Plugins are **just code in the same monorepo** — there's no isolated plugin loader. The catalog entry tells the CMS a plugin exists; the actual feature lives in:

- A new NestJS module in `backend/src/plugins/<slug>/` (if it adds API endpoints or background jobs).
- New admin pages in `frontend/src/app/(admin)/dashboard/<slug>/` (if it has an admin UI).
- A theme integration (a section component, a hook, etc.) that themes opt into.

Plugins are **gated at runtime** by checking whether they're installed:

```ts
// In a guard or service:
const isActive = await this.pluginsService.isActive('instagram-feed');
if (!isActive) throw new ForbiddenException('Plugin not installed');
```

Or in a frontend component:

```tsx
const { has, plugins } = useCapabilities();
if (!plugins?.['instagram-feed']?.enabled) return null;
```

This means a customer who hasn't bought the plugin sees no trace of it — its routes 403, its admin UI doesn't render, the theme section it would have provided is absent.

---

## 4. Build patterns

### 4.1 Backend-only plugin

Example: a webhook signing utility.

- Add a NestJS module `backend/src/plugins/webhook-signer/`.
- Register conditionally in `app.module.ts` (no — register always, gate at the controller level).
- Use a guard on every endpoint:

```ts
@Injectable()
export class PluginActiveGuard implements CanActivate {
    constructor(
        private readonly plugins: PluginsService,
        @Inject('PLUGIN_SLUG') private slug: string,
    ) {}
    async canActivate() {
        return await this.plugins.isActive(this.slug);
    }
}

@Controller('webhook-signer')
@UseGuards(JwtAuthGuard, PluginActiveGuard)
@PluginSlug('webhook-signer')
export class WebhookSignerController {
    // …
}
```

The guard returns 403 if the plugin isn't installed.

### 4.2 Admin-UI plugin

Example: Advanced Analytics adds funnel + cohort views to the dashboard.

- Add the route at `frontend/src/app/(admin)/dashboard/funnels/page.tsx`.
- In the Sidebar, add the entry with `requiresPlugin: 'advanced-analytics'`.
- The Sidebar uses `useCapabilities().plugins[slug]?.enabled` to filter the entry.

### 4.3 Theme-integration plugin

Example: Stripe Checkout adds a `<StripeCheckoutButton>` section.

- The theme's `theme.json` declares `supportedPlugins: { 'stripe-checkout': 'compatible' }`.
- The theme imports the section component conditionally:

```tsx
const StripeCheckoutButton = capabilities.plugins?.['stripe-checkout']?.enabled
    ? require('@plugins/stripe-checkout/StripeCheckoutButton').default
    : null;
```

Or — cleaner — the theme's section catalog is augmented at activation time when the plugin is installed. Architecture for v1.5+; for now the require-conditional pattern works.

### 4.4 Free vs paid plugin difference

Free plugins (`priceNPR: 0`) install immediately when the customer clicks "Install". The flow is one-call:

```ts
await apiRequest(`/plugins/${slug}/install`, { method: 'POST' });
```

Paid plugins go through the order pipeline. The marketplace card's "Purchase" button calls:

```ts
const order = await apiRequest(`/plugins/${slug}/purchase`, {
    method: 'POST',
    body: { provider: 'khalti' },
});
window.location.href = order.redirectUrl;
```

After the customer pays, they land on `/checkout/success?orderId=…`, which polls the Order until status=paid, then calls verify:

```ts
await apiRequest(`/plugins/${slug}/verify?orderId=${orderId}`);
```

`verifyPurchase` reads the Order, confirms status is paid, and installs with the issued license key. This bypasses the gate check (the gate was already verified at purchase time).

---

## 5. Theme compatibility — practical examples

### 5.1 Plugin that works with any theme

```ts
{
    slug: 'cloudflare-turnstile',
    minTier: 'premium',
    compatibleThemes: ['*'],   // or omit entirely — same effect
    requiredThemeFields: undefined,
}
```

This plugin patches the form-submission backend; doesn't depend on theme markup.

### 5.2 Plugin that needs section variants

```ts
{
    slug: 'visual-editor',
    minTier: 'premium',
    requiredThemeFields: ['sectionVariants'],
}
```

The visual editor needs the active theme to declare `sectionVariants` in its `theme.json`. If the customer's theme doesn't, the plugin can't function — the gate refuses install with the message *"The active theme doesn't expose sectionVariants in its theme.json. Switch themes →"*.

### 5.3 Plugin that only works with one specific theme

```ts
{
    slug: 'mero-pro-helpers',
    compatibleThemes: ['mero-pro'],
}
```

Niche pattern. The plugin is bespoke for the marketing theme and uses internal markup conventions.

---

## 6. Marketplace UI

The `frontend/src/app/(admin)/dashboard/plugins/page.tsx` page reads `/plugins/marketplace` which returns:

```ts
[
    {
        slug, name, shortDescription, description, author, version, priceNPR,
        category, icon, featured, minTier, compatibleThemes, requiredThemeFields,
        tags, installed, enabled,
        gate: {
            status: 'ok' | 'tier' | 'theme' | 'both',
            installable: boolean,
            requiredTier, requiredTierLabel, currentTier,
            requiredThemeFields, compatibleThemes, currentThemeSlug,
            message,
        }
    },
    // …
]
```

Each card renders:

- Plugin name + short description + price.
- "Featured" badge if `featured: true`.
- "Installed" badge if already installed.
- Tier badge (`Premium+`, `Pro+`, etc.).
- Tags.
- **Gate banner** if `gate.installable` is false:
  - Tier banner (amber): "Requires Premium → Upgrade your license"
  - Theme banner (indigo): "Theme must declare: sectionVariants → Switch themes"
  - Both can show simultaneously.
- Install / Purchase button (or "Unavailable" disabled state when gated).

This UI is fully driven by the catalog + the gate computation — to add new visual states, edit `frontend/src/app/(admin)/dashboard/plugins/page.tsx`'s `MarketplaceCard` and `GateBanner` components.

---

## 7. Lifecycle and storage

Installed plugins live in a single Setting row keyed `installed_plugins`, value is JSON-serialised array:

```json
[
    {
        "slug": "advanced-analytics",
        "name": "Advanced Analytics",
        "version": "1.0.0",
        "enabled": true,
        "installedAt": "2026-04-26T10:00:00Z",
        "licenseKey": "PLG-ADV-X8KJ4N",
        "purchasedPriceNPR": 5000,
        "config": { "scope": "global" }
    }
]
```

`PluginsService` reads/writes this row. For richer per-plugin storage (e.g. analytics events, scheduled jobs), add a real Prisma model in your plugin's module fragment under `backend/prisma/modules/<plugin-slug>.prisma`.

---

## 8. Plugin testing checklist

Before shipping a plugin manifest entry:

- [ ] **Tier gate.** Try installing as a Basic-tier customer. Should refuse with the right message.
- [ ] **Theme gate.** If `requiredThemeFields` is set, switch to a theme that doesn't have those fields. Should refuse.
- [ ] **Successful install.** Pay (or click free install), watch the install + verify flow, confirm the plugin appears in the Installed tab.
- [ ] **Toggle.** Disable the plugin from the Installed tab. Confirm dependent features hide.
- [ ] **Uninstall.** Remove the plugin. Confirm clean state — no orphan rows, no broken admin nav.
- [ ] **Re-install after uninstall.** Should work without re-purchase.
- [ ] **Marketplace listing.** Confirm the card shows correctly: featured state, badge, gate banners (where applicable).
- [ ] **Permissions.** Test as a Contributor role — they shouldn't see admin pages they don't have permission for, even if the plugin is installed.

---

## 9. Versioning and updates

Each plugin in the catalog has its own `version`. When the customer's installed version differs from the catalog's, the Installed tab shows an "Update available" badge.

Update flow (planned for v1.5; not yet wired):

1. Customer clicks "Update".
2. Backend re-reads the catalog manifest.
3. If the new version requires a higher tier or a different theme, the gate check runs again.
4. If allowed, version on the InstalledPlugin record bumps; if behaviour requires a backend rebuild (most plugins do), the customer is told to restart.

For now, plugin updates ship with full CMS releases.

---

## 10. Submitting a plugin

If you're a third-party studio submitting to the Blendwit-curated marketplace:

1. **Reach out to Blendwit before building.** We'll review the use case + price + tier fit.
2. **Build against a development install.** Verify it works on a fresh DB, multiple themes, and at least two tiers (Premium + Pro).
3. **Submit a pull request** with the manifest entry + any backend module + any frontend UI + tests + docs.
4. **Code review.** Blendwit reviews for security (especially payment + webhook signature handling), performance, and UX.
5. **Pricing review.** The 70/30 revenue split (developer/Blendwit) is the default; bespoke deals possible for high-volume plugins.
6. **Listing.** Once approved, your plugin ships with the next CMS release.

For internal Blendwit Labs plugins, skip the submit step — just merge.

---

## 11. Common pitfalls

**Forgetting to set `minTier`.** Means the plugin shows on Basic tier — fine if it should, problem if you intended a tier gate. Default to setting it explicitly.

**`compatibleThemes: []` (empty array)**. The dual gate logic treats this as "no themes supported" — i.e. always blocked. To mean "any theme", use `['*']` or omit the field entirely.

**Backend module added but never registered.** A NestJS module not in `app.module.ts`'s imports doesn't load. Plugins should always register their module unconditionally; gate at the route/guard level instead.

**Frontend component fetching a 404 endpoint.** When the plugin isn't installed, its endpoints return 403/404. Frontend components must handle that gracefully — pass `skipNotification: true` to `apiRequest` and have `.catch(() => null)` on every fetch.

**Schema migrations forgotten.** Prisma schemas don't auto-rebuild — when you add a `<plugin-slug>.prisma` fragment, you must update the schema build script's `MODULE_SCHEMA_MAP` and re-run `db push` (or whatever deploy step the install pipeline uses).

---

## 12. Reference: current catalog (April 2026)

| Slug | Price NPR | Min tier | Category |
|---|---|---|---|
| visual-editor | 12,000 | Premium | Utility |
| advanced-analytics | 5,000 | Premium | Analytics |
| seo-boost | 3,500 | Premium | SEO |
| newsletter-kit | 4,500 | Premium | Marketing |
| cloudflare-turnstile | 0 | Premium | Security |
| stripe-checkout | 7,500 | Professional | Commerce |
| ai-alt-text | 2,500 | Premium | Content |
| multilingual-lite | 6,000 | Professional | Content |
| backup-scheduler | 0 | Premium | Utility |

Free plugins are typically Blendwit Labs-built; paid plugins can be either Labs-built or third-party.

---

## 13. Changelog

- **v1.4.0** (2026-04) — Plugin manifest gained `compatibleThemes` and `requiredThemeFields`. Dual-gate compatibility check enforced at install time. Marketplace UI shows per-plugin gate state with remediation links. Plugin purchase flow rebuilt to use the unified Order pipeline (was Khalti-only and mocked).

- **v1.3.x** — Initial static catalog (9 plugins). `minTier` declared but not enforced. Khalti-only purchase flow.
