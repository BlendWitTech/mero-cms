# Mero CMS Backend ↔ Theme Integration Notes

Captured during Phase 0 of the integration plan. Single source of truth
for how the marketing theme talks to the backend. Update whenever the
backend's public surface changes.

---

## Backend connection

- **Base URL** (local dev): `http://localhost:3001`
- **Theme port**: `3002` (set via `next dev -p 3002`)
- **No global `/api` prefix.** Controllers expose paths directly (e.g. `@Controller('auth')` → `POST /auth/login`).
- **CORS** allows `http://localhost:3000-3002` by default.

---

## Public endpoints (theme reads — no auth required)

### `GET /public/site-data`

The spine of the theme. Single fetch returns everything most pages need.

```ts
{
  pageSchema: PageSchema[],
  moduleAliases: Record<string, string>,
  settings: {
    siteTitle: string,
    tagline: string,
    copyrightText: string,
    logoUrl: string | null,
    faviconUrl: string | null,
    primaryColor: string | null,
    cmsTitle: string,
    cmsSubtitle: string | null,
    cmsLogo: string | null,
    footerText: string | null,
    contactEmail: string | null,
    contactPhone: string | null,
    address: string | null,
    socialLinks: Record<string, string> | null,
    activeTheme: string | null,
    heroTitle: string | null,
    heroSubtitle: string | null,
    heroBgImage: string | null,
    heroBgVideo: string | null,
    aboutTitle: string | null,
    aboutContent: string | null,
    aboutImage: string | null,
    ctaText: string | null,
    ctaUrl: string | null,
    metaDescription: string | null,
    googleAnalyticsId: string | null,
    headingFont: string | null,
    bodyFont: string | null,
    secondaryColor: string | null,
    accentColor: string | null,
    listingMode: 'load-more' | 'pagination'
  },
  limits: {
    hasWhiteLabel: boolean,
    hasApiAccess: boolean,
    storageLimitGB: number,
    teamLimit: number
  },
  enabledModules: string[],
  menus: Menu[],
  pages: Page[],
  team: TeamMember[],
  testimonials: Testimonial[],
  services: Service[],
  recentPosts: Post[],
  collections: Collection[],
  demoNextReset?: string
}
```

### Other public endpoints

| Method + Path | Returns |
|---|---|
| `GET /public/pages/:slug` | A single `Page` by slug |
| `GET /public/posts?page=&limit=&status=` | `{ data: Post[], total, page, limit }` |
| `GET /public/posts/:slug` | A single `Post \| null` |
| `GET /public/collections/:slug` | A single `Collection` with first 50 items |
| `GET /public/collections/:slug/items?page=&limit=&search=` | Paginated items |
| `GET /public/collections/:slug/items/:itemSlug` | Single item |
| `POST /public/leads` | Submit a lead (`{ name, email, phone?, message, source? }`) |
| `POST /public/forms/:id/submit` | Submit a form (rate-limited 10/min per IP). Body is arbitrary JSON keyed by field names from the form schema. Response: `{ success, id?, message? }`. **No HMAC or CSRF required.** |
| `GET /public/packages?type=` | Package list (pricing tiers) |
| `GET /public/capabilities` | Tier-derived capability map (see below) |

### `GET /public/capabilities`

```ts
{
  package: { id, name, tier: 1-5, websiteType, supportLevel } | null,
  capabilities: {
    siteEditor: boolean,
    seoFull: boolean,
    analytics: boolean,
    webhooks: boolean,
    apiAccess: boolean,
    aiContent: boolean,
    // ...other per-feature flags
  },
  limits: {
    storageGB: number,
    teamMembers: number,
    hasWhiteLabel: boolean,
    hasApiAccess: boolean,
    aiEnabled: boolean,
    themeCount: number
  },
  supportLevel: string,
  installedPlugins: string[],
  themeCompat: {
    minPackageTier: number,
    isCompatible: boolean,
    requiredCapabilities: string[],
    missingRequired: string[],
    pluginIntegrations: Record<string, any>,
    supportedPlugins: Record<string, any>
  }
}
```

---

## Theme-config endpoints

| Method + Path | Returns |
|---|---|
| `GET /themes/active` | `{ activeTheme: string \| null }` |
| `GET /themes/active/page-schema` | `PageSchema[]` — the editable page+section structure for the admin |
| `GET /themes/active/section-palette` | Flat `SectionMetadata[]` |
| `GET /themes/active/module-aliases` | `{ moduleAliases: Record<string, string> }` |
| `GET /themes/active/module-schemas` | `Record<string, any[]>` |
| `GET /themes/active/config` | Full `theme.json` (minus `seedData`) |

The theme itself rarely calls these — they're used by the **admin** to render section editors. But the theme must ship a `theme.json` that the admin can parse correctly (see Manifest section below).

---

## Other resource endpoints

| Method + Path | Auth | Returns |
|---|---|---|
| `GET /menus/slug/:slug` | public | `Menu` (root items in `items`, nested in `items[].children`) |
| `GET /seo-meta/:pageType` | public | `SeoMeta[]` (per-page-type list) |
| `GET /seo-meta/:pageType/:pageId` | public | `SeoMeta \| null` (per-page override) |
| `GET /redirects/check/:path` | public | `{ fromPath, toPath, statusCode } \| null` |
| `GET /categories` | public | `Category[]` |
| `GET /categories/:id` | public | `Category` |

---

## Auth endpoints

