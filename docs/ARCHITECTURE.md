# Mero CMS — System Architecture

Last revision: April 2026 · v1.4.0

## 1. Purpose

Mero CMS is a self-hosted, one-time-licence content management system. Customers buy a package (Personal/Organizational × Basic/Premium/Professional/Enterprise/Custom), deploy it to their own infrastructure, pick one of the included themes, and publish a marketing site + blog + static pages.

This document describes how the system is put together — how the pieces fit, how data flows, and how deployment works.

## 2. High-level diagram

```
                    ┌─────────────────────────────────────────────┐
                    │          Customer's infrastructure           │
                    │  (Docker Compose, Railway, Render, K8s…)    │
                    └─────────────────────────────────────────────┘
                                         │
┌──────────────┐    HTTPS    ┌──────────────────┐    Prisma    ┌──────────────┐
│  Public      │──────────▶  │   Public Theme    │─────────────▶│              │
│  visitors    │             │   (Next.js 16)    │              │              │
└──────────────┘             │   Port 3003/3004  │              │              │
                             └──────────────────┘              │              │
                                       │                        │              │
                                       │  REST /public/*        │              │
                                       ▼                        │              │
┌──────────────┐    HTTPS    ┌──────────────────┐    Prisma    │  PostgreSQL  │
│   Admins     │──────────▶  │  Admin Frontend   │─────────────▶│              │
│   / staff    │             │  (Next.js 16)     │              │              │
└──────────────┘             │  Port 3000        │              │              │
                             └──────────────────┘              │              │
                                       │                        │              │
                                       │  REST /*               │              │
                                       ▼                        │              │
                             ┌──────────────────┐              │              │
                             │   NestJS API      │──────────────▶│              │
                             │   Port 3001       │              └──────────────┘
                             │                   │                     ▲
                             │  + ScheduleModule │                     │
                             │  + ThrottlerGuard │                     │
                             └──────────────────┘                     │
                                       │                              │
                                       │  Storage                      │
                                       ▼                              │
                             ┌──────────────────┐                     │
                             │  Local uploads/   │                     │
                             │  or S3/R2/Spaces  │                     │
                             └──────────────────┘                     │
                                                                       │
                             ┌──────────────────────────────────────┐  │
                             │  Cloudflare R2, AWS S3, DigitalOcean  │──┘
                             │  (optional — media offload)           │
                             └──────────────────────────────────────┘
```

## 3. Services

### 3.1 NestJS API backend · port 3001

The single authoritative service. Every authenticated admin action and every public read goes through it.

Key modules (~40 total):

| Group | Modules |
| --- | --- |
| **Auth & access** | `auth`, `users`, `roles`, `invitations`, `access-control` |
| **Content** | `pages`, `blogs` (posts+categories+tags+comments), `menus`, `media`, `collections`, `forms`, `leads` |
| **Theme-scoped** | `team`, `services`, `testimonials` (auto-loaded when a theme declares them in `requiredModules`) |
| **Theme system** | `themes`, `theme-editor`, `setup` |
| **SEO & analytics** | `seo-meta`, `redirects`, `sitemap`, `robots`, `analytics` |
| **Platform** | `packages`, `payments`, `plugins`, `content-scheduler`, `audit-log`, `notifications`, `webhooks`, `tasks`, `mail`, `ai`, `demo`, `public` |

Nest modules are loaded via a `when()` helper from `ENABLED_MODULES` env var — installers can disable optional modules by rebuilding the Prisma schema from `prisma/modules/*.prisma` and restarting.

### 3.2 Admin frontend · port 3000

Next.js 16 app with two route groups:

- `(site)` — public marketing pages served to anonymous visitors. Used for demos and the Mero-CMS marketing site itself.
- `(admin)` — authenticated dashboard. `/dashboard/*` covers every admin surface: content editors (pages, blog, media, menus, collections, forms, team, testimonials, services, leads), settings, theme management (install/activate/customise/code-edit/visual-edit), package management, audit log, plugins.

Global contexts:
- `PermissionsContext` — role-based permissions (users_view, content_edit, etc.)
- `ModulesContext` — which modules the backend enabled
- `CapabilitiesContext` — what the active package unlocks (pluginMarketplace, visualThemeEditor, etc.)
- `SettingsContext` — settings from the backend, automatically applied as CSS vars
- `NotificationContext` — toast notifications
- `FormContext` — unsaved-changes tracking

