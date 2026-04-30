# Mero CMS — Database Design

Last revision: April 2026 · v1.4.0

## 1. Overview

Mero CMS uses **PostgreSQL 14+** as its primary data store via **Prisma 5**. The schema is assembled at setup time from per-module `.prisma` files (see section 10), so installations can ship with a smaller schema if they disable optional modules.

29 tables total. Everything connects through a single `User` model for authorship and a generic `Setting` key-value store for configuration.

## 2. Entity-relationship overview

```
                             ┌────────────┐
                             │    Role    │
                             └────────────┘
                                   │ 1
                                   │
                                   │ ∗
                             ┌────────────┐         ┌────────────┐
                             │    User    │─────────│   Session   │ (JWT — no table, stateless)
                             └────────────┘   1   ∗ └────────────┘
                                  │
     ┌─────────────────┬──────────┼──────────┬─────────────────┐
     │                 │          │          │                 │
     ▼                 ▼          ▼          ▼                 ▼
 ┌───────┐        ┌─────────┐  ┌────────┐ ┌──────────┐   ┌──────────────┐
 │ Post  │        │ Comment │  │ Media  │ │ Invitation│   │ ActivityLog  │
 └───────┘        └─────────┘  └────────┘ └──────────┘   └──────────────┘
    │ ∗                ∗
    │                  │
    │         ┌────────┘
    ▼         ▼
 ┌───────┐ ┌─────────┐
 │  Tag  │ │Category │
 └───────┘ └─────────┘

┌──────────┐       ┌──────────┐
│   Page   │ ────▶ │ SeoMeta  │  (polymorphic — pageType: 'page' | 'post')
└──────────┘       └──────────┘
   (data: Json ─ sections, _style, _variant, _widgets)

┌──────────┐        ┌──────────┐
│   Menu   │ 1──∗   │ MenuItem │ (nested via parentId)
└──────────┘        └──────────┘

┌──────────────┐      ┌──────────────────┐
│  Collection  │ 1──∗ │  CollectionItem  │
└──────────────┘      └──────────────────┘

┌──────────┐ 1──∗ ┌────────────────┐
│   Form   │      │ FormSubmission │
└──────────┘      └────────────────┘

THEME-SCOPED (loaded when theme declares them in requiredModules):
  TeamMember · Testimonial · Service · Lead

PLATFORM:
  Setting (KV) · Package (seed from config) · AnalyticsConfig · Webhook ·
  Notification · Redirect · RobotsTxt · Design
```

## 3. Core tables

### 3.1 `User`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| email | text UNIQUE | |
| password | text | bcrypt |
| name | text | nullable |
| roleId | uuid FK → Role | |
| forcePasswordChange | bool | |
| ipWhitelist | text[] | empty = any |
| twoFactorEnabled | bool | |
| twoFactorSecret | text | TOTP (null when 2FA off) |
| failedLoginAttempts | int | |
| lockoutUntil | timestamp | nullable |
| preferences | jsonb | UI prefs |
| avatar, bio | text | nullable |
| status | text | 'ACTIVE' \| 'SUSPENDED' |
| isActive | bool | |
| lastActive | timestamp | |
| createdAt, updatedAt | timestamp | |

Relations: author of Post[], Comment[], Media[], Invitation (sender + redeemer), ActivityLog[].

### 3.2 `Role`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text UNIQUE | e.g. 'Super Admin', 'Editor' |
| description | text | |
| permissions | jsonb | Record<Permission, boolean> |
| isSystem | bool | true for pre-built roles, prevents deletion |
| tier | int | minimum package tier that can use this role (0=any) |

### 3.3 `Invitation`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| email | text | |
| token | text UNIQUE | magic link |
| roleId | uuid FK → Role | |
| status | text | 'PENDING' \| 'REDEEMED' \| 'EXPIRED' |
| expiresAt | timestamp | default +7 days |
| sentById | uuid FK → User | |
| redeemedById | uuid FK → User | nullable |
| createdAt, updatedAt | timestamp | |

