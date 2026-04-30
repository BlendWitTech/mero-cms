# Mero CMS — Technical Documentation

Last revision: April 2026 · v1.4.0

A practical reference for engineers working on or integrating with Mero CMS.

## 1. Tech stack

| Layer | Tech | Version |
| --- | --- | --- |
| **Backend runtime** | Node.js | 20+ |
| **Backend framework** | NestJS | 11 |
| **ORM** | Prisma | 5 |
| **Database** | PostgreSQL | 14+ |
| **Auth** | Passport + JWT + speakeasy (TOTP 2FA) | — |
| **Scheduling** | `@nestjs/schedule` | 6 |
| **Rate limiting** | `@nestjs/throttler` | 6 |
| **API docs** | `@nestjs/swagger` | 11 |
| **Image pipeline** | `sharp` | 0.34 |
| **Mail** | `nodemailer` via `@nestjs-modules/mailer` | — |
| **Object storage** | AWS SDK v3 (S3, R2, Spaces) | — |
| **Frontend admin** | Next.js 16 (App Router, Turbopack) | — |
| **Frontend styling** | Tailwind CSS v4 | — |
| **Rich text** | TipTap v3 | — |
| **Icons** | @heroicons/react + lucide-react | — |
| **Theme apps** | Next.js 16 (per theme, independent workspace) | — |
| **Package manager** | npm workspaces | — |
| **Containers** | Docker Compose (dev + demo) | — |

## 2. Repository layout

```
mero_cms/
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── auth/                # JWT, guards, permissions, 2FA
│   │   ├── users/ roles/ invitations/
│   │   ├── pages/ blogs/ menus/ media/ collections/ forms/ leads/
│   │   ├── team/ services/ testimonials/   # theme-scoped modules
│   │   ├── themes/ theme-editor/            # theme install + file editor
│   │   ├── packages/            # tier enforcement + license
│   │   ├── plugins/             # marketplace + install
│   │   ├── content-scheduler/   # publishAt cron
│   │   ├── analytics/ seo-meta/ redirects/ robots/ sitemap/
│   │   ├── settings/ audit-log/ notifications/ webhooks/ mail/ ai/
│   │   ├── demo/ public/ setup/
│   │   ├── payments/            # Khalti integration
│   │   └── config/packages.ts   # 8-slug pricing matrix + capabilities
│   ├── prisma/
│   │   ├── modules/*.prisma     # modular schema fragments
│   │   ├── schema.prisma        # assembled from modules at setup
│   │   ├── seed.ts / seed-starter.ts / seed-demo.ts
│   │   └── uploads/             # local media fallback
│   └── package.json
├── frontend/                    # Next.js admin
│   └── src/
│       ├── app/
│       │   ├── (admin)/dashboard/...
│       │   └── (site)/...
│       ├── components/          # UI + layout + admin
│       ├── context/             # Permissions/Modules/Capabilities/Settings/...
│       └── lib/                 # api client, permissions helper
├── themes/                      # customer-installed themes (empty at checkout)
├── scripts/                     # mero.js, dev-theme.js, build-schema.js, ...
├── docs/                        # the doc you're reading
├── tools/                       # internal (license key generator)
├── docker-compose.yml
├── package.json                 # workspaces root
└── update-theme.js              # (removed)
```

## 3. Module graph (backend)

All optional modules are loaded via a `when(key)(Module)` helper that returns `[]` when the key is absent from `ENABLED_MODULES`. Core modules (auth, users, roles, settings, media, themes, audit-log, mail, notifications, invitations, tasks) are always loaded.

Key cross-module dependencies:

```
app.module
  └── ScheduleModule · ThrottlerModule · PrismaModule (@Global)
  ├── AuthModule
  │     └── UsersModule ← RolesModule
  ├── SettingsModule ←→ PackagesModule  (forwardRef — license + admin-branding)
  │     └── PackagesService seeds /packages on boot
  ├── ThemesModule
  │     └── ThemesService — manages disk + active_theme setting
  ├── ThemeEditorModule
  │     └── gated with THEME_CODE_EDIT
  ├── PluginsModule
  │     └── gated with PLUGIN_MARKETPLACE
  ├── PaymentsModule
  │     └── used by PluginsModule (in-app purchase)
  ├── ContentSchedulerModule
  │     └── @Cron EVERY_MINUTE → flip SCHEDULED → PUBLISHED
  ├── BlogsModule ← SeoMetaModule ← MediaModule
  ├── PagesModule ← SeoMetaModule
  ├── FormsModule ← WebhooksModule ← MailModule
  ├── AnalyticsModule ← AuditLogModule
  └── PublicModule — aggregates read-only endpoints
```

## 4. API surface

