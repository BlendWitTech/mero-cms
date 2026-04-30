# Building a Plugin — Internal Developer Guide

For Blendwit / Mero engineers writing a new marketplace plugin from scratch. Plugins extend the CMS without forking it: they ship a manifest, optional widgets, optional capability flags, optional admin UI, optional new endpoints. Customers install them from `/dashboard/plugins`.

If you're an external partner agency, read [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) instead.

---

## 1. The mental model

A **plugin** is a manifest entry in `backend/src/plugins/catalog.ts` plus (optionally) component code shipped under an `@mero-plugin/<slug>` npm package. The manifest describes:

- Identity (slug, name, description, version, author, price)
- Tier gating (`minTier`, `compatibleThemes`, `requiredThemeFields`)
- Contributed widgets (`widgets[]`, surfaced in the editor's palette)
- Capabilities flipped on install (e.g. `forms`, `analytics`)

A free plugin (`priceNPR: 0`) installs straight from the marketplace. A paid plugin gates on a license key generated from the order flow. Both go through the same `checkInstallGates()` gate that verifies tier + theme compatibility.

## 2. Repo layout

Plugins live in two places:

```
backend/src/plugins/
├─ catalog.ts                  # The manifest list (PLUGIN_CATALOG[])
├─ plugins.service.ts          # Install/uninstall/gate logic
└─ plugins.controller.ts       # /plugins endpoints

# Optional npm package shipped alongside if the plugin contributes
# rendered components, admin pages, or runtime hooks:
node_modules/@mero-plugin/<slug>/
├─ widgets/                    # Public-site widget components
├─ admin/                      # Admin-side React pages (mounted dynamically)
└─ index.ts                    # Public surface
```

For v1, plugins ship as catalog entries only. The `@mero-plugin/*` package convention is the "code-shipped" path used in Phase 6.2 (#89) for plugin widgets.

## 3. The minimal plugin — manifest only

```ts
// backend/src/plugins/catalog.ts
export const PLUGIN_CATALOG: PluginManifest[] = [
    // ... existing entries ...
    {
        slug: 'cookie-consent',                    // unique kebab-case ID
        name: 'Cookie Consent Banner',             // marketplace card title
        shortDescription: 'EU-compliant cookie consent banner with two clicks.',
        description: 'Adds a bottom-of-page cookie consent banner. Three pre-built styles…',
        author: 'Mero CMS Labs',
        version: '1.0.0',
        priceNPR: 0,                               // 0 = free
        category: 'utility',                       // analytics | seo | commerce | marketing | security | content | utility
        icon: 'Cookie',                            // Lucide icon name
        tags: ['gdpr', 'consent', 'compliance'],
    },
];
```

That's the entire surface for a no-code plugin. After server restart it shows up in `/dashboard/plugins`. Install button works out of the box (writes a row to the `installed_plugins` setting).

The plugin is now "active" but doesn't DO anything yet — that's what the `widgets[]` field and the capability flags are for.

## 4. Plugin contributing a widget (Phase 6.1)

Add a `widgets[]` array to the manifest:

```ts
{
    slug: 'carousel-pro',
    name: 'Carousel Pro',
    // ... rest of manifest ...
    widgets: [
        {
            type: 'carousel-pro:Carousel',         // Convention: <slug>:<TypeName> to avoid collisions
            name: 'Carousel',
            description: 'Auto-rotating slides with prev/next + dots',
            icon: 'GalleryHorizontal',
            category: 'media',
            premium: false,
            fields: [
                { key: 'eyebrow', type: 'string', label: 'Eyebrow' },
                { key: 'title',   type: 'string', label: 'Headline' },
                {
                    key: 'slides', type: 'repeater', label: 'Slides',
                    itemSchema: [
                        { key: 'image', type: 'image',  label: 'Image' },
                        { key: 'title', type: 'string', label: 'Title' },
                        { key: 'href',  type: 'string', label: 'CTA URL' },
                    ],
                },
            ],
        },
    ],
    widgetCategories: [
        { key: 'media', label: 'Media', description: 'Image / video / interactive' },
    ],
}
```

When the plugin is **installed AND enabled**, `themes.service.getWidgetCatalog()` merges these into the active theme's catalog with `pluginSlug: 'carousel-pro'` stamped on each. The visual editor's palette shows them automatically — same shape as theme widgets, no special-case UI.

Public-site rendering is the next step.

## 5. Shipping the widget component (Phase 6.2)

The catalog merge tells the editor the widget exists. To render it on the public site, ship a React component.

### 5.1 Publish a component package

Create `@mero-plugin/carousel-pro` as an npm package the theme can install:

```ts
// @mero-plugin/carousel-pro/src/index.ts
import Carousel from './Carousel';
export default Carousel;
export { Carousel };
export type { CarouselProps } from './Carousel';
```

```tsx
// @mero-plugin/carousel-pro/src/Carousel.tsx
'use client';
import { useEffect, useState } from 'react';
export interface CarouselProps {
    data?: { eyebrow?: string; title?: string; slides?: Array<{ image: string; title?: string; href?: string }> };
}
export default function Carousel({ data = {} }: CarouselProps) {
    // ... your real carousel logic ...
}
```

### 5.2 Theme registers the component

Inside the theme that wants to render the plugin's widget:

```tsx
// themes/<theme>/src/lib/plugin-bindings.tsx
import { registerPluginWidget } from '@mero/theme-base';
import Carousel from '@mero-plugin/carousel-pro';

registerPluginWidget('carousel-pro', 'carousel-pro:Carousel', Carousel);
```

Import the bindings file once at the top of `app/layout.tsx`:

```tsx
import '@/lib/plugin-bindings';
```

Now when the customer drops a Carousel widget on a page AND has the plugin installed, the public site renders the real component. Without the plugin, the theme falls back to a placeholder that's only visible in edit mode.

## 6. Capability gating

If your plugin enables a tier-locked feature, declare it via the capability map. Capability flags are checked at request time by `useCapabilities()` / `getCapabilities()` and gate UI accordingly.

### 6.1 Adding a new capability

Edit `backend/src/auth/capabilities.ts` (or wherever the canonical capability set lives):

```ts
export interface PackageCapabilities {
    // ... existing flags ...
    funnels: boolean;
}
```

Then have the plugin install flow set it:

```ts
// In plugins.service.install()
if (manifest.slug === 'advanced-analytics') {
    // Persist a runtime flag the capability resolver reads.
    await this.prisma.setting.upsert({
        where: { key: 'plugin_funnels_enabled' },
        create: { key: 'plugin_funnels_enabled', value: 'true' },
        update: { value: 'true' },
    });
}
```

And teach the capability resolver to read it:

```ts
// In auth/capabilities.service.ts
async resolveCapabilities(packageId: string): Promise<PackageCapabilities> {
    const baseCapabilities = TIER_CAPABILITIES[packageId];
    const pluginFunnels = await this.prisma.setting.findUnique({ where: { key: 'plugin_funnels_enabled' } });
    return {
        ...baseCapabilities,
        funnels: baseCapabilities.funnels || pluginFunnels?.value === 'true',
    };
}
```

The theme then reads `caps.funnels` and renders accordingly. The plugin doesn't need to know which theme will read it.

### 6.2 Capability uninstall cleanup

In `plugins.service.uninstall()`, walk the manifest's `flippedCapabilities` and reset them:

```ts
const FLIPPED: Record<string, string[]> = {
    'advanced-analytics': ['plugin_funnels_enabled'],
    // ...
};
for (const settingKey of (FLIPPED[slug] ?? [])) {
    await this.prisma.setting.delete({ where: { key: settingKey } }).catch(() => {});
}
```

## 7. Tier and theme gating

Every plugin manifest can declare:

- `minTier: 'premium' | 'professional' | 'enterprise'` — minimum-floor (Custom inherits Professional access). Maps to numeric tier in `MIN_TIER_MAP`.
- `compatibleThemes: ['*'] | ['mero-pro', 'mero-clientname']` — allowlist. `'*'` means "any theme".
- `requiredThemeFields: ['sectionVariants', 'brandingFields']` — top-level theme.json keys that must exist.

`checkInstallGates(manifest)` returns `{ status: 'ok' | 'tier' | 'theme' | 'both', message }` which the marketplace UI surfaces as the gate badge + upgrade CTA. Refused installs throw `ForbiddenException` with the same message.

Test the gate matrix on a fresh dummy license:

```bash
# Set a Basic-tier package
curl -X POST localhost:4000/packages/active -d '{"id":"personal-basic"}'

# Try to install a Premium-only plugin → should 403 with "Requires Premium"
curl -X POST localhost:4000/plugins/install -d '{"slug":"advanced-analytics"}'
```

## 8. Lifecycle hooks

`plugins.service.ts` already calls these methods. Add per-plugin logic by switching on `manifest.slug` inside them:

| Hook | When | What to put here |
| --- | --- | --- |
| `install(slug)` | Marketplace install | Seed plugin-specific settings, tables, sample data. |
| `toggle(slug, enabled)` | Disable / re-enable | Don't destroy data — flip a flag. |
| `uninstall(slug)` | Remove | Clean up settings, optionally drop tables (ask the user first). |
| `verifyPurchase(orderId, slug)` | After payment webhook | Bind license key, mark as paid. |

Keep these idempotent — install can be called twice on the same install if a webhook double-fires.

## 9. Adding admin UI

If your plugin needs its own admin page (e.g. "Funnels" sidebar entry under analytics), the current pattern is:

1. Add a route to `frontend/src/app/(admin)/dashboard/funnels/page.tsx`.
2. Gate it with `useCapabilities`:

```tsx
'use client';
import { useCapabilities } from '@/context/CapabilitiesContext';
import UpgradePrompt from '@/components/ui/UpgradePrompt';

export default function FunnelsPage() {
    const { has, capsLoading } = useCapabilities();
    if (capsLoading) return null;
    if (!has('funnels')) {
        return <UpgradePrompt feature="funnels" minTier="Premium" />;
    }
    return <FunnelsDashboard />;
}
```

3. Add the sidebar entry in `frontend/src/components/admin/Sidebar.tsx` with the same `has('funnels')` check.

In v2 plugins will declare admin-page contributions in the manifest and the sidebar will pick them up automatically. Until then, hand-edit.

## 10. Adding new public endpoints

Plugins that expose new content models (events, bookings, …) add a NestJS controller:

```ts
// backend/src/plugins/funnels/funnels.controller.ts
@Controller('public/funnels')
export class FunnelsController {
    constructor(private funnelsService: FunnelsService) {}
    @Get(':slug') async getFunnel(@Param('slug') slug: string) { return this.funnelsService.getBySlug(slug); }
}
```

Wire it into `AppModule`. Themes call it from their `lib/api.ts`:

```ts
export function getFunnel(slug: string): Promise<Funnel | null> {
    return apiFetch(`/public/funnels/${encodeURIComponent(slug)}`, null);
}
```

Guard the call in the theme so a missing plugin doesn't 500:

```tsx
const caps = await getCapabilities();
if (!caps?.funnels) return null;
const funnel = await getFunnel('checkout-flow');
```

## 11. Common pitfalls

- **Manifest slug clashes with a widget type.** Don't name a plugin `hero` — the widget type `Hero` already exists in every theme. Use `<slug>:Hero` for plugin-contributed widgets to avoid collisions.
- **Forgot to enable after installing.** `install()` adds the plugin to `installed_plugins` with `enabled: true` by default. If you've manually flipped `enabled: false`, the widget catalog merge skips your plugin. Symptom: editor doesn't show the widgets even though the marketplace says installed.
- **Capability check before `capsLoading` resolved.** Always early-return `null` while `capsLoading === true`. Otherwise the page flashes the upgrade prompt before resolving.
- **Hardcoded paid plugin price.** All NPR amounts must come from `priceNPR` — don't sprinkle `12000` literals. The pricing page reads the same field.
- **Skipped the gate test on Basic.** Run the install matrix on a fresh Basic-tier dummy license before shipping. Most regressions are "I forgot the Basic-tier user can't install this even though I tested on my Custom-dev license".

## 12. Where to go next

- [BUILDING_A_THEME.md](BUILDING_A_THEME.md) — the theme side of the contract.
- [CONNECTING_PLUGINS.md](CONNECTING_PLUGINS.md) — surfacing plugin features in a theme.
- [../PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) — long-form external-facing plugin spec.
- `backend/src/plugins/catalog.ts` — read existing entries for examples (analytics, SEO boost, newsletter, Stripe).