### 3.3 Theme frontend · port 3002

One Next.js app per theme, served on port 3002 by `scripts/dev-theme.js`. A
fresh install has no bundled themes — customers install `mero-starter-theme`
or upload their own from the admin. The theme manifest contract lives in
`docs/THEME_MANIFEST_SPEC.md`.

Each theme:
- Reads content from the API via `/public/*` endpoints
- Declares its capabilities in `theme.json` (pageSchema, sectionVariants, requiredModules, seedData)
- Opts into the Visual Editor by including the `<EditorBridge/>` client component

The `dev-theme.js` script watches `active_theme` in the DB and hot-swaps the running theme when an admin activates a different one.

### 3.4 Cron jobs

Running inside the NestJS process via `@nestjs/schedule`:

- `ContentSchedulerService` · every minute — flips `status=SCHEDULED` posts/pages to `PUBLISHED` when `publishAt <= now`, fires webhooks.
- `DemoTasksService` · hourly — cleans up expired demo sessions.

## 4. Request flows

### 4.1 Public visitor reads a blog post

```
Visitor → Theme (Next.js) → GET /public/posts/:slug → NestJS → Prisma → Postgres → JSON → render
```

Theme caches the result for 60 s via `next: { revalidate: 60 }`. Admin writes fire a webhook to `theme_url/api/revalidate?secret=…&path=/` to invalidate on demand.

### 4.2 Admin updates a section

```
Admin → PUT /pages/by-slug/home
        ↓
    JwtAuthGuard
        ↓
    PermissionsGuard (CONTENT_EDIT)
        ↓
    PagesController.updateBySlug()
        ↓
    PagesService.updateBySlug() — rejects if page does not exist
        ↓
    Prisma → Postgres
        ↓
    WebhooksService.dispatch('page.updated', ...)
        ↓
    Response
```

Separate gated route `POST /pages/by-slug/:slug` with `@RequireLimit(SITE_EDITOR)` is used for create-via-slug (Premium+).

### 4.3 Visual-editor click-to-edit

```
Theme (with ?editMode=secret loaded in admin iframe)
    → EditorBridge wraps [data-section-id] elements
    → user clicks one
    → postMessage 'mero-editor:section-click' to parent
    → Admin /dashboard/themes/visual-editor receives message
    → scrolls matching card into view in right pane + highlights
```

On save, the admin posts `{ type: 'mero-editor:reload' }` back to the iframe which triggers a `window.location.reload()`.

### 4.4 Theme activation

```
Admin → POST /themes/:name/activate
        ↓
    PackageEnforcementGuard — checks starterThemes whitelist
        ↓
    ThemesService.setActiveTheme()
        ↓
    Writes Setting 'active_theme' → Postgres
        ↓
    Seeds pages/menus/testimonials/team/services/posts from theme.json
        ↓
    Writes theme's .env.local to point at CMS_API_URL
        ↓
    WebhooksService.dispatch('theme.activated')
        ↓
    dev-theme.js polls /public/site-data, detects the change, restarts the theme dev server
```

## 5. Deployment topology

### Single-node (default — Docker Compose)

```
┌────────────────────────────────────────────────────┐
│  Reverse proxy (Caddy / nginx — TLS termination)   │
└────────────────────────────────────────────────────┘
     │              │                      │
     ▼              ▼                      ▼
 /             /admin                   /api
 (theme)       (frontend)               (backend)
 :3003         :3000                    :3001
     │              │                      │
     └──────────────┴──────────────────────┘
                    │
              ┌─────▼────┐
              │ Postgres │ :5432
              └──────────┘
                    │
              ┌─────▼────┐
              │ uploads/ │ (or S3)
              └──────────┘
```

Covered by `docker-compose.yml` (services: db, backend, frontend, theme).

### Multi-node / PaaS

Each service is a standalone Next.js / Nest deployable:
- **Backend** — Railway / Render / Fly. Needs Postgres, `uploads/` persisted via volume or S3.
- **Frontend admin** — Vercel / Netlify. Needs `NEXT_PUBLIC_CMS_API_URL` pointing at backend.
- **Theme** — Vercel / Netlify. Needs `CMS_API_URL` + `REVALIDATE_SECRET`.
- **DB** — Managed Postgres (Supabase, Neon, RDS).
- **Media** — Cloudflare R2 / AWS S3 / DigitalOcean Spaces, configured in Settings.

