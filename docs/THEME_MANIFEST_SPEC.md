# Theme Manifest — Package & Plugin Compatibility Spec

**Purpose.** Every theme should declare its relationship to the Mero CMS package tiers and marketplace plugins. The CMS enforces these declarations at activation time, and the theme honours them at render time to skip sections the current plan doesn't support.

This document covers the **compat manifest** — a small set of top-level keys you add to `theme.json` alongside `name`, `version`, `description`, etc.

---

## Shape

```jsonc
{
  "name":        "Your Theme",
  "slug":        "your-theme",
  "version":     "1.0.0",

  // ── Compat manifest ──────────────────────────────────────────────────
  "minPackageTier": 1,                       // 1=Basic · 2=Premium · 3=Pro/Ent · 4=Custom
  "supportedPackages": ["any"],              // or specific ids: ["personal-premium", "org-enterprise"]
  "requiredCapabilities": [],                // e.g. ["analytics", "seoFull"] — block activation if missing
  "optionalCapabilities": ["forms"],         // theme renders enhanced features when present
  "supportedPlugins": {                      // slug → support level
    "newsletter-kit":        "optional",
    "cloudflare-turnstile":  "optional",
    "stripe-checkout":       "optional"
  },
  "pluginIntegrations": {                    // which sections wire into which plugin
    "newsletter-kit":   { "sections": ["newsletter-signup"], "gate": "section" },
    "cloudflare-turnstile": { "sections": ["contact-form"], "gate": "enhance" }
  },

  // ── existing fields follow ───────────────────────────────────────────
  "requiredModules": [...],
  "defaultSettings": {...},
  "pageSchema":      [...],
  "seedData":        {...}
}
```

---

## Fields

### `minPackageTier` (number, 1-4)

Minimum package tier the theme will run on. During activation (`POST /themes/:name/activate`), the backend compares this to the active plan's tier. If the plan is lower, activation is blocked with a clear error. Defaults to `1` (Basic) when absent.

For legacy compatibility the service also accepts `minTier` with the same meaning.

### `supportedPackages` (string[])

Explicit allow-list of package ids. Use `["any"]` (or omit entirely) to accept every tier. Typical patterns:

- `["any"]` — universal theme, works on every plan
- `["personal-premium", "personal-professional", "personal-custom", "org-premium", "org-enterprise", "org-custom"]` — premium-and-above only
- `["org-enterprise", "org-custom"]` — enterprise-only (for themes that lean on `dashboardBranding` or the white-label footer)

At activation, the service verifies `supportedPackages.includes('any') || supportedPackages.includes(activePackageId)`. Failures raise `ForbiddenException`.

### `requiredCapabilities` (string[])

Capabilities the theme **must** have to function. Activation is blocked if any are missing. Use sparingly — only when a missing capability would produce a broken page (not just a degraded one). Valid keys match `backend/src/config/packages.ts` `PackageCapabilities`:

```
pluginMarketplace, themeCodeEdit, visualThemeEditor, dashboardBranding,
webhooks, collections, forms, analytics, auditLog, siteEditor, seoFull
```

### `optionalCapabilities` (string[])

Capabilities the theme can **take advantage of** but doesn't require. No activation enforcement — this is a hint for `/public/capabilities` consumers and for the admin Activate modal to show a "works better on …" note.

### `supportedPlugins` (Record<slug, 'required'|'optional'|'unsupported'>)

How the theme relates to marketplace plugins from the catalog at `backend/src/plugins/catalog.ts`:

- `"required"` — plugin must be installed or the theme won't activate
- `"optional"` — theme integrates with it when present, works fine without
- `"unsupported"` — theme explicitly does NOT integrate with it (useful for avoiding conflicts)

### `pluginIntegrations` (Record<slug, { sections: string[], gate: 'section' | 'enhance' }>)

Which theme sections depend on / enhance with which plugin:

- `gate: "section"` — the whole section only renders when the plugin is installed. Use for sections that are pure plugin surface (e.g. a Stripe pricing block).
- `gate: "enhance"` — the section always renders, but if the plugin is installed it emits an enhanced behaviour (e.g. form submissions pass through Cloudflare Turnstile when present).

`SectionRenderer` + `lib/capabilities.ts` honour these automatically — themes don't need to add per-section plugin-check logic.

---

## Runtime — `lib/capabilities.ts`

Every theme has a small helper at `src/lib/capabilities.ts`. At render time (RSC), call `getCapabilities()` once and pass the result to any component that needs to branch on it:

```tsx
import { getCapabilities, hasCapability, hasPlugin, shouldRenderSection } from '@/lib/capabilities';

export default async function Page() {
  const caps = await getCapabilities();
  if (!hasCapability(caps, 'forms')) return <UpsellForForms />;
  if (hasPlugin(caps, 'newsletter-kit')) return <NewsletterForm enhanced />;
  return <NewsletterForm />;
}
```

`shouldRenderSection(caps, sectionId)` returns `false` when a `pluginIntegrations` entry with `gate: "section"` requires a plugin that isn't installed. `SectionRenderer` calls it automatically.

---

## Backend — `/public/capabilities`

Themes read compat state from a public (no-auth) endpoint:

```
GET /public/capabilities

→ {
    package: { id, name, tier, websiteType, supportLevel } | null,
    capabilities: { siteEditor, seoFull, analytics, ... },
    limits:       { storageGB, teamMembers, hasWhiteLabel, hasApiAccess, aiEnabled, themeCount },
    supportLevel: 'email' | 'priority' | 'dedicated',
    installedPlugins: string[],
    themeCompat: {
      minPackageTier,
      isCompatible,
      requiredCapabilities: string[],
      missingRequired: string[],
      pluginIntegrations: Record<slug, { sections, gate }>,
      supportedPlugins:    Record<slug, 'required'|'optional'|'unsupported'>
    }
  }
```

Cacheable (themes default to `revalidate: 60`).

---

## Current themes at a glance

The CMS ships without bundled themes. Customers install `mero-starter-theme`
as a baseline placeholder, or upload / purchase their own starting from the
manifest spec above.

---

## Authoring checklist for a new theme

1. Pick the lowest `minPackageTier` the theme genuinely supports.
2. If the theme relies on a specific capability to function (e.g. `webhooks` for a real-time sold-out banner), add it to `requiredCapabilities` so Basic-tier users can't activate.
3. Add every marketplace plugin you've tested against to `supportedPlugins`.
4. For each plugin-aware section, add an entry to `pluginIntegrations` with the section ids and the right `gate` mode.
5. In your SectionRenderer, call `getCapabilities()` once and pass the result through the normal `shouldRenderSection` + `hasCapability` helpers.
6. Add a row to the "Current themes at a glance" table above so the doc stays in sync.