## 4. Content models

### 4.1 `Post` (from `blogs.prisma`)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| title | text | |
| slug | text UNIQUE | |
| content | text | HTML (TipTap output) |
| excerpt | text | nullable |
| coverImage | text | URL |
| status | text | 'DRAFT' \| 'SCHEDULED' \| 'PUBLISHED' |
| authorId | uuid FK → User | |
| featured | bool | |
| theme | text | which theme owns this post; nullable |
| publishedAt | timestamp | actual publish time, set when status=PUBLISHED |
| **publishAt** | timestamp | **future scheduled time** (see ContentSchedulerService) |
| createdAt, updatedAt | timestamp | |

Many-to-many with Category (via `CategoryToPost`) and Tag (via `PostToTag`). One-to-many with Comment.

### 4.2 `Page` (from `pages.prisma`)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| title | text | |
| slug | text UNIQUE | |
| content | text | rich HTML for simple static pages |
| **data** | jsonb | **the section tree — see §5** |
| description | text | meta description |
| featuredImage | text | |
| status | text | 'DRAFT' \| 'SCHEDULED' \| 'PUBLISHED' |
| settings | jsonb | page-level overrides |
| theme | text | |
| publishAt | timestamp | future scheduled time |
| publishedAt | timestamp | |
| createdAt, updatedAt | timestamp | |

### 4.3 `SeoMeta` (polymorphic)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| pageType | text | 'page' \| 'post' |
| pageId | uuid | reference (no FK — polymorphic) |
| metaTitle, metaDescription, metaKeywords | text | |
| ogTitle, ogDescription, ogImage | text | |
| ogImages | text[] | multiple OG images |
| canonicalUrl | text | |
| noIndex | bool | |
| updatedAt | timestamp | |

UNIQUE(pageType, pageId).

### 4.4 `Media`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| filename | text | as stored on disk / S3 |
| originalName | text | |
| mimeType | text | |
| size | int | bytes — counted for STORAGE gate |
| url | text | public URL |
| folder | text | UI organisation |
| altText | text | accessibility + AI-generated by plugin |
| width, height | int | nullable, set by Sharp for images |
| versions | jsonb | {thumb, sm, md, lg}.url — WebP variants |
| userId | uuid FK → User | uploader |
| createdAt | timestamp | |

## 5. The `Page.data.sections` shape

Pages store their layout as a JSON tree:

```json
{
  "sections": [
    {
      "id": "hero",
      "enabled": true,
      "data": {
        "headline_highlight": "Innovative",
        "subheadline": "Smart analytics…",
        "_variant": "dashboard",
        "_style": { "paddingTop": 128, "backgroundColor": "#0d0e18" },
        "_widgets": [
          { "kind": "heading", "id": "w1", "level": 3, "text": "Trust notice", "align": "center" },
          { "kind": "spacer", "id": "w2", "height": 32 }
        ]
      }
    },
    { "id": "features", "enabled": true, "data": { ... } },
    { "id": "blog-list", "enabled": false, "data": { ... } }
  ]
}
```

Key conventions:
- `id` — maps to a section type declared in the active theme's `theme.json#pageSchema`.
- `enabled` — hides from public render when false.
- `data.<fieldKey>` — user-editable fields declared in pageSchema.
- `data._variant` — selected variant key (Pro+ feature).
- `data._style` — per-section style override (Pro+ feature).
- `data._widgets` — ordered array of user-placed widgets (Pro+ / Enterprise feature).

## 6. Menus

### 6.1 `Menu`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| slug | text UNIQUE | e.g. 'main-nav', 'footer-menu' |
| theme | text | associates with a theme |
| createdAt, updatedAt | timestamp | |

### 6.2 `MenuItem` (self-referential — nested menus)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| label | text | |
| url | text | `#hero`, `/blog`, full URL |
| target | text | default `_self` |
| order | int | within siblings |
| parentId | uuid FK → MenuItem | null = top-level |
| menuId | uuid FK → Menu ON DELETE CASCADE | |
| createdAt, updatedAt | timestamp | |