Marketing-theme's `docker-compose.demo.yml` demonstrates a multi-branch demo setup.

## 6. Key design decisions

### 6.1 One Prisma schema, many optional modules

Each optional content module (`blogs.prisma`, `menus.prisma`, etc.) lives as a separate `.prisma` file in `prisma/modules/`. `scripts/build-schema.js` assembles them into `schema.prisma` at setup time, controlled by the `ENABLED_MODULES` env var or the `--all` flag. This lets a personal-tier customer ship a thinner DB.

### 6.2 Settings as a generic KV store

Instead of proliferating columns on a `Setting` model, everything tier- and theme-flavoured goes into a single `Setting { key, value }` table (JSON strings where needed). Examples:
- `active_theme` → slug
- `active_package_id` → package id
- `installed_plugins` → JSON array of installed plugins
- `primary_color`, `text_base`, `space_4`, etc. → CSS tokens
- `admin_primary_color`, `admin_heading_font` → admin branding

`SettingsContext` on the client reads it once and mirrors it as CSS vars on `<html>`.

### 6.3 Package enforcement in the guard, capabilities in config

`PackageLimit` enum in `require-limit.decorator.ts` — add `@UseGuards(PackageEnforcementGuard) @RequireLimit(PackageLimit.X)` on any controller or route to gate it. The guard reads `capabilities` from `backend/src/config/packages.ts` (per-package static config). `/packages/usage` returns the full usage + limits + capabilities to the frontend so UI can mirror the gates.

### 6.4 Themes are Next.js apps, not templates

Avoids the WordPress-style PHP render cycle. A theme is a fully-featured Next.js app that reads from the CMS via REST. Themes can deploy independently of the backend and use ISR / SSG caching. Tradeoff: theme devs need to know Next.js.

### 6.5 Page layout stored as `Page.data.sections[]`

Every CMS-managed page stores its layout as an array of `{ id, enabled, data }`. The `id` maps to a section type declared in `theme.json#pageSchema`. Themes render via a `SectionRenderer` that switches on `id`. Section `data` can also contain:
- `_variant` — selected component variant (if theme declares variants)
- `_style` — per-section style overrides (padding, colour, font scale)
- `_widgets` — array of user-placed generic widgets

### 6.6 Plugins as settings (v1)

Installed plugins are stored as JSON under `Setting.key = 'installed_plugins'`. Plugin manifests come from a static catalog (`backend/src/plugins/catalog.ts`). v2 will switch to a dedicated Prisma model + remote registry.

## 7. Security posture

- JWT auth for every admin route. Refresh not yet shipped.
- 2FA (TOTP) optional per user.
- Role-based permissions via `PermissionsGuard`.
- Package-tier enforcement via `PackageEnforcementGuard`.
- `ThrottlerGuard` globally at 100 req/min, tighter on login (10/min) and public form submits (5/min).
- Helmet for HTTP headers.
- File upload allowlist + server-side mime-sniffing (`sharp`-based for images).
- Path-traversal guards in `ThemeEditorService` restrict file edits to the active theme's `src/**` and blocklists `node_modules`, `.env*`, `.git`, lockfiles.
- `POST /api/revalidate` on themes requires the shared `REVALIDATE_SECRET`.

## 8. Third-party integrations

| Integration | Module | Status |
| --- | --- | --- |
| Postgres | Prisma | required |
| SMTP | `@nestjs-modules/mailer` via `mail` module | required for password reset / invitations |
| Cloudflare R2 / AWS S3 / DigitalOcean Spaces | `media` module | optional, falls back to local `uploads/` |
| Google Analytics 4 | `analytics` module | optional |
| Khalti | `payments` module | for plugin / package purchases |
| OpenAI | `ai` module | for the AI Content Studio (Pro+) |

## 9. Where to look

- Backend entry: `backend/src/main.ts` → `app.module.ts`
- Frontend admin: `frontend/src/app/(admin)/dashboard/**`
- Theme scaffold reference: `docs/THEME_MANIFEST_SPEC.md`
- Migrations: none — schema is assembled from `prisma/modules/*.prisma` and pushed via `prisma db push`
- Docker: `docker-compose.yml` (dev + demo)
- CI scripts: `scripts/mero.js` (setup / reset / dev / dev:all / clean)
