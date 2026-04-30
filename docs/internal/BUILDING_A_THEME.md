# Building a Theme — Internal Developer Guide

For Blendwit / Mero engineers building a new theme from scratch. If you're an external partner agency, read [PARTNER_AGENCY_GUIDE.md](../PARTNER_AGENCY_GUIDE.md) instead — this doc assumes you have repo access and will run the code locally.

---

## 1. The mental model

A **theme** in Mero is a Next.js workspace package living at `themes/<slug>/`. It renders the public-facing site for a customer's CMS install. Two flavours:

- **Single-design theme** — one visual look, one `pageSchema`, one `seedData`. `themes/mero-hello/` is the canonical example (when it exists; we deleted the others to focus on bundles).
- **Bundle theme** — multiple designs sharing one manifest. Each design has its own `pageSchema` + `seedData` + components but inherits bundle-level fields (`brandingFields`, `moduleSchemas`, `supportedPackages`). `themes/mero-pro/` is the canonical example, with three designs (`marketing`, `blendwit-tech`, `vivid`).

Build single-design themes when one customer needs one look. Build bundle themes when you want to ship multiple aesthetics behind one license — Custom-tier customers can flip designs without re-installing.

## 2. Repo layout (what's where)

```
themes/<slug>/
├─ theme.json                   # Manifest: pages, schemas, branding, bundles
├─ package.json                 # Workspace package; depends on next/react
├─ next.config.ts
├─ tsconfig.json                # `@/*` aliases to `./src/*`
├─ public/                      # Static assets (logos, hero illustrations)
└─ src/
   ├─ app/                      # Next.js App Router
   │  ├─ layout.tsx             # Wraps every page; mounts EditorBridge,
   │  │                         # sets <body data-design> for bundles
   │  └─ page.tsx               # Home; calls renderWidgetsForDesign()
   ├─ components/               # Theme-wide primitives + sections
   │  ├─ Navigation.tsx
   │  ├─ Footer.tsx
   │  ├─ EditorBridge.tsx       # Re-export from @mero/theme-editor-bridge
   │  └─ sections/              # Single-design themes put sections here
   │     ├─ Hero.tsx
   │     └─ ...
   ├─ designs/                  # Bundle themes only; one folder per design
   │  ├─ blendwit-tech/
   │  │  ├─ styles.css          # Scoped under [data-design="blendwit-tech"]
   │  │  ├─ widget-registry.tsx # Type → component map for this design
   │  │  └─ components/sections/
   │  │     ├─ Hero.tsx
   │  │     └─ ...
   │  └─ vivid/
   │     └─ ...
   └─ lib/
      ├─ api.ts                 # Backend client (apiFetch wrappers)
      ├─ widget-registry.tsx    # Default registry (used when activeDesign
      │                         # is 'marketing' or undefined)
      ├─ widget-registry.gen.tsx# Auto-generated mirror; do not edit
      └─ design-renderer.tsx    # Bundle dispatcher; picks registry
```

## 3. Single-design theme — start to running site

### 3.1 Scaffold

There's no scaffolder CLI yet (TODO). The fastest path is fork an existing theme:

```powershell
cd D:\Blendwit\Blendwit Product\Mero CMS\mero_cms\themes
robocopy mero-pro mero-clientname /E /XD node_modules .next
```

Then update three identity fields:

```jsonc
// themes/mero-clientname/package.json
{ "name": "mero-clientname" }

// themes/mero-clientname/theme.json
{ "name": "Client Name", "slug": "mero-clientname", "version": "0.1.0" }
```

Add it to the root workspaces:

```jsonc
// package.json (root)
{ "workspaces": ["backend", "frontend", "themes/mero-pro", "themes/mero-clientname"] }
```

`npm install` from the repo root to wire the symlinks.

### 3.2 Strip what you don't need

Forking from `mero-pro` gives you the bundle scaffolding. For a single-design theme, delete `theme.json`'s `bundle` block, delete `src/designs/`, delete the design imports from `app/layout.tsx`, and delete `src/lib/design-renderer.tsx`. The home page now just calls `renderWidgets(enriched)` like a normal theme.

### 3.3 Theme the brand

Edit `src/app/globals.css` for the CSS variables — `--brand`, `--ink-1` through `--ink-4`, `--bg`, `--paper`, `--line`. Drop the customer's logo into `public/`. The `brandingFields` block in `theme.json` declares which CSS variables the customer can override from the admin's Branding tab — keep it in sync with what your CSS actually uses.

### 3.4 Customise sections

Edit components in `src/components/sections/`. Most clients want maybe 2–3 sections heavily customised (Hero, FeatureBlocks, FinalCTA) and the rest left as defaults. The shipped components honour `data-editable="<fieldKey>"` markers — keep those when you customise so the visual editor's live edits keep working.

### 3.5 Wire the manifest

`theme.json` declares:

- `pageSchema` — every page slug + its sections.
- `widgetCatalog` — which widget types this theme supports in the visual editor (set `premium: true` on Pro widgets).
- `seedData.pages` — the initial content shown when the theme is first activated.
- `brandingFields` — which CSS variables the customer can override.

Run the validator after each edit:

```powershell
npm run theme:validate -- mero-clientname
```

After editing the widget catalog, regenerate the registry:

```powershell
npm run theme:build-registry -- mero-clientname
```

That writes `src/lib/widget-registry.gen.tsx` — the file the renderer uses to dispatch widget types to components.

### 3.6 Run it

```powershell
npm run dev:all
```

Boots backend (port 4000), admin (port 3000), and the theme dev server (port 3002). Navigate to `localhost:3002` to see the public site, `localhost:3000/dashboard/themes` to activate it, and `localhost:3000/dashboard/themes/visual-editor` to open the visual editor.

## 4. Bundle theme — when one theme ships multiple designs

### 4.1 The bundle shape

```jsonc
// theme.json
{
  "name": "Mero Pro",
  "slug": "mero-pro",
  "version": "1.0.0",
  "minPackageTier": 4,
  "supportedPackages": ["personal-custom", "org-custom"],

  "bundle": {
    "activeDesign": "marketing",
    "designs": [
      {
        "key": "marketing",
        "name": "Mero Marketing (classic)",
        "bundleAccess": ["custom"],
        "componentRoot": "src/designs/marketing/components"
        // No `pages` here = inherit the bundle-level pageSchema below
      },
      {
        "key": "blendwit-tech",
        "name": "Blendwit Tech",
        "bundleAccess": ["custom"],
        "componentRoot": "src/designs/blendwit-tech/components",
        "pages": [/* design-specific pageSchema */],
        "seedData": { "pages": [/* design-specific seed */] }
      },
      // ... more designs
    ]
  },

  // Bundle-level (shared across designs):
  "moduleSchemas": { /* Hero/FeatureBlocks/etc field shapes */ },
  "brandingFields": [ /* CSS variable overrides */ ],
  "pageSchema": [/* fallback for designs without their own pages */],
  "seedData":   {/* fallback */}
}
```

### 4.2 `bundleAccess` semantics

Minimum-floor. `["professional"]` admits Professional **and above** (Pro / Enterprise / Custom). Mappings:

| Name | Tier number |
| --- | --- |
| `basic` | 1 |
| `premium` | 2 |
| `professional` / `enterprise` | 3 (same access — different package-side names) |
| `custom` | 4 |
| `any` | always |

### 4.3 Build a design

For each design key:

```
src/designs/<key>/
├─ styles.css                    # Scoped under [data-design="<key>"]
├─ widget-registry.tsx           # type → component map
└─ components/sections/
   ├─ Hero.tsx
   ├─ FeatureBlocks.tsx
   └─ ...