### 4.1 Public (no auth)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/public/site-data` | site settings + menus + team + services + testimonials + pages (filtered by active theme) |
| GET | `/public/pages/:slug` | one page by slug |
| GET | `/public/posts` | paginated blog feed |
| GET | `/public/posts/:slug` | one post |
| GET | `/public/collections/:slug` | collection schema |
| GET | `/public/collections/:slug/items` | paginated items |
| GET | `/public/collections/:slug/items/:itemSlug` | one item |
| POST | `/public/leads` | contact-form submission (rate-limited) |
| POST | `/public/forms/:id/submit` | generic form submission (rate-limited) |
| GET | `/public/packages` | package catalog |
| GET | `/robots.txt`, `/sitemap.xml`, `/sitemap-posts.xml`, `/sitemap-index.xml` | SEO |
| GET | `/health` · `/health/live` | probes (DB + storage check) |

### 4.2 Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | rate-limited 10/min |
| POST | `/auth/register-invited` | redeem invite token |
| POST | `/auth/2fa/generate` / `/enable` / `/verify` | TOTP |
| POST | `/auth/change-password` / `/forgot-password` / `/reset-password` | rate-limited |
| GET | `/auth/profile` | current user |

### 4.3 Admin — content

Prefixed resources: `/pages`, `/blogs`, `/menus`, `/media`, `/collections`, `/content-items`, `/forms`, `/leads`, `/team`, `/services`, `/testimonials`, `/categories`, `/tags`, `/comments`.

Standard REST with permission guards (`content_view`, `content_create`, `content_edit`, `content_delete`). See `backend/src/auth/permissions.enum.ts` for the full list.

### 4.4 Admin — platform

| Path | Gate | Purpose |
| --- | --- | --- |
| `/packages/*` | role | view + activate package |
| `/packages/usage` | role | usage + limits + capabilities |
| `/plugins/*` | PLUGIN_MARKETPLACE | marketplace, install, purchase |
| `/themes/*` | THEMES_MANAGE | upload, install, activate |
| `/themes/upload` | + THEME_COUNT | only plans with unlimited theme slots |
| `/themes/reset` | THEMES_MANAGE | wipe content + settings (hardReset optional) |
| `/theme-editor/*` | THEME_CODE_EDIT | file tree, read/write, revalidate |
| `/webhooks/*` | WEBHOOKS | webhook config |
| `/audit-logs/*` | AUDIT_LOG | audit log |
| `/analytics/*` | ANALYTICS | in-app analytics |
| `/redirects/*`, `/api/robots` | SEO_FULL | premium SEO |
| `/settings/admin-branding` | DASHBOARD_BRANDING | org-enterprise admin branding |
| `/ai/generate` | AI_STUDIO | AI Content Studio |
| `/invitations` | TEAM_SIZE | bounded by plan team limit |
| `/media/upload` | STORAGE | bounded by plan storage limit |
| `/content-scheduler` | role | upcoming scheduled items |

Full Swagger UI at `GET /api/docs` when the app is running.

## 5. Package enforcement model

### 5.1 Capability map (static)

`backend/src/config/packages.ts` defines 8 packages with numeric + boolean capabilities:

```ts
interface PackageCapabilities {
  themeCount: number;           // -1 = unlimited
  pluginMarketplace: boolean;
  themeCodeEdit: boolean;
  visualThemeEditor: boolean;
  dashboardBranding: boolean;
  webhooks: boolean;
  collections: boolean;
  forms: boolean;
  analytics: boolean;
  auditLog: boolean;
  siteEditor: boolean;
  seoFull: boolean;
}
```

Presets `BASIC_CAPS` · `PREMIUM_CAPS` · `PROFESSIONAL_CAPS` · `ENTERPRISE_CAPS` · `CUSTOM_CAPS` wire each tier.

### 5.2 Guard

`PackageEnforcementGuard` (in `backend/src/packages/`) reads:
1. The active package (from `Setting.key = 'active_package_id'`).
2. Looks up `capabilities` via `getCapabilities(packageId)`.
3. Compares against the `@RequireLimit(PackageLimit.X)` metadata.
4. Throws `ForbiddenException` with a specific message when the gate fails.

### 5.3 Frontend mirror

`CapabilitiesContext` calls `GET /packages/usage` once on mount. `useCapabilities().has('featureName')` tells the UI whether to show a menu item, render a control, or swap in `<UpgradePrompt />`.

## 6. Theme system

### 6.1 theme.json

Declares:
- `slug`, `name`, `version`, `description`, `author`
- `requiredModules` — which optional backend modules to auto-enable
- `defaultSettings` — seed values for settings KV
- `pageSchema` — array of `{ slug, name, sections: [{ type, label, fields[], variants? }] }`
- `seedData` — pages (with pre-filled section data), menus, team, services, testimonials, posts
- `deployedUrl` — production URL (optional)
- `minTier` (optional) — refuse activation on lower tiers

### 6.2 Activation flow

1. Operator uploads theme ZIP (or uses built-in from `/themes/`) → `POST /themes/:name/activate`.
2. Whitelist check: theme must be in the active package's `starterThemes`.
3. `setActiveTheme`:
   - Writes the theme's `.env.local` with the CMS API URL.
   - Upserts `Setting { key: 'active_theme', value: slug }`.
   - Seeds all modules from `theme.json#seedData` (nested menu children via recursive create).
   - Writes default settings.
   - Dispatches `theme.activated` webhook.