| Method + Path | Body | Response |
|---|---|---|
| `POST /auth/login` (LocalAuthGuard) | `{ email, password, rememberMe? }` | `{ access_token, refresh_token, user }` |
| `POST /auth/register` (throttled 5/5min) | `{ email, password, name }` | `{ success, user?, error? }` |
| `POST /auth/refresh` | `{ refresh_token }` | `{ access_token, refresh_token }` |
| `POST /auth/logout` | `{ refresh_token? }` | `{ success, message }` |
| `GET /auth/profile` (JwtAuthGuard) | — | `User & { license: { tier, tierName, usage, limits } }` |

Theme uses **JWT in localStorage / cookies**, not server-managed session cookies. Login response carries both tokens; refresh-rotation is on the theme to manage.

---

## Forms

The Mero admin lets editors build forms with named fields. The theme submits to:

```
POST /public/forms/:formId/submit
Body: { [fieldName]: any, ... }   // arbitrary JSON keyed by field names
Response: { success, id?, message? }
Throttle: 10/min per IP
```

No HMAC or CSRF token required. Field names must match the form schema in the admin (e.g., `name`, `email`, `message` for a contact form). The `formId` is provided by the admin when configuring the form.

---

## Data models (the shapes returned)

### Page

```ts
{
  id, slug, title, description?, content?,
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
  theme: string | null,
  data: {
    sections: Array<{
      id: string,
      type: string,
      data: Record<string, any>,
      _variant?: string
    }>
  },
  createdAt, updatedAt
}
```

### Post

```ts
{
  id, title, slug, content, excerpt?,
  coverImage?, featuredImageUrl?,   // featuredImageUrl is an alias added by /public
  status, featured, publishedAt?,
  authorId, author: { name },
  categories: [{ name, slug }],
  tags: [{ id, name, slug }],
  createdAt, updatedAt
}
```

### Menu

```ts
{
  id, slug, name, theme: string | null,
  items: MenuItem[],   // root items, where parentId is null
  createdAt, updatedAt
}

MenuItem = {
  id, menuId, label, url, order,
  parentId: string | null,
  children: MenuItem[],   // recursive nesting
  icon?, isActive
}
```

### Testimonial (public, with theme-compat aliases)

```ts
{
  id,
  clientName, name,            // name is an alias of clientName
  clientRole?, role?,          // role aliases clientRole
  clientCompany?,
  content, rating,             // rating 1–5
  clientAvatar?, avatarUrl?,   // avatarUrl aliases clientAvatar
  order, isActive
}
```

### Other models

- **TeamMember**: `{ id, name, role, bio?, avatar?, order, socialLinks?, isActive }`
- **Service**: `{ id, title, description?, icon?, image?, order, isActive }`
- **Collection** + **CollectionItem**: arbitrary user-defined content types (see verbose spec).
- **SeoMeta**: per-page SEO override (title, description, ogTitle/Description/Image, canonicalUrl, robots).
- **Category**: blog categories (`{ id, name, slug, description? }`).

---

## `theme.json` manifest — what the admin parses

The admin reads these fields from the theme's `theme.json` at install/activate time:

```ts
{
  name: string,                              // display name
  slug: string,                              // URI-safe unique
  version: string,
  description: string,
  author: string,

  modules?: string[],                        // ['pages', 'blogs', 'menus', 'testimonials', ...]
  requiredModules?: string[],                // alias

  pageSchema: Array<{
    slug: string,
    name: string,
    label: string,
    description?: string,
    sections: Array<{
      id: string,
      type: string,
      label?: string,
      description?: string,
      variants?: Array<{ key, label, description? }>
    }>
  }>,

  moduleAliases?: Record<string, string>,    // { team: 'Our Team' }

  moduleSchemas?: Record<string, any[]>,

  designs?: Array<{
    key: string,
    label: string,
    description?: string,
    sectionVariants: Record<string, string>  // { 'home:hero': 'dark', ... }
  }>,
  defaultDesignKey?: string,

  defaultSettings?: Record<string, string>,

  seedData?: {
    pages?, posts?, blogCategories?, menus?,
    team?, testimonials?, services?,
    collections?, collectionItems?, media?
  },

  requiredCollections?: Array<{ name, slug, type?, description?, fields: [{ name, label, type, required? }] }>,

  minPackageTier?: number,                   // 1..5
  supportedPackages?: string[] | ['any'],
  requiredCapabilities?: string[],
  optionalCapabilities?: string[],
  supportedPlugins?: Record<string, any>,
  pluginIntegrations?: Record<string, any>,

  deployedUrl?: string,
  websiteType?: 'personal' | 'organizational'
}
```

This is a **completely different schema** from what the v1 marketing theme ships. We rewrite `theme.json` in Phase 4.

---

## Key gotchas

1. **Settings are flat key/value** — `siteData.settings.heroTitle` not `siteData.pages.home.sections.hero.data.title`.
2. **Page sections are stored inside the page** — fetch via `GET /public/pages/:slug`, then iterate `page.data.sections`.
3. **Menus have nested children**, only one level deep currently.
4. **Testimonials, services, team are top-level collections** in `siteData`, not embedded in any page.
5. **JWT, not session cookies** — login response carries `access_token` + `refresh_token`; theme stores them and rotates.
6. **Form submissions go to `/public/forms/:formId/submit`**, not `/forms/:id/submit` and not `/api/forms/...`. The `:formId` is set in the admin, not in the theme.
7. **`recentPosts` in `siteData`** carries the latest 6 posts already, no separate fetch needed for the home page's recent-posts section.

---

## Recommended caching

`/public/site-data` and `/themes/active/*` are stable in production — cache aggressively (Redis at the backend, ISR at the theme). Invalidate on admin save (the admin already fires webhooks the theme can subscribe to).