```

The CSS **must** be scoped:

```css
[data-design="blendwit-tech"] {
    --bw-navy: #043873;
    /* ... */
}
[data-design="blendwit-tech"] .bw-btn { /* ... */ }
```

The widget-registry exports a `REGISTRY` constant the dispatcher imports:

```tsx
// src/designs/blendwit-tech/widget-registry.tsx
import type { ComponentType } from 'react';
import Hero from './components/sections/Hero';
import FeatureBlocks from './components/sections/FeatureBlocks';

export const REGISTRY: Record<string, { component: ComponentType<{ data?: any }> }> = {
    Hero:          { component: Hero },
    FeatureBlocks: { component: FeatureBlocks },
    // ...
};
```

Add the design's stylesheet to `app/layout.tsx` so it loads regardless of which design is active (it's scoped, so it doesn't bleed):

```tsx
import '@/designs/blendwit-tech/styles.css';
import '@/designs/vivid/styles.css';
```

Add the registry to `lib/design-renderer.tsx`:

```tsx
import { REGISTRY as BLENDWIT } from '@/designs/blendwit-tech/widget-registry';
const DESIGN_REGISTRIES = {
    'blendwit-tech': BLENDWIT,
    // ...
};
```

### 4.4 Layout sets `data-design`, home page dispatches

```tsx
// src/app/layout.tsx
const themeConfig = await getActiveThemeConfig();
const activeDesign = themeConfig?.activeDesign || 'marketing';