4. `scripts/dev-theme.js` (running alongside backend in dev) polls `/public/site-data` every 4 s — when `activeTheme` changes, it kills the current theme process and starts the new one.

### 6.3 Theme-side helpers

Every Mero CMS theme follows a scaffold pattern (spec in `docs/THEME_MANIFEST_SPEC.md`):
- `src/app/layout.tsx` — injects CSS vars from settings, mounts `<EditorBridge/>`
- `src/lib/cms.ts` — fetch helpers with typed responses
- `src/lib/section-style.ts` — translates `_style` overrides to React styles
- `src/lib/widgets.ts` + `src/components/widgets/WidgetRenderer.tsx` — widget foundation
- `src/components/editor/EditorBridge.tsx` — Visual Editor protocol
- `src/components/sections/SectionRenderer.tsx` — maps pageSchema ids to React components

## 7. Visual Editor protocol

PostMessage-based, works across origins.

**Theme → admin:**
- `{ type: 'mero-editor:ready', mode: string }`
- `{ type: 'mero-editor:section-hover', sectionId: string }`
- `{ type: 'mero-editor:section-click', sectionId: string }`

**Admin → theme:**
- `{ type: 'mero-editor:scroll-to-section', sectionId: string }`
- `{ type: 'mero-editor:highlight', sectionId: string }`
- `{ type: 'mero-editor:reload' }`

Activation is gated by the `?editMode=<secret>` query param the admin iframe adds. In production the secret should equal `REVALIDATE_SECRET`.

## 8. Build & deploy

### 8.1 Local dev

```bash
npm install              # workspace install
npm run dev:db           # docker postgres
npm run prisma:generate  # regenerate Prisma client
npm run db:push          # sync schema to DB (prisma db push)
npm run db:seed          # optional — seed an admin user
npm run dev:all          # docker db + backend + frontend + active theme
```

Ports: `:3000` frontend, `:3001` backend, `:3002/3/4` themes.

### 8.2 Production build

```bash
npm run build    # backend: prisma generate && nest build ; frontend: next build
npm run start    # mero.js starter
```

### 8.3 Docker

`docker-compose.yml` has 4 services: db, backend, frontend, theme. Designed for single-node self-hosted deployments.

`docker-compose.demo.yml` is the multi-branch demo used for the Mero CMS marketing site.

### 8.4 Supported hosts

- Self-host with Docker — default.
- Railway — see `railway.json`.
- Vercel — see `vercel.json` (frontend + themes only; backend needs a server runtime).
- Render / Fly — follow the env vars in `.env.example`.
- Nixpacks — see `nixpacks.toml` for Railway builds.

## 9. Environment variables

| Var | Scope | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | backend | — | Postgres connection |
| `JWT_SECRET` | backend | — | signing |
| `CORS_ORIGIN` | backend | `*` | admin + theme origins |
| `CMS_API_URL` | theme | `http://localhost:3001` | API base for themes (SSR) |
| `NEXT_PUBLIC_CMS_API_URL` | frontend + theme | — | API base (client) |
| `NEXT_PUBLIC_SITE_URL` | theme | — | canonical site URL |
| `NEXT_PUBLIC_THEME_URL` | frontend | `http://localhost:3003` | Visual Editor iframe source |
| `NEXT_PUBLIC_REVALIDATE_SECRET` | frontend | `cms` | matches theme's REVALIDATE_SECRET for editMode |
| `REVALIDATE_SECRET` | theme | — | `POST /api/revalidate?secret=…` + editMode |
| `THEME_URL` | backend | `http://localhost:3003` | used by backend to ping theme's revalidate |
| `ENABLED_MODULES` | backend | `"all"` | comma-separated module keys |
| `SETUP_COMPLETE` | backend | `false` | gates the setup wizard |
| `SMTP_*` | backend | — | mail |
| `S3_*` / `R2_*` | backend | — | media cloud storage |
| `KHALTI_SECRET_KEY` | backend | — | payment provider |
| `OPENAI_API_KEY` | backend | — | AI Studio |

## 10. Testing

- Jest + Supertest baseline shipped — `.spec.ts` files next to the code.
- Example covered: `app.controller.spec.ts` (health probes with a mocked PrismaService).
- Run: `npm test -w backend`.

E2E tests and visual regression are roadmap items for v1.5 / v2.0.

## 11. Linting & formatting

- Backend: ESLint (NestJS preset), Prettier.
- Frontend: Next's built-in ESLint config.
- Commands: `npm run lint -w backend`, `npm run lint -w frontend`.

## 12. Observability

- `/health` returns DB + uploads probe with latency timings + version info. Returns 503 on failure so orchestrators can drain traffic.
- `/health/live` is a cheap liveness probe that always 200s.
- Winston-style console logs on backend (Nest default).
- No metrics or tracing yet; on the roadmap.