Nested via `parent` / `children` self-relation `MenuNesting`. Footer menus ship 2 levels deep (Product > Dashboards, Metrics, …).

## 7. Theme-scoped content

Auto-enabled when the active theme's `theme.json` declares them in `requiredModules`:

### 7.1 `TeamMember` · 7.2 `Testimonial` · 7.3 `Service` · 7.4 `Lead`

Minimal shape — each has an id, title/name, description, and either an `order` (for sortable lists) or a `status` (for incoming messages). See `prisma/modules/{team,testimonials,services,leads}.prisma` for exact columns.

## 8. Platform tables

### 8.1 `Setting` (generic KV)

| Column | Type | Notes |
| --- | --- | --- |
| key | text PK | |
| value | text | stringified; JSON for structured data |
| updatedAt | timestamp | |

Used for:
- `active_theme` — slug string
- `active_package_id` — package id
- `setup_complete` — "true" / "false"
- `enabled_modules` — comma-separated list
- `primary_color`, `secondary_color`, `heading_font`, `text_base`, `space_4`, … — CSS tokens
- `admin_primary_color`, `admin_heading_font`, … — admin branding (gated)
- `installed_plugins` — JSON array of `{ slug, version, enabled, licenseKey, installedAt }`
- Plus any theme-specific setting declared in `theme.json#defaultSettings`

This pattern avoids schema migrations for every new flag/token.

### 8.2 `Package` (seeded from `packages.ts`)

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | 'personal-basic', 'org-enterprise', etc. |
| name | text | |
| websiteType | text | 'personal' \| 'organizational' |
| tier | int | 1–4 |
| priceMin, priceMax | int | NPR |
| isCustomPrice | bool | |
| tagline | text | |
| features | text[] | |
| comingSoon | text[] | |
| starterThemes | text[] | whitelist |
| supportLevel | text | 'email' \| 'priority' \| 'dedicated' |
| aiEnabled | bool | |
| storageLimitGB | int | -1 = unlimited |
| teamLimit | int | -1 = unlimited |
| hasWhiteLabel | bool | |
| hasApiAccess | bool | |
| isActive | bool | |
| highlighted | bool | |
| order | int | UI ordering |

Capabilities are not stored in this table — they're computed from the static `packages.ts` config by package id. Keeps the DB simple and lets feature changes ship without migrations.

### 8.3 `Webhook`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| url | text | |
| events | text[] | 'post.published', 'page.updated', … |
| secret | text | for HMAC signing |
| isActive | bool | |
| createdAt, updatedAt | timestamp | |

### 8.4 `AnalyticsConfig` · `Redirect` · `RobotsTxt` · `Design`

- `AnalyticsConfig` — GA4 measurement id, stream id, etc.
- `Redirect { from, to, statusCode }` — 301/302 manager.
- `RobotsTxt { content }` — singleton; the only row is the current robots content.
- `Design { tokens: jsonb }` — placeholder for v2 design-tokens module; currently unused.

### 8.5 `Notification` · `ActivityLog`

- `Notification { userId, type, title, message, read }` — in-app admin notifications.
- `ActivityLog { userId, action, metadata: jsonb, severity }` — audit trail.

## 9. Collections (user-defined content types)

### 9.1 `Collection`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| name, slug | text | |
| type | text | 'COLLECTION' \| 'SINGLETON' |
| schema | jsonb | array of field defs |
| createdAt, updatedAt | timestamp | |

### 9.2 `CollectionItem`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| collectionId | uuid FK → Collection ON DELETE CASCADE | |
| slug | text | UNIQUE within the collection |
| title | text | |
| content | text | |
| status | text | 'DRAFT' \| 'PUBLISHED' |
| data | jsonb | user fields per schema |
| createdAt, updatedAt | timestamp | |

## 10. Modular schema assembly

The schema is NOT one monolithic `schema.prisma`. It's assembled at setup:

