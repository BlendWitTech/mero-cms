# Changelog

All notable changes to Mero CMS are documented here.

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
