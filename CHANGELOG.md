# Changelog

All notable changes to Mero CMS are documented here.

---

## [Unreleased]

### Changed (package matrix rebalance)
- **Personal/Org Premium** now includes Forms (builder + submission inbox) and Webhooks (Slack/Zapier-style event notifications). These were previously Pro+/Enterprise+ only and blocked the most common "contact form on my site" use case.
- **Personal Professional** gains `hasWhiteLabel: true`. Pro-tier Personal customers can now hide the "Powered by Mero" badge without needing to upgrade to Custom.
- **Personal Professional + Org Enterprise** theme cap changed from unlimited → **5**. Matches the "up to 5 themes from our portfolio" positioning.
- **Personal Custom + Org Custom** keep unlimited themes. Feature lists + taglines rewritten to emphasise custom development scope, integrations, and infrastructure rather than a specific theme-design deliverable.
- `PRICING.md` rewritten to reflect the above.
- `package-enforcement.guard` Forms/Webhooks error messages updated — they no longer claim those features are Pro-only.

### Security hardening
- Refresh-token rotation (new `RefreshToken` Prisma model), replay-detection kills the whole token family on reuse; access tokens shortened to 15 min.
- Forced-2FA-for-admins policy (`security_force_2fa_for_admins`) with dedicated `/two-factor-setup` enrolment page.
- Account lockout + session locking defaulted ON at setup time; admin unlock endpoint + button.
- `/settings` GET now requires `SETTINGS_VIEW`; login/register pages migrated to `/public/site-data`.
- `JWT_SECRET` + `WEBHOOK_SECRET_KEY` required at boot — no silent fallbacks.
- bcrypt normalised to 12 rounds everywhere.
- Public endpoint rate limits on `2fa/verify`, `register*`, `reset-password`, `/ai/generate`.
- Webhook SSRF check now resolves DNS and re-validates against the blocklist.
- CORS Vercel match anchored to subdomain boundary.
- Swagger `/api/docs` behind basic auth in production.
- Sensitive settings writes audit-logged with value redaction.
- `express.json` body limit dropped 10 MB → 2 MB (multipart uploads unaffected).
- Media `visibility=PRIVATE` + HMAC-signed `/uploads/private/` URLs.

### Removed
- `themes/marketing-theme/` — the Mero CMS marketing site theme.
- `themes/nimble/` — the Nimble analytics SaaS one-pager theme.
- `themes/northwind/` — the Northwind / QuickSpace business-consulting theme.
- `backend/force-seed.js`, `backend/fix-theme.js`, `backend/update-db.js` — one-off admin utility scripts tied to `marketing-theme` paths.
- The CMS now ships with an empty `themes/` directory. Customers install `mero-starter-theme` on setup, or upload / purchase their own themes. The theme-manifest spec at `docs/THEME_MANIFEST_SPEC.md` remains the authoring contract.

### Changed
- Package starterThemes arrays (Personal Premium + Org Premium) collapsed to `['mero-starter-theme']`.
- Docs (`PRODUCT.md`, `TECH.md`, `ARCHITECTURE.md`, `THEME_MANIFEST_SPEC.md`) rewritten to describe a BYOT (bring-your-own-theme) posture.
- `ARCHITECTURE.md` theme-frontend section simplified — single port 3002, single theme at a time, resolved dynamically from the CMS.
- `dev-theme.js` no longer hard-codes any bundled theme; it resolves the active theme from the CMS and falls back to `mero-starter-theme` when nothing is active.
- Seed demo audit-log entry switched from `northwind` to `mero-starter-theme` for a clean first-boot state.
- `package.json` workspaces trimmed to just `backend` + `frontend`.

---

## [1.4.0] — 2026-04-20

### Removed (repo cleanup)
- Eight one-off dev scripts that were never referenced from `package.json`, docs, or other code: `scripts/check-db-state.ts`, `scripts/create-project.js`, `scripts/debug-seo.js`, `scripts/fetch-pages.js`, `scripts/fetch-posts.js`, `scripts/fetch-projects.js`, `scripts/patch-post.js`, `scripts/setup-cms.js`.
- Root: `extract-docx.js` (one-off docx extraction tool, never invoked), `assembly_diag.log` (stale log).
- Stale artifacts: `dist/ktm-plots.zip` (from the removed theme), the empty `dist/` directory itself, `backend/prisma/schema.test.prisma` (unreferenced duplicate schema), `frontend/lint_output.txt` and `frontend/tsconfig.tsbuildinfo` (generated caches).

### Fixed
- Re-assembled `backend/prisma/schema.prisma` from the module files so the committed schema reflects the `plots` removal and the new `publishAt` fields on `Post` and `Page`. Without this, `npm run db:push` on a fresh install would have missed both changes.

