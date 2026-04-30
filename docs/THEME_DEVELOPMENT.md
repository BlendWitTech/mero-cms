# Mero CMS — Theme Development Guide

This is the canonical reference for building production-ready themes for Mero CMS. It covers every file, every config field, every API endpoint, and every integration point a theme touches.

**Audience.** Web developers contracted by Custom-tier customers (or by Blendwit) to build a bespoke Mero theme. Familiarity with React, Next.js App Router, and TypeScript is assumed. You don't need to know NestJS or Prisma — the backend is a black box from a theme's perspective.

**Outcome.** A folder under `themes/<your-theme-slug>/` that the Mero admin discovers, lets the customer activate, and serves on port 3002. The theme renders content from the CMS, respects the customer's branding settings, supports the visual editor, and degrades gracefully when modules are disabled.

If you're a customer reading this and wondering whether to build vs. buy a theme, talk to Blendwit — Custom-tier includes a tailored theme commission.

---

## 1. Overview

A Mero theme is a standalone Next.js 15 application that lives inside a Mero CMS install at `themes/<slug>/`. The CMS dashboard at port 3000 manages content; the theme at port 3002 renders it. They communicate via the public REST API exposed by the backend at port 3001.

```
+----------------+        +----------------+        +----------------+
|   Admin (UI)   |  ←——→  |  Backend API   |  ←——→  |  Theme (SSR)   |
|   :3000        |        |  :3001         |        |  :3002         |
+----------------+        +----------------+        +----------------+
       ↑                          ↑                         ↑
   editor / settings         postgres + secrets        visitor browser
```

Every theme:

1. Declares itself in `theme.json` (manifest the admin reads).
2. Fetches CMS data at request time via `/public/*` endpoints.
3. Reads branding settings into CSS custom properties.
4. Optionally supports the visual editor via the `EditorBridge` component.
5. Optionally declares plugin compatibility so the marketplace knows which plugins work with it.

Themes are not packaged as plugins. The Mero CMS ships with at least one starter theme, and customers can have multiple themes installed and switch between them in the admin.

---

## 2. Quick start

The fastest path to a working theme is to copy `mero-pro` (the reference implementation):

```bash
cd mero_cms/themes
cp -r mero-pro my-theme
cd my-theme
# Update theme.json: set slug, name, description, author
# Update package.json: set name to "my-theme"
npm install
npm run dev
```

Open `http://localhost:3002` to see the theme rendering against the running backend on `:3001`.

You'll customize three things from this base:

- **`theme.json`** — change the manifest fields (covered in [section 4](#4-themejson-reference)).
- **`src/app/`** — replace the page routes with your own.
- **`src/components/sections/`** — build your own section components.

The shared infrastructure (`src/lib/api.ts`, `src/components/EditorBridge.tsx`, `src/components/CapabilitiesProvider.tsx`) stays as-is; it's the contract between every theme and the CMS.

---

## 3. Project structure

```
themes/my-theme/
├── theme.json                 ← manifest read by the admin
├── preview.svg                ← gallery preview (SVG, PNG, or JPG)
├── package.json               ← Next.js + React deps
├── next.config.ts             ← API rewrites + image config
├── tsconfig.json
├── public/                    ← static assets (logos, fonts)
└── src/
    ├── app/                   ← Next.js App Router pages
    │   ├── layout.tsx         ← root layout (reads CMS settings)
    │   ├── globals.css        ← design tokens (CSS variables)
    │   ├── page.tsx           ← home page
    │   ├── about/page.tsx
    │   ├── pricing/page.tsx
    │   ├── blog/page.tsx
    │   ├── blog/[slug]/page.tsx
    │   ├── contact/page.tsx
    │   ├── login/page.tsx
    │   ├── signup/page.tsx
    │   ├── sitemap.ts
    │   ├── robots.ts
    │   └── not-found.tsx
    ├── components/
    │   ├── Navigation.tsx
    │   ├── Footer.tsx
    │   ├── EditorBridge.tsx       ← visual editor support (copy as-is)
    │   ├── CapabilitiesProvider.tsx ← capability context (copy as-is)
    │   └── sections/              ← reusable page sections
    │       ├── Hero.tsx
    │       ├── FeatureBlocks.tsx
    │       └── ... etc
    ├── lib/
    │   └── api.ts                 ← CMS client (copy from mero-pro)
    └── docs/                      ← optional: theme-specific README
        ├── INTEGRATION_NOTES.md
        └── THEME_INTEGRATION.md
```

The reference theme at `themes/mero-pro` is your canonical example. Read it alongside this guide.

**Required files.** `theme.json`, `package.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/lib/api.ts`. Everything else is optional but conventional.

**Recommended:** include a `preview.svg` (preferred) or `preview.png` at the theme root. The admin reads it for the gallery card. If absent, the theme still appears but with a placeholder.

---

## 4. theme.json reference

The manifest is the single contract between your theme and the CMS. Every field below is documented. `mero-pro/theme.json` is a complete working example.

### 4.1 Identity fields

```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "version": "1.0.0",
  "description": "What the theme is for, in one sentence.",
  "author": "Studio Name",
  "minPackageTier": 1,
  "supportedPackages": ["any"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Display name in the gallery. |
| `slug` | string | yes | Match the directory name. Lowercase, hyphenated. |
| `version` | string | yes | Semver. Bump on every release. |
| `description` | string | yes | One-sentence pitch shown on gallery card. |
| `author` | string | yes | Studio or developer name. |
| `minPackageTier` | 1\|2\|3\|4 | yes | Lowest tier this theme is allowed on. 1=Basic, 2=Premium, 3=Pro/Enterprise, 4=Custom. |
| `supportedPackages` | `["any"]` or `[packageId, …]` | yes | `"any"` = available to all packages within `minPackageTier`. Otherwise an explicit allowlist of package ids (`personal-premium`, `org-enterprise`, etc.). |
| `websiteType` | `"personal"` \| `"organizational"` | no | Restricts the gallery to one website type. **Omit to allow both.** |

**Common mistake:** setting `websiteType: "personal"` when the theme is meant to be universal causes the admin gallery to filter it out for organizational customers. Omit unless the theme genuinely targets one segment.

### 4.2 Module declarations

```json
{
  "modules": [
    "pages", "blogs", "menus", "testimonials", "team",
    "services", "forms", "leads", "categories", "tags",
    "comments", "seo-meta", "redirects", "collections"
  ],
  "moduleAliases": {
    "team": "Our team",
    "testimonials": "Customer voices",
    "services": "Capabilities",
    "leads": "Lead inbox"
  },
  "requiredCapabilities": [],
  "optionalCapabilities": ["seoFull", "analytics", "aiContent", "webhooks", "apiAccess"]
}
```

`modules` lists every CMS module the theme touches. The admin auto-enables these on theme activation. The customer can later disable any in Settings → Modules; your theme should degrade gracefully (more on this in [section 9](#9-graceful-degradation)).

`moduleAliases` lets you rename modules in the admin sidebar to match your theme's vocabulary. Example: a portfolio theme might alias `services` to `"Skills"` or `team` to `"Collaborators"`.

`requiredCapabilities` — features the theme cannot run without. Listed here, the admin refuses to activate the theme if the customer's tier doesn't have these. Use sparingly.

`optionalCapabilities` — features the theme conditionally renders if available. This is the common case — theme renders an analytics widget when `capabilities.analytics === true`, hides it otherwise.

### 4.3 Branding contract — `brandingFields`

This is the most important block in the manifest. It tells the admin which CSS variables your theme respects, so the branding settings page renders the right controls.

```json
{
  "brandingFields": [
    {
      "group": "Identity",
      "fields": [
        { "key": "site_title",      "label": "Site Title",     "type": "string",  "fallback": "My Site" },
        { "key": "site_tagline",    "label": "Tagline",        "type": "string",  "fallback": "..." },
        { "key": "logo_url",        "label": "Logo",           "type": "media",   "fallback": null },
        { "key": "favicon_url",     "label": "Favicon",        "type": "media",   "fallback": null },
        { "key": "meta_description","label": "Meta description","type": "text",   "fallback": null }
      ]
    },
    {
      "group": "Colors",
      "fields": [
        { "key": "primary_color",  "label": "Primary",   "type": "color", "fallback": "#cb172b", "cssVar": "--brand" },
        { "key": "secondary_color","label": "Secondary", "type": "color", "fallback": "#023d91", "cssVar": "--navy" },
        { "key": "accent_color",   "label": "Background","type": "color", "fallback": "#fbfaf6", "cssVar": "--paper" },
        { "key": "text_color",     "label": "Body text", "type": "color", "fallback": "#0d0e14", "cssVar": "--ink" }
      ]
    },
    {
      "group": "Typography",
      "fields": [
        { "key": "heading_font",   "label": "Heading font", "type": "font",   "fallback": "Inter",
          "cssVar": "--font-display", "options": ["Inter", "Manrope", "DM Sans", "Outfit"] },
        { "key": "body_font",      "label": "Body font",    "type": "font",   "fallback": "Inter",
          "cssVar": "--font-body",    "options": ["Inter", "Manrope", "DM Sans"] },
        { "key": "base_font_size", "label": "Base size",    "type": "size",
          "fallback": "16px", "cssVar": "--base-fs", "options": ["14px","15px","16px","17px","18px"] },
        { "key": "heading_weight", "label": "Heading weight","type": "weight",
          "fallback": "800", "cssVar": "--hw", "options": ["500","600","700","800","900"] },
        { "key": "body_weight",    "label": "Body weight",   "type": "weight",
          "fallback": "400", "cssVar": "--bw", "options": ["300","400","500","600"] }
      ]
    },
    {
      "group": "Layout",
      "fields": [
        { "key": "border_radius",  "label": "Border radius","type": "size",
          "fallback": "16px", "cssVar": "--r-md", "options": ["0px","8px","12px","16px","20px","28px"] },
        { "key": "layout_density", "label": "Layout density","type": "select",
          "fallback": "comfortable", "cssVar": "--density", "options": ["compact","comfortable","spacious"] }
      ]
    }
  ]
}
```

**Field types:**

| Type | Renders as | Saves as |
|---|---|---|
| `string` | text input | string |
| `text` | textarea | string |
| `color` | color picker + hex input | hex string `#rrggbb` |
| `media` | media-picker button | URL string |
| `font` | dropdown + live-preview in font | font family name |
| `size` | dropdown of sizes | string with unit (`16px`, `1rem`) |
| `weight` | dropdown of weights | numeric string (`400`, `700`) |
| `select` | generic dropdown | one of the `options` |

**`cssVar`** is the CSS custom property your theme reads. The CMS injects these automatically into a `<style>` tag the theme renders in `app/layout.tsx` (see [section 6](#6-css-architecture--branding-injection)).

**`fallback`** is the value used when the customer hasn't set the field yet. It should match the value in your `:root {}` block in `globals.css`.

**`options`** is required for `font`, `size`, `weight`, `select` types. Be opinionated — don't list 50 fonts.

The admin reads this contract and renders only the fields you declare. If your theme doesn't support layout density, omit it; the customer won't see a control that has no effect.

### 4.4 Page schema

`pageSchema` declares which page slugs your theme has, and which sections each page renders. The admin uses this to build a per-page editor.

```json
{
  "pageSchema": [
    {
      "slug": "home",
      "name": "Home",
      "label": "Home page",
      "description": "Marketing landing page composed of nine sections.",
      "sections": [
        { "id": "hero",         "type": "Hero",          "label": "Hero" },
        { "id": "logos",        "type": "LogoStrip",     "label": "Trust strip" },
        { "id": "features",     "type": "FeatureBlocks", "label": "Feature blocks" },
        { "id": "testimonials", "type": "Testimonials",  "label": "Testimonials" },
        { "id": "faq",          "type": "FAQ",           "label": "FAQ" },
        { "id": "cta",          "type": "FinalCTA",      "label": "Final CTA" }
      ]
    },
    {
      "slug": "pricing",
      "name": "Pricing",
      "sections": [
        { "id": "pricing", "type": "PricingTeaser", "label": "Pricing matrix" },
        { "id": "faq",     "type": "FAQ",           "label": "Pricing FAQ" }
      ]
    }
  ]
}
```

`type` references a section in your `moduleSchemas` block (next section). `id` is the per-page instance — the same section type can appear twice on the same page (rare, but supported) with different ids.

### 4.5 Module schemas

`moduleSchemas` defines the editable fields each section type exposes to the admin. This is what the admin's "edit section" form renders.

```json
{
  "moduleSchemas": {
    "Hero": [
      { "key": "title",        "type": "string", "label": "Headline", "required": true },
      { "key": "subtitle",     "type": "text",   "label": "Subhead" },
      { "key": "primaryCta",   "type": "string", "label": "Primary CTA label" },
      { "key": "primaryHref",  "type": "string", "label": "Primary CTA URL" },
      { "key": "secondaryCta", "type": "string", "label": "Secondary CTA label" },
      { "key": "secondaryHref","type": "string", "label": "Secondary CTA URL" },
      { "key": "trustText",    "type": "string", "label": "Trust line" }
    ],
    "FeatureBlocks": [
      { "key": "title",    "type": "string", "label": "Section title" },
      { "key": "subtitle", "type": "text",   "label": "Section subtitle" },
      { "key": "blocks",   "type": "json",   "label": "Feature blocks" }
    ],
    "Testimonials": [
      { "key": "eyebrow",      "type": "string", "label": "Eyebrow" },
      { "key": "title",        "type": "string", "label": "Title" },
      { "key": "subtitle",     "type": "text",   "label": "Subtitle" },
      { "key": "testimonials", "type": "json",   "label": "Cards" }
    ]
  }
}
```

**Field types** are the same as `brandingFields` plus `json` for arbitrary JSON (used for arrays of blocks, repeating items, etc.).

### 4.6 Designs and section variants

```json
{
  "designs": [
    {
      "key": "default",
      "label": "Default — Editorial",
      "description": "Pastel mesh-gradient hero, warm body content, minimal animations.",
      "sectionVariants": {
        "Hero": ["editorial", "minimal", "split"],
        "FeatureBlocks": ["alternating", "grid", "carousel"]
      }
    }
  ],
  "defaultDesignKey": "default"
}
```

`designs` are visual variants of the entire theme — different overall styles. Each design declares per-section variants the editor can switch between.

If you don't support multiple designs, declare a single `default` entry with empty `sectionVariants`. This is required for the visual-editor plugin (section 12).

### 4.7 Default settings and seed data

```json
{
  "defaultSettings": {
    "site_title": "My Site",
    "site_tagline": "Where motion meets meaning",
    "primary_color": "#cb172b",
    "heading_font": "Inter",
    "...": "..."
  },
  "requiredCollections": [],
  "seedData": {
    "menus": [
      {
        "slug": "main-nav",
        "name": "Main navigation",
        "items": [
          { "label": "Pricing", "url": "/pricing", "order": 1 },
          { "label": "Blog",    "url": "/blog",    "order": 2 }
        ]
      }
    ]
  }
}
```

`defaultSettings` populates the `Setting` table on first activation. Every key in your `brandingFields` should have a matching default here.

`requiredCollections` lists custom-content-type collections the theme needs (e.g. a portfolio theme might require a `projects` collection). The admin creates these on activation if missing.

`seedData` is one-time content seeded on first activation. Menus, sample pages, sample blog posts. Not re-applied if the customer has already edited content (LEGACY mode). Re-applied on `clearPrevious` reset (FRESH mode).

---

## 5. API integration — talking to the CMS

Your theme talks to the backend via the public REST API at `:3001`. Every endpoint we use is below. None of this requires authentication; the public API is read-only and rate-limited.

### 5.1 The api.ts pattern

Copy `themes/mero-pro/src/lib/api.ts` and adapt. The key piece is `apiFetch`:

```ts
async function apiFetch<T>(path: string, fallback: T, options: FetchOptions = {}): Promise<T> {
    const { tag = 'mero-cms', revalidate = 120, timeoutMs = 3000, ...init } = options;
    try {
        const res = await fetch(`${resolveApiBase()}${path}`, {
            signal: init.signal || AbortSignal.timeout(timeoutMs),
            headers: { Accept: 'application/json' },
            next: { revalidate, tags: [tag] },
        });
        if (!res.ok) return fallback;
        return await res.json() as T;
    } catch {
        return fallback; // network error / timeout / backend offline
    }
}
```

**Why a fallback instead of a thrown error.** Themes render server-side. If the backend is offline (during `npm run dev:all` boot, during a backend deploy, etc.), the theme should still render with sensible defaults. `apiFetch` returns the fallback you pass in; sections then fall through to component-local DEFAULTS.

**`resolveApiBase()`** detects whether we're running server-side (Node) or client-side (browser):

```ts
function resolveApiBase(): string {
    if (typeof window === 'undefined') {
        // Server-side: Node fetch needs an absolute URL.
        return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    }
    // Browser: relative path; the next.config.ts rewrite forwards /api/* to backend.
    return process.env.NEXT_PUBLIC_API_URL || '/api';
}
```

### 5.2 Public endpoints reference

| Endpoint | Returns | Used for |
|---|---|---|
| `GET /public/site-data` | site settings, menus, testimonials, recent posts | global theme data; call once per request in `layout.tsx` |
| `GET /public/pages/:slug` | page record with `data.sections[]` | per-page section content |
| `GET /public/posts?page=N&limit=M` | paginated blog posts | blog index |
| `GET /public/posts/:slug` | single post | blog post page |
| `GET /public/collections/:slug` | collection metadata + first 50 items | listing collection items |
| `GET /public/collections/:slug/items?page=N&limit=M` | paginated collection items | infinite scroll / paged lists |
| `GET /public/capabilities` | tier capabilities map | conditional rendering |
| `GET /public/packages-config?type=personal` | raw packages from config | pricing page |
| `GET /public/cloud-tiers` | Mero Cloud tier list | pricing page (if showing cloud) |
| `GET /menus/slug/:slug` | menu with nested children | nav, footer |
| `GET /seo-meta/:pageType/:pageId` | SEO override for a specific page | per-page SEO meta |
| `GET /redirects/check/:path` | redirect rule lookup | edge middleware |
| `GET /categories` | blog categories | blog filtering |
| `POST /public/leads` | submit contact lead | contact form |
| `POST /public/forms/:id/submit` | submit a form-builder form | custom forms |
| `POST /auth/register` | create workspace | demo signup |
| `POST /auth/login` | authenticate, returns JWTs | login |

All POSTs are rate-limited to ~10 requests/min per IP. Don't make these from the server side; submit from the browser.

### 5.3 Common patterns

**Home page (server component):**

```tsx
import { getSiteData, getPage, pickSection } from '@/lib/api';
import Hero, { type HeroData } from '@/components/sections/Hero';

export const revalidate = 120;

export default async function HomePage() {
    const [siteData, page] = await Promise.all([getSiteData(), getPage('home')]);

    return (
        <main>
            <Hero
                data={{
                    ...pickSection<HeroData>(page, 'hero'),
                    title: siteData?.settings?.heroTitle || undefined,
                    subtitle: siteData?.settings?.heroSubtitle || undefined,
                }}
            />
            {/* … other sections */}
        </main>
    );
}
```

**Section component with defaults:**

```tsx
export interface HeroData {
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
}

const DEFAULTS: HeroData = {
    title: 'Welcome to my site',
    subtitle: 'Build great things, fast.',
    primaryCta: 'Get started',
    primaryHref: '/signup',
};

export default function Hero({ data = {} }: { data?: HeroData }) {
    const c = { ...DEFAULTS, ...data };
    return (
        <section data-section-id="hero" data-section-type="Hero">
            <h1 data-editable="title">{c.title}</h1>
            <p data-editable="subtitle">{c.subtitle}</p>
            {c.primaryCta && (
                <a href={c.primaryHref} className="btn btn-brand">{c.primaryCta}</a>
            )}
        </section>
    );
}
```

`data-section-id` and `data-editable` attributes are picked up by `EditorBridge` for inline editing — see [section 7](#7-visual-editor-support).

---

## 6. CSS architecture & branding injection

The CMS injects the customer's branding settings as CSS variables at runtime. Your theme reads those variables, falling back to the values you declare in `:root {}` when nothing is set.

### 6.1 Token declaration

Declare every variable your theme respects in `globals.css`:

```css
:root {
    /* Color tokens (overridden by CMS branding) */
    --brand:        #cb172b;
    --navy:         #023d91;
    --paper:        #fbfaf6;
    --ink:          #0d0e14;
    --ink-2:        #2a2c35;
    --ink-3:        #5b5e6b;
    --link:         #023d91;

    /* Typography */
    --font-body:    'Inter', system-ui, sans-serif;
    --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
    --base-fs:      16px;
    --hw:           800;     /* heading weight */
    --bw:           400;     /* body weight */

    /* Layout */
    --r-md:         20px;
    --density:      1;
}

html { font-size: var(--base-fs); }
body { font-family: var(--font-body); font-weight: var(--bw); color: var(--ink); }

.display { font-family: var(--font-display); font-weight: var(--hw); }
.btn-brand { background: var(--brand); }
```

Every value you put in `globals.css` is a *fallback*. The CMS overrides them at runtime.

### 6.2 Runtime injection in layout.tsx

In `src/app/layout.tsx`, fetch site data and emit a `<style>` tag with overrides:

```tsx
import { getSiteData, type SiteDataSettings } from '@/lib/api';
import './globals.css';

function buildBrandingCss(s: SiteDataSettings | null | undefined): string {
    if (!s) return '';
    const v: string[] = [];
    if (s.primaryColor)    v.push(`--brand: ${s.primaryColor};`);
    if (s.secondaryColor)  v.push(`--navy: ${s.secondaryColor};`);
    if (s.accentColor)     v.push(`--paper: ${s.accentColor};`);
    if (s.textColor)       v.push(`--ink: ${s.textColor};`);
    if (s.headingFont)     v.push(`--font-display: '${s.headingFont}', system-ui;`);
    if (s.bodyFont)        v.push(`--font-body: '${s.bodyFont}', system-ui;`);
    if (s.baseFontSize)    v.push(`--base-fs: ${s.baseFontSize};`);
    if (s.headingWeight)   v.push(`--hw: ${s.headingWeight};`);
    if (s.bodyWeight)      v.push(`--bw: ${s.bodyWeight};`);
    if (s.borderRadius)    v.push(`--r-md: ${s.borderRadius};`);
    if (s.layoutDensity) {
        const map: Record<string, string> = { compact: '0.85', comfortable: '1', spacious: '1.2' };
        v.push(`--density: ${map[s.layoutDensity] ?? s.layoutDensity};`);
    }
    return v.length ? `:root{${v.join('')}}` : '';
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const siteData = await getSiteData();
    const brandingCss = buildBrandingCss(siteData?.settings);

    return (
        <html lang="en">
            <body>
                {brandingCss && (
                    <style id="mero-branding" dangerouslySetInnerHTML={{ __html: brandingCss }} />
                )}
                {children}
            </body>
        </html>
    );
}
```

**Don't** put the `<style>` inside `<head>` directly — it causes hydration warnings in Next.js App Router. Next hoists `<style>` tags from `<body>` to head automatically.

**`generateMetadata()`** in the same layout reads `siteData.settings.siteTitle`, `metaDescription`, `faviconUrl`:

```tsx
export async function generateMetadata(): Promise<Metadata> {
    const s = (await getSiteData())?.settings;
    return {
        title: { default: s?.siteTitle || 'My Site', template: `%s · ${s?.siteTitle || 'My Site'}` },
        description: s?.metaDescription || s?.tagline || '',
        icons: { icon: s?.faviconUrl || '/favicon.svg' },
    };
}
```

### 6.3 CSS chrome rules

UI chrome elements (nav, buttons, brand wordmark) should not show the text I-beam cursor or be selectable like body text. Add this to `globals.css`:

```css
nav, header nav, .brand-mark, button, .btn, [role="tab"], [role="button"] {
    user-select: none;
    cursor: default;
}
button, .btn, [role="tab"], [role="button"], a.btn { cursor: pointer; }
```

Body text, headings, blog post content, license keys, etc. stay selectable so customers can copy from them.

---

## 7. Visual editor support

Mero ships an in-admin visual editor that loads your theme in an iframe with `?editMode=1` and lets customers click sections to edit them inline. Supporting it is two steps:

### 7.1 Add data attributes

On every section's outer element, add `data-section-id` (the id from your `pageSchema`) and `data-section-type` (the type from your `moduleSchemas`):

```tsx
<section data-section-id="hero" data-section-type="Hero">
    <h1 data-editable="title">{c.title}</h1>
    <p data-editable="subtitle">{c.subtitle}</p>
</section>
```

`data-editable` on inline text fragments enables field-level edits. The id is the field key from your `moduleSchemas[type]`.

### 7.2 Mount EditorBridge

Copy `themes/mero-pro/src/components/EditorBridge.tsx` verbatim into your theme. Mount it in `src/app/layout.tsx`:

```tsx
import EditorBridge from '@/components/EditorBridge';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body>
                <EditorBridge />
                {children}
            </body>
        </html>
    );
}
```

`EditorBridge` is a no-op when `?editMode=1` is not in the URL — there's zero performance cost on the public-facing site.

### 7.3 Section variants for the visual editor

The visual-editor plugin can swap between section variants if your theme declares them. Per-section variants live in your `theme.json`'s `designs[].sectionVariants` block (section 4.6).

Read the `_variant` override from the section's data in your section component:

```tsx
export default function Hero({ data = {} }: { data?: HeroData }) {
    const c = { ...DEFAULTS, ...data };
    const variant = (data as any)._variant || 'editorial';

    if (variant === 'minimal') return <HeroMinimal data={c} />;
    if (variant === 'split')   return <HeroSplit data={c} />;
    return <HeroEditorial data={c} />;
}
```

The visual editor writes `_variant` into the section's `data` blob when the customer picks a different variant from the editor sidebar.

---

## 8. Capability gating

The CMS exposes `/public/capabilities` so themes can render conditionally based on the customer's tier. Use the `CapabilitiesProvider` pattern.

### 8.1 Server-fetch capabilities in layout

```tsx
import { CapabilitiesProvider } from '@/components/CapabilitiesProvider';
import { getCapabilities } from '@/lib/api';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const caps = await getCapabilities();
    return (
        <html>
            <body>
                <CapabilitiesProvider capabilities={caps}>
                    {children}
                </CapabilitiesProvider>
            </body>
        </html>
    );
}
```

### 8.2 Read in client components

```tsx
'use client';
import { useCapabilities } from '@/components/CapabilitiesProvider';

export default function NewsletterSignup() {
    const { has } = useCapabilities();
    if (!has('webhooks')) return null; // gated to Premium+
    return <form>{/* ... */}</form>;
}
```

### 8.3 Available capability keys

| Key | Min tier | What it gates |
|---|---|---|
| `forms` | Basic | Single contact form |
| `pluginMarketplace` | Premium | Plugin install |
| `themeCodeEdit` | Premium | Code-level theme editing |
| `webhooks` | Premium | Webhook event hooks |
| `analytics` | Premium | Analytics dashboard data |
| `auditLog` | Premium | Audit trail |
| `siteEditor` | Premium | Full site editor |
| `seoFull` | Premium | Schema.org + advanced SEO |
| `visualThemeEditor` | Pro | Visual editor (the iframe + section variants) |
| `collections` | Pro | Custom content types |
| `dashboardBranding` | Org Enterprise | White-label admin UI |

A theme should never *require* a capability above its `minPackageTier`. Use `requiredCapabilities` for non-negotiable features and `optionalCapabilities` for everything else.

---

## 9. Graceful degradation

Themes must render correctly when modules are disabled or capabilities are missing. The customer might disable the `blogs` module, or their tier might not include `analytics`.

### 9.1 Use fallbacks everywhere

`apiFetch` returns the fallback you pass in on any failure. Always pass a sensible fallback:

```ts
const posts = await apiFetch<PostsBundle>('/public/posts', { data: [], total: 0 });
const menu  = await apiFetch<Menu | null>('/menus/slug/main-nav', null);
```

### 9.2 Component-local DEFAULTS

Every section component should have a `DEFAULTS` object spread before user data:

```tsx
const DEFAULTS: HeroData = {
    title: 'Welcome',
    subtitle: 'Built with Mero CMS',
};

export default function Hero({ data = {} }: { data?: HeroData }) {
    const c = { ...DEFAULTS, ...data };
    return <h1>{c.title}</h1>;
}
```

This means a theme renders correctly even if:

- The CMS is offline.
- The page record doesn't exist.
- The customer hasn't authored content yet.

### 9.3 Conditional sections

If a section depends on a module being enabled, check the data before rendering:

```tsx
{posts.length > 0 && <RecentPosts data={posts} />}
{capabilities.has('analytics') && <SiteStats />}
```

---

## 10. Plugin compatibility

If your theme works with specific Mero plugins, declare it in `theme.json`:

```json
{
  "supportedPlugins": {
    "visual-editor": "compatible",
    "advanced-analytics": "compatible"
  },
  "pluginIntegrations": {
    "visual-editor": {
      "sectionVariantsRequired": true
    }
  }
}
```

Plugins, in turn, declare which themes they're compatible with. The plugin marketplace shows the gate status per plugin × theme. A theme that doesn't support the visual-editor's required `sectionVariants` would show a "not compatible with current theme" warning when a customer tries to install it.

To make your theme visual-editor-compatible:

1. Declare `sectionVariants` in `theme.json` `designs[].sectionVariants`.
2. Implement variant rendering in each section component (section 7.3).

---

## 11. Build & deployment

### 11.1 next.config.ts

Copy from `mero-pro` — the key parts:

```ts
import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'http', hostname: '127.0.0.1' },
        ],
    },
    async rewrites() {
        return [{ source: '/api/:path*', destination: `${BACKEND_URL}/:path*` }];
    },
};

export default nextConfig;
```

The rewrite forwards same-origin `/api/*` requests to the backend, so the theme can use relative URLs in the browser without setting `NEXT_PUBLIC_API_URL`.

### 11.2 package.json

```json
{
    "name": "my-theme",
    "version": "1.0.0",
    "private": true,
    "scripts": {
        "dev": "next dev -p 3002",
        "build": "next build",
        "start": "next start -p 3002"
    },
    "dependencies": {
        "next": "^15.1.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0"
    },
    "devDependencies": {
        "typescript": "^5.5.0",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0"
    }
}
```

Use Tailwind v4 if your theme leans on utility classes — copy the configuration from `mero-pro`. Use plain CSS Modules or styled-jsx if you prefer.

### 11.3 Local development

In one terminal, run the Mero backend + admin from the project root:

```bash
cd mero_cms
npm run dev:all
```

In another terminal, run your theme:

```bash
cd mero_cms/themes/my-theme
npm install
npm run dev
```

Visit `http://localhost:3002`. The admin's theme-orchestration script (`scripts/dev-theme.js`) auto-detects the active theme; if your theme is the active one, it'll be served. Otherwise switch to your theme in admin → Themes.

### 11.4 Building for production

```bash
cd themes/my-theme
npm run build
```

Next.js generates a `.next/` build output. The Mero install runs `next start -p 3002` against this. For Mero Cloud customers, the cloud platform handles the build + deploy automatically.

---

## 12. Submission and packaging

To deliver a theme to a customer:

1. **Verify `theme.json` parses cleanly:**
   ```bash
   node -e "require('./theme.json')"
   ```
2. **Verify the manifest covers every section component you wrote.** Every `pageSchema[].sections[].type` must have a matching entry in `moduleSchemas`.
3. **Test on a fresh CMS install.** Activate the theme via Settings → Themes; confirm the admin's branding page shows your `brandingFields` controls; submit a test contact form; navigate to every page route.
4. **Take a `preview.svg`** (or PNG) of the home page. Place at the theme root. The admin gallery uses it.
5. **Zip the theme directory.** The customer drops the zip into `themes/` or uses the admin's "Upload theme" button.

```bash
cd themes
zip -r my-theme.zip my-theme -x "my-theme/node_modules/*" -x "my-theme/.next/*"
```

---

## 13. Best practices

**Use ISR for content pages.** Every Server Component that fetches CMS data should `export const revalidate = 120;` (or similar). The customer's edits propagate within the revalidation window without a rebuild.

**Don't fetch in client components.** Use Server Components for all CMS data. Client components are for interaction (forms, toggles, animations). This keeps the theme cacheable and fast.

**Tag your fetches.** `apiFetch` accepts a `tag` option. Pass distinct tags for distinct data so the admin's "Clear theme cache" button can revalidate selectively.

**Handle the offline case.** If the backend is being deployed when a visitor lands, your theme should still render with defaults rather than a blank page. The fallback pattern in `apiFetch` is the answer.

**Respect the customer's data.** Don't overwrite seed data on activation if the customer has edited it. Use `setupType === 'LEGACY'` (the default for non-fresh setups) to skip seeding.

**Keep `theme.json` honest.** Declare every module the theme uses in `modules` and every CSS variable in `brandingFields`. The contract is the basis of every gate the admin applies.

**Be deliberate about `websiteType`.** Omit unless the theme genuinely targets one segment; otherwise it'll be filtered out for customers in the other segment. (See [section 4.1](#41-identity-fields).)

**Performance budget.** Aim for a Lighthouse score of 90+ on home page. Avoid heavy fonts (limit to 2 families with selective subsets), inline critical CSS, lazy-load images below the fold.

**Accessibility.** Every section should be keyboard navigable. Use semantic HTML. Color contrast should meet WCAG AA against the customer's palette — test with the default `mero-pro` colors and a high-contrast custom palette.

---

## 14. Quick reference — file checklist

When you're done, your theme should have:

```
themes/my-theme/
├── theme.json                      ✓ valid JSON, includes brandingFields, pageSchema, moduleSchemas, designs, defaultSettings, seedData
├── preview.svg                     ✓ gallery preview
├── package.json                    ✓ name, version, scripts: dev/build/start, deps for next 15 + react 19
├── next.config.ts                  ✓ image remotePatterns, /api/* rewrite
├── tsconfig.json                   ✓ strict mode, paths alias for @/*
├── public/                         ✓ static assets
└── src/
    ├── app/
    │   ├── layout.tsx              ✓ injects branding CSS, mounts EditorBridge + CapabilitiesProvider
    │   ├── globals.css             ✓ :root{} declares every CSS variable in brandingFields
    │   ├── page.tsx                ✓ home page; renders sections from getPage('home')
    │   ├── about/page.tsx          ✓ at minimum, every page in pageSchema has a route
    │   ├── pricing/page.tsx        ✓
    │   ├── blog/page.tsx           ✓ blog listing
    │   ├── blog/[slug]/page.tsx    ✓ blog post detail
    │   ├── contact/page.tsx        ✓ contact form posting to /public/leads
    │   ├── login/page.tsx          ✓ uses /auth/login
    │   ├── signup/page.tsx         ✓ uses /auth/register + submitLead for demo capture
    │   ├── sitemap.ts              ✓ reads siteData.settings.siteUrl
    │   ├── robots.ts               ✓ reads siteData.settings.siteUrl
    │   └── not-found.tsx           ✓ 404 page
    ├── components/
    │   ├── Navigation.tsx          ✓ reads getMenu('main-nav')
    │   ├── Footer.tsx              ✓ reads getMenu('footer-product') etc.
    │   ├── EditorBridge.tsx        ✓ copy from mero-pro
    │   ├── CapabilitiesProvider.tsx ✓ copy from mero-pro
    │   └── sections/
    │       └── *.tsx               ✓ one component per type in moduleSchemas; data-section-id + data-editable; DEFAULTS pattern
    └── lib/
        └── api.ts                  ✓ resolveApiBase + apiFetch + apiPost + every endpoint helper
```

---

## 15. Reference: where to look in `mero-pro`

| Concept | File |
|---|---|
| Manifest example | `themes/mero-pro/theme.json` |
| API client | `themes/mero-pro/src/lib/api.ts` |
| Branding CSS injection | `themes/mero-pro/src/app/layout.tsx` |
| CSS token declaration | `themes/mero-pro/src/app/globals.css` |
| Visual editor bridge | `themes/mero-pro/src/components/EditorBridge.tsx` |
| Capability provider | `themes/mero-pro/src/components/CapabilitiesProvider.tsx` |
| Section component pattern | `themes/mero-pro/src/components/sections/Hero.tsx` |
| pickSection helper | `themes/mero-pro/src/lib/api.ts` (search for `pickSection`) |
| Sitemap/robots | `themes/mero-pro/src/app/sitemap.ts`, `robots.ts` |
| Auth form (lead capture) | `themes/mero-pro/src/components/ui/AuthForm.tsx` |
| Contact form | `themes/mero-pro/src/components/ui/ContactForm.tsx` |
| Pricing page (uses /public/packages-config) | `themes/mero-pro/src/app/pricing/page.tsx` |

---

## 16. Support and updates

**Bug reports / questions during development:** email the address provided with your Custom-tier license.

**Mero CMS updates that change the API.** Breaking changes are communicated via the changelog. The public read API has a stability contract; private endpoints don't, but themes never call private endpoints anyway.

**Submitting a theme to the Mero theme catalog.** Out of scope for Custom-tier deliverables — those are typically private themes built for one customer. To submit a public theme to the marketplace, contact Blendwit separately.

---

## 17. Changelog

- **v1.0** (2026-04) — Initial guide. Covers `theme.json` v1 schema, branding contract, page schema, module schemas, designs, visual editor bridge, capability gating, plugin compatibility, build, and submission.

This document is the canonical reference. If something here disagrees with a code comment in the reference theme, the code is correct and the docs need an update — please file a note via support.