```
backend/prisma/
├── modules/
│   ├── _datasource.prisma  # always included
│   ├── _core.prisma        # User, Role, Setting, Media, Invitation, ActivityLog, Notification, Design, Package, Webhook, Collection, CollectionItem, Form, FormSubmission
│   ├── blogs.prisma        # Post, Category, Tag
│   ├── comments.prisma     # Comment
│   ├── pages.prisma        # Page
│   ├── menus.prisma        # Menu, MenuItem
│   ├── seo.prisma          # SeoMeta
│   ├── redirects.prisma    # Redirect
│   ├── robots.prisma       # RobotsTxt
│   ├── analytics.prisma    # AnalyticsConfig
│   ├── services.prisma     # Service
│   ├── testimonials.prisma # Testimonial
│   ├── team.prisma         # TeamMember
│   ├── leads.prisma        # Lead
│   ├── demo.prisma         # DemoSession (internal)
│   └── themes.prisma       # anything theme-specific
└── schema.prisma           # ← generated by scripts/build-schema.js
```

`node scripts/build-schema.js all` — generates with every module.
`node scripts/build-schema.js blogs,menus,pages,seo,services` — generates with a subset.

Then `prisma generate && prisma db push` syncs to Postgres.

## 11. Migrations

v1 uses `prisma db push` (schema-first, no migration history). The trade-off:
- ✅ Fast to iterate — edit a `.prisma` file, rerun `build-schema` + `db push`.
- ✅ Works with the modular-schema pattern; migration files would explode with every module toggle.
- ❌ No automatic rollbacks.
- ❌ Production ops rely on manual DB snapshots before schema changes.

v2.0 roadmap: migrate to `prisma migrate` with per-module migration folders.

## 12. Indexes

Prisma automatically indexes:
- All `@id` fields (primary keys).
- All `@unique` fields (User.email, Post.slug, Page.slug, Setting.key, Role.name, Menu.slug, Collection.slug, Invitation.token, SeoMeta(pageType, pageId), etc.).

Manual indexes we've added for hot query paths:
- `Post(status, publishedAt DESC)` — blog feed ordering.
- `Post(status, publishAt ASC)` — scheduler lookup.
- `Page(status, slug)` — public page fetch.
- `ActivityLog(userId, createdAt DESC)` — audit log pagination.

## 13. Reset behavior

`ThemesService.resetToBaseState({ hardReset })`:

Always clears (all content tables): `menuItem, menu, page, teamMember, testimonial, service, lead, notification, seoMeta, media, activityLog, comment, post, tag, category`.

Keeps (soft reset): `User`, `Role`, `Invitation`, `Package` (metadata is seeded again), and a few core settings (`enabled_modules`, `setup_complete`, `cms_title`, `cms_subtitle`, `cms_login_avatar`).

On `hardReset: true`: clears everything including users' auth data, resets `SETUP_COMPLETE=false` in `.env`, and restarts the server to re-run the setup wizard.

## 14. Backup strategy

Built-in Backup Scheduler plugin (free) does nightly DB + media backups to S3/R2. Without it, customers are expected to run their own `pg_dump` and object-storage backups.

## 15. Sizing

A typical Personal Premium customer after 6 months:
- Users: 3
- Pages: 5–10
- Posts: 30–50
- Comments: 100–300
- Media: 200–500 images (= 100–300 MB with WebP versions)
- Settings rows: 60–80 (tokens + flags + plugins)
- ActivityLog: 5000–10000 rows

Total DB size typically under 50 MB. Object storage typically the dominant cost.

## 16. Where to look

- Schema modules: `backend/prisma/modules/*.prisma`
- Assembled schema: `backend/prisma/schema.prisma` (regenerate, don't edit)
- Prisma client: `backend/src/prisma/prisma.service.ts` + getters
- Seed scripts: `backend/prisma/seed.ts`, `seed-starter.ts`, `seed-demo.ts`
- Reset logic: `backend/src/themes/themes.service.ts → resetToBaseState()`