### Added
- **Northwind theme** — a new multi-page premium theme for developer-tool / fintech SaaS brands. Based on the V1 dark-technical aesthetic from Claude Design's Enterprise Theme handoff (Supabase/Neon-inspired — `#3ecf8e` accent, Inter + JetBrains Mono, grid-patterned dark backgrounds, code cards, terminals). Ships with full routes: `/` (hero + logos + primitives + platform + stats + developers + CTA), `/about` (intro + principles grid + team grid), `/services` (catalog grid), `/services/[slug]` (detail), `/blog` (index), `/blog/[slug]` (detail with related posts), `/contact` (info block + lead form wired to `/public/leads`). All sections CMS-editable through `theme.json#pageSchema`.
- Northwind registered as a Premium starter theme alongside Nimble (marketing-theme retired in a later release).

## [1.3.0] — 2026-04-20

### Added
- **Nimble theme** — a new one-page premium SaaS / analytics marketing theme. Ships with twelve CMS-editable sections (hero with dashboard mock, features 3-up, phone split, donut split, integrations orbit, 4-up benefits, CTA illo card, stats band, full dashboard showcase, pricing, testimonials, blog list), an included `/blog` index, and a `/blog/[slug]` detail route. All copy, CTAs, and section data come from `theme.json` (`pageSchema` + `seedData`) so editors can change everything without touching code.
- **Catch-all CMS pages** in the Nimble theme at `/[slug]` so editors can add `/privacy`, `/terms`, etc. from the admin.
- **PRICING.md** rewritten to mirror the 8-slug Personal/Organizational × Basic/Premium/Professional|Enterprise/Custom matrix used in `backend/src/config/packages.ts`.

### Changed
- Personal Premium and Organizational Premium tiers now list `['mero-starter-theme', 'nimble']` as included starter themes at the time (replacing `ktm-plots`). Northwind was added to this list in a later release, and marketing-theme was retired subsequently.

### Removed
- **`ktm-plots` and `saas-pro` themes** — both were legacy/client-specific themes and have been deleted from `/themes`.
- **Backend `plots` module** — all real-estate plot endpoints, the `PlotsModule`, the `PlotsController`, the `PlotsService`, the `Plot` / `PlotCategory` Prisma models, and the `plots` entries in the public site-data aggregator, the public API (`/public/plots`, `/public/plots/:slug`, `/public/plot-categories`), the setup wizard's module registry, and the `PrismaService` convenience getters for `plot` / `plotCategory`.
- **`update-theme.js`** (root-level one-shot seed script for the marketing theme) — seed data now lives in each theme's own `theme.json`.

---

## [1.2.0] — 2026-03-29

### Added
- **Collections module** — Custom content schema builder with field types (text, textarea, richtext, number, boolean, date, image, select). Supports COLLECTION (multiple items) and SINGLETON (single record) types.
- **Collections schema builder UI** — `/dashboard/collections` page to create, edit, and delete collection schemas with a visual field builder.
- **Collection items UI** — `/dashboard/collections/[id]` page to manage items; smart singleton view vs. table view for multi-item collections.
- **Collections public API** — `GET /public/collections/:slug` and collections included in `GET /public/site-data` for themes.
- **Forms module** — Form builder backend (FormsService, FormsController) with `POST /public/forms/:id/submit` public endpoint.
- **Forms UI** — `/dashboard/forms` (schema builder) and `/dashboard/forms/[id]` (submissions viewer with expandable rows).
- **Theme `requiredCollections`** — Themes can declare collection schemas in `theme.json`; they are upserted on activation and optionally seeded with initial items from `seedData.collectionItems`.
- Collections and Forms added to setup wizard `OPTIONAL_MODULES` with labels and descriptions.
- Collections and Forms links added to admin sidebar.

### Fixed
- Lead submission field name (`originPage` instead of `source`) corrected in public controller.
- Orphaned `project` model references removed from sitemap service.
- TasksService cleaned up — removed invalid `NotificationsService` injection.

---

## [1.1.0] — 2026-03-26

### Added
- Blank theme as default built-in theme (replaces cms-starter).
- Delete action for uploaded themes.
- Demo app with Vercel protection markers.

### Removed
- Real-estate Plots module (client-specific — moved to ktm-plots v1.1.0 tag).
- PlotCategory module.
- All plots-related frontend pages, sidebar entries, and SEO references.

---

## [1.0.0] — Initial Release

### Core Features
- NestJS backend with Prisma ORM (PostgreSQL).
- Next.js 16 admin dashboard.
- JWT authentication with 2FA support, account lockout, password reset.
- Role-based access control with fine-grained permissions.
- Media library with folder organisation.
- Blog system: posts, categories, tags, comments.
- Pages, Menus, Site Settings.
- Team, Services, Testimonials, Leads modules.
- Theme system: ZIP upload, activation, seed data, module aliases.
- SEO: meta tags, redirects, sitemap, robots.txt.
- Analytics (GA4 integration).
- Audit log, email notifications, setup wizard.