return (
    <html ...>
        <body data-design={activeDesign}>
            {children}
        </body>
    </html>
);

// src/app/page.tsx
const themeConfig = await getActiveThemeConfig();
const activeDesign = themeConfig?.activeDesign || 'marketing';
return <main>{renderWidgetsForDesign(activeDesign, widgets)}</main>;
```

The backend resolves the active design from a setting (written by the admin's design picker) and merges its `pages`/`widgetCatalog` onto the response, so existing endpoints keep working.

## 5. Visual editor wiring

Mount the bridge at the root of your layout:

```tsx
import { EditorBridge } from '@mero/theme-base';

<body>
    {children}
    <EditorBridge />
</body>
```

Mark editable surfaces in every section:

```tsx
<section data-section-id="hero" data-section-type="Hero">
    <h1 data-editable="title">{data.title}</h1>
    <p  data-editable="subtitle">{data.subtitle}</p>
</section>
```

That's the whole contract. The bridge handles hover outlines, click-to-select, live in-iframe edits, navigation sync, and reload-on-save.

## 6. Common pitfalls

- **Forgot to scope CSS.** Every selector in a design's `styles.css` MUST start with `[data-design="<key>"]`. Otherwise it leaks across designs and the marketing design picks up Whitepace navy.
- **Skipped `npm run theme:build-registry`.** Edited `widgetCatalog` but didn't regenerate. The home page renders fine but new widgets the editor offers fail to mount because no registry entry maps them.
- **Hardcoded `data-section-id`.** Don't write `data-section-id="hero"` on a section component. The bundle dispatcher wraps each rendered widget in `<div data-section-id={instanceId}>` so the bridge can target each instance uniquely. Hardcoded ids cause duplicate-instance bugs (#106).
- **Used `<img>` with explicit `width`/`height` and no `max-width: 100%`.** That's a horizontal-scroll regression at narrow widths. The defensive guard in `globals.css` covers it (`img, video, svg, picture { max-width: 100% }`) but only for theme-scoped CSS.
- **Edited `widget-registry.gen.tsx` by hand.** That file is regenerated. Edit the source `widget-registry.tsx` (which is a tiny re-export from `.gen.tsx`) or `theme.json` and rerun the CLI.

## 7. Where to go next

- [BUILDING_A_PLUGIN.md](BUILDING_A_PLUGIN.md) — building a marketplace plugin from scratch.
- [CONNECTING_PLUGINS.md](CONNECTING_PLUGINS.md) — surfacing plugin features in your theme.
- [../THEME_CONTRACT.md](../THEME_CONTRACT.md) — formal manifest spec.
