# Mero CMS — Feature Inventory

Last revision: April 2026 · v1.4.0

A complete inventory of every feature in Mero CMS, split by where it lives. Use this as the canonical reference when answering "does Mero do X?", scoping a customer engagement, or deciding which docs to read for a given task.

This file is descriptive, not prescriptive — for design decisions and behaviour spec, see the linked deep-dive docs.

---

## Quick mental model

```
+-----------------------------+    +---------------------------+
|   THEME FEATURES            |    |   CMS FEATURES            |
|   (what visitors see)       |    |   (what the customer       |
|                             |    |    manages)               |
|   - Visible page rendering  |    |   - Authoring UI          |
|   - SEO + sitemap + robots  |    |   - User + role mgmt      |
|   - Forms / contact         |    |   - Billing + license     |
|   - Section components      |    |   - Plugin marketplace    |
|   - Visual design + brand   |    |   - Module enable/disable |
|   - Visitor analytics       |    |   - Theme gallery + edit  |
+-----------------------------+    +---------------------------+
       served at :3002                served at :3000
```

The split: themes render the customer's **public site** (consumed by their visitors); the CMS dashboard is the **management UI** (used by the customer's team). The backend at :3001 is the data + API layer that both share.

---

## Part A — Theme features

These are features the visitor experiences. Themes implement them; the CMS provides the data.

### A.1 Page rendering

| Feature | Notes |
|---|---|
| Static and dynamic pages | Pages declared in `theme.json` `pageSchema` map to `app/<slug>/page.tsx` routes. Content fetched from `/public/pages/:slug`. |
| Per-page section composition | Each page is a list of `sections`, each with a `type` and `data`. Theme renders a component per type. |
| Multiple page templates | A theme can declare `home`, `pricing`, `features`, `about`, `blog`, `contact`, custom routes — anything as long as it's listed in `pageSchema`. |
| Blog index + post detail | Driven by `/public/posts` (paginated) and `/public/posts/:slug`. |
| Custom collections (Pro+) | `/public/collections/:slug` returns metadata + items. Theme can render any custom content type the customer's tier allows. |
| 404 + error pages | Standard Next.js conventions — `not-found.tsx`, `error.tsx`. |
| ISR caching | Each page declares `revalidate` (seconds). `apiFetch` accepts `tag` for selective invalidation when admin edits content. |

### A.2 SEO + discoverability

| Feature | Notes |
|---|---|
| Per-site SEO defaults | `meta_description`, OpenGraph title/description, favicon, all from CMS branding settings. |
| Per-page SEO overrides | Admin can override title/description/OG image per page. Pulled by theme from `/seo-meta/:pageType/:pageId`. |
| `sitemap.xml` | Auto-generated from `getPosts()` + `siteData.pages` + theme's static routes. |
| `robots.txt` | Standard rule set; reads `siteUrl` from CMS settings. |
| Edge redirects | `middleware.ts` calls `/redirects/check/:path`; admin manages rules. |
| Schema.org / structured data (Premium+) | When `seoFull` capability is on, theme emits JSON-LD for Article, Organization, etc. |
| Canonical URLs | Theme reads `siteData.settings.siteUrl` and emits canonical link tags. |

### A.3 Forms and lead capture

| Feature | Notes |
|---|---|
| Single contact form (Basic+) | `<ContactForm>` posts to `/public/leads`. Spam-rate-limited to 10 req/min/IP. |
| Custom form-builder (Premium+) | Customer designs forms in admin; theme renders them via `<ContactForm formId={id} />` posting to `/public/forms/:id/submit`. |
| Demo signup as lead capture | The marketing theme's `/signup` flow creates a workspace user AND a lead with `source: 'demo-signup'` so sales can follow up. |
| Cloudflare Turnstile (plugin) | Drop-in bot protection across every form. |

### A.4 Branding and design

| Feature | Notes |
|---|---|
| 16-key branding contract | Theme declares which CSS variables it respects in `theme.json` `brandingFields`. Admin renders only those controls. |
| Live brand sync | Customer changes a color in admin → theme's next request shows the new color. No rebuild. |
| Per-theme typography | Heading + body fonts configurable from a theme-allowlisted font set. Auto-loads as CSS variables. |
| Layout density | Compact / Comfortable / Spacious — drives a `--density` factor scaling spacing tokens. |
| Border radius scale | Theme declares max radius; customer picks from theme-allowlisted options. |
| Light/dark by visitor preference | Theme decides; not all themes support both. Admin doesn't impose a choice. |

### A.5 Visitor authentication (limited)

Themes generally don't authenticate visitors — Mero is a CMS, not a community platform. Exceptions:

| Feature | Notes |
|---|---|
| Demo signup | Marketing theme has `/signup` to create a free workspace + capture as lead. |
| Login pass-through | `/login` posts to backend `/auth/login` and redirects to `/admin`. Theme is just the form. |
| Member-gated content (planned v1.5) | Section-level visibility based on a logged-in visitor's tier. |

### A.6 Theme-side analytics integration

| Feature | Notes |
|---|---|
| Google Analytics 4 | When `googleAnalyticsId` is set in CMS settings, theme injects GA4 script in `<head>`. |
| In-app analytics tracker (Pro+) | Theme can post page-view events to `/analytics/events` for the dashboard's top-pages panel. |
| OpenGraph + Twitter Cards | Auto-emitted from page metadata. |

### A.7 Visual editor support

| Feature | Notes |
|---|---|
| `EditorBridge` component | Mounts in theme's layout, no-op until `?editMode=1`. Then enables click-to-edit. |
| Section-level edit | Element with `data-section-id` triggers admin's section editor on click. |
| Field-level edit (inline) | Element with `data-editable="title"` enables direct inline editing. |
| Section variants | Theme declares variants in `theme.json` `designs[].sectionVariants`. Admin picker swaps `_variant` in section data. |
| Live content preview | Admin sends `mero-content-update` postMessage; theme updates the DOM without reload. |

---

## Part B — CMS features

These are features the customer's team uses to manage their site.

### B.1 Authoring and content

| Feature | Notes |
|---|---|
| Page editor | Drag-and-drop section composition; reads from theme's `pageSchema`. Per-section field forms from `moduleSchemas`. |
| Blog post editor | Rich text, categories, tags, scheduled publishing, status (draft/published/archived). |
| Site Pages list | All pages with their slug, type, edit status. Empty-state handled cleanly. |
| Categories + tags | Standard taxonomies for blog. |
| Comments (Pro+) | Moderated, threaded, can be auto-approved or held. |
| Collections / custom content types (Pro+) | Define an arbitrary schema; CMS generates an editor for it. |
| Media library | Upload, organize into folders, search, alt text, used-where lookups. PUBLIC vs PRIVATE access. |
| Content scheduler | Posts can be scheduled to publish at a future date. Background task runs every minute. |

### B.2 Site configuration

| Feature | Notes |
|---|---|
| Branding settings (contract-driven) | Renders only fields the active theme declares. Saves propagate live. |
| Identity (title, tagline, logo, favicon, copyright) | Standard. |
| Color palette (primary, secondary, accent, body, heading, link, muted) | All exposed as CSS variables to theme. |
| Typography (heading + body fonts, base size, weights) | Allowlisted per theme. |
| Layout (border radius, density) | Allowlisted per theme. |
| Menus (main nav, footer columns, custom) | CMS-managed; nested children supported. Theme reads via `/menus/slug/:slug`. |
| Social links | Per-platform fields (Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok, WhatsApp). |
| Contact info (email, phone, address) | Surfaced to theme via `getSiteData()`. |
| White-label (Pro+) | Hides "Powered by Mero". |
| Dashboard branding (Org Enterprise+) | Customizes the admin UI itself — primary, accent, fonts, logo. |

### B.3 SEO + delivery

| Feature | Notes |
|---|---|
| Per-page SEO meta | Title, description, OG image, robots tags, canonical override. |
| Edge redirects | Source path → destination, with status code. Wildcards supported. |
| Sitemap generation | Auto-built from posts + pages + static routes; theme exposes at `/sitemap.xml`. |
| Robots policy | Standard config; admin can edit if needed. |
| Site URL setting | Drives sitemap/robots/canonical URLs. Configured in admin, not env. |

### B.4 Users, roles, permissions

| Feature | Notes |
|---|---|
| Role-based access control | Owner, Admin, Editor, Author, Contributor, Custom roles. |
| Per-permission gating | 30+ granular permissions (content_create, content_edit, leads_view, settings_edit, etc.). |
| User invitations | Email-based, expires after 7 days. |
| Two-factor auth | TOTP-based, optional per user. |
| IP whitelisting | Per-user; locks login to specific IPs. |
| Session revocation | Admin can revoke any active session. |
| Audit log (Premium+) | Every settings change, login, content edit recorded with user + timestamp + metadata. |
| Custom roles (Pro+) | Customer defines new roles with arbitrary permission combinations. |

### B.5 Forms and leads

| Feature | Notes |
|---|---|
| Lead inbox | List of all `/public/leads` submissions with email, name, phone, message, source. |
| Lead status (new, contacted, converted, lost) | Manual transitions. |
| Lead search + filter | By email, status, date range, source. |
| Form-builder UI (Premium+) | Drag-and-drop fields; per-field validation; conditional logic. |
| Form submissions inbox | Per-form submission lists. CSV export. |
| Webhook notifications (Premium+) | Slack ping on new lead, Zapier trigger on form submit, etc. |

### B.6 Plugin marketplace

| Feature | Notes |
|---|---|
| Browse marketplace | Card grid of available plugins, filtered by category, featured, tier badge. |
| Dual-gate compatibility | Tier × theme. Per-card banner shows what's blocking install with remediation links. |
| Free + paid plugins | Free: one-click install. Paid: Khalti/Stripe/eSewa checkout, then auto-install. |
| Toggle installed plugins on/off | Without uninstalling. Useful for testing. |
| Plugin license keys | Issued at purchase time; stored with the install record. |

### B.7 Themes

| Feature | Notes |
|---|---|
| Theme gallery | Every theme in `themes/` directory shown with preview image. Filtered by `websiteType` and `minPackageTier`. |
| Theme upload (custom) | ZIP upload; admin extracts, reads manifest, registers. |
| Activate / switch | Activating a theme enables its required modules and seeds default content (FRESH on first install, LEGACY on switch-back). |
| Visual editor (Pro+) | Iframe + click-to-edit; reads sectionVariants from theme.json. |
| Code editor (Premium+) | In-admin Monaco editor for theme files; saves via API. |
| Theme catalog page | Marketing-facing list of available themes (planned v1.5). |

### B.8 License + billing

| Feature | Notes |
|---|---|
| License key paste / replace | In Settings → License. Verifies JWT signature, decodes tier, persists. |
| Active tier display | Card shows current tier, expiry, days remaining, seats. |
| Capability checklist | Visual list of every capability with green-check or grey-lock per item. |
| Tier upgrade nudge | "Available on Premium" upsells with link to pricing. |
| Maintenance subscription | Annual fee for security patches + updates. Optional. |
| Plan usage view | In Settings → Billing — storage used, page count, user count vs. limits. |
| Order history (planned v1.5) | List of all license purchases, plugin purchases, cloud subscriptions. |

### B.9 Setup and ops

| Feature | Notes |
|---|---|
| First-run setup wizard | 6 steps: Welcome → Database → Domain → Admin user → License → Theme & Modules → Done. |
| Database wizard step | Test connection, save to setup.json, run migrations. PostgreSQL only currently. |
| Module enable/disable | Customer picks which optional CMS modules to install. Schema rebuilt accordingly. |
| Auto-generated secrets | JWT_SECRET + WEBHOOK_SECRET_KEY auto-write to `secrets.json` on first boot. Customer never edits .env. |
| Cache flush | "Clear theme cache" button invalidates ISR for the active theme. |
| Health checks | `/health` endpoint returns status of DB, Redis (if configured), email, etc. |

### B.10 Analytics dashboard

| Feature | Notes |
|---|---|
| KPI strip (all tiers) | 8 cards across two rows: Pages, Posts, Leads (30d), Comments, Team, Media files, Storage, Active plan. |
| Leads-over-time chart (Premium+) | 30-day line chart of new leads/day. |
| Content velocity chart (Premium+) | 12-week bar chart of posts published per week. |
| Top pages by views (Pro+) | Pages ranked by visit count, last 30 days. |
| Recent activity feed | Last 10 events: leads, comments, settings changes, plugin installs. |
| Permission-gated cards | Each card hides for users without the matching permission. |

### B.11 Email

| Feature | Notes |
|---|---|
| SMTP integration | Standard SMTP; admin configures host, port, user, pass. |
| Resend integration | API-key based; recommended for production. |
| Transactional emails | Welcome, password reset, invitation, lead notification, license delivery. |
| Email templates | Hardcoded; customer can override via settings (planned v1.5: WYSIWYG template editor). |

### B.12 Payments

| Feature | Notes |
|---|---|
| Multi-provider support | Stripe (global), Khalti (Nepal), eSewa (Nepal). Auto-detects which are configured via env. |
| Order tracking | Every purchase creates an Order row. Status: pending → paid / failed / cancelled / refunded. |
| Webhook signature verification | Per-provider HMAC-SHA256 validation. |
| License auto-issuance | On successful order, JWT signed and stored on Order; success page shows it. |
| Plugin purchase flow | Same Order pipeline; plugin auto-installs after verify. |
| Manual refund tooling (planned v1.5) | Admin Settings → Billing → Refund. |

### B.13 Mero Cloud (managed hosting)

| Feature | Notes |
|---|---|
| Three cloud tiers | Starter, Business, Scale. Sold annually. |
| Marketing pricing surface | Pricing page shows the cloud table below CMS license tiers. |
| Provisioning (planned v1.5) | Spin up managed Postgres + storage + DNS + SSL on order. |
| Migrate to cloud (planned v1.5) | One-click from self-hosted; content moves with the customer. |

---

## Part C — Tier matrix at a glance

What every tier includes. See [PACKAGE_DEVELOPMENT.md](./PACKAGE_DEVELOPMENT.md) for prices and the canonical capability table.

| Capability | Basic | Premium | Pro / Enterprise | Custom |
|---|---|---|---|---|
| Page rendering, blog, basic SEO | ✓ | ✓ | ✓ | ✓ |
| Single contact form + lead inbox | ✓ | ✓ | ✓ | ✓ |
| Site editor (drag-drop pages, full SEO suite) | — | ✓ | ✓ | ✓ |
| Form-builder + multi-form management | — | ✓ | ✓ | ✓ |
| Webhooks | — | ✓ | ✓ | ✓ |
| Audit log | — | ✓ | ✓ | ✓ |
| Analytics + dashboard charts | — | ✓ | ✓ | ✓ |
| Plugin marketplace | — | ✓ | ✓ | ✓ |
| Code-level theme editing | — | ✓ | ✓ | ✓ |
| Visual theme editor | — | add-on | ✓ | ✓ |
| Custom collections | — | — | ✓ | ✓ |
| White-label (hide Powered by Mero) | — | — | ✓ | ✓ |
| API access (REST + scoped keys) | — | — | ✓ | ✓ |
| AI Studio | — | — | ✓ | ✓ |
| Custom roles | — | — | ✓ | ✓ |
| Dashboard branding (white-label admin UI) | — | — | Org Enterprise only | ✓ |
| Custom development scope, dedicated infra | — | — | — | ✓ |
| On-premise option | — | — | — | ✓ |
| Theme count | 1 | 3 | 5 | unlimited |
| Storage (Personal) | 5 GB | 20 GB | 100 GB | unlimited |
| Storage (Org) | 20 GB | 50 GB | 200 GB | unlimited |
| Team seats (Personal) | 1 | 3 | 5 | unlimited |
| Team seats (Org) | 3 | 10 | unlimited | unlimited |
| Support | Email | Priority | Dedicated | Dedicated 24/7 |

---

## Part D — Where each feature lives in the code

| Feature | Code location |
|---|---|
| Theme rendering | `themes/<slug>/src/app/` and `themes/<slug>/src/components/sections/` |
| Branding contract injection | `themes/<slug>/src/app/layout.tsx` (build CSS) + `globals.css` (token defaults) |
| Visual editor bridge | `themes/<slug>/src/components/EditorBridge.tsx` |
| Capability provider | `themes/<slug>/src/components/CapabilitiesProvider.tsx` (theme), `frontend/src/context/CapabilitiesContext.tsx` (admin) |
| Page composition | `themes/<slug>/theme.json` `pageSchema` + `moduleSchemas` |
| Authoring UI | `frontend/src/app/(admin)/dashboard/` (per-route directory) |
| Sidebar nav | `frontend/src/components/layout/Sidebar.tsx` |
| Settings tabs | `frontend/src/app/(admin)/dashboard/settings/page.tsx` + `frontend/src/components/admin/*Tab.tsx` |
| Branding admin | `frontend/src/components/admin/ContractBrandingTab.tsx` |
| License admin | `frontend/src/components/admin/LicenseSettingsTab.tsx` |
| Analytics dashboard | `frontend/src/components/dashboard/DashboardAnalytics.tsx` |
| Plugin marketplace UI | `frontend/src/app/(admin)/dashboard/plugins/page.tsx` |
| Plugin catalog | `backend/src/plugins/catalog.ts` |
| Package config | `backend/src/config/packages.ts` |
| License signing | `backend/src/packages/license.service.ts` |
| Payment providers | `backend/src/payments/providers/*.ts` |
| Order lifecycle | `backend/src/payments/payments.service.ts` |
| Module schema fragments | `backend/prisma/modules/*.prisma` |
| Schema build script | `scripts/build-schema.js` |

---

## Part E — Documentation cross-reference

| Want to learn about | Read |
|---|---|
| Why Mero exists, who it's for | [PRODUCT.md](./PRODUCT.md) |
| How the three services fit together | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Database schema, migrations, indexes | [DATABASE.md](./DATABASE.md) |
| Tech stack, deployment, build pipeline | [TECH.md](./TECH.md) |
| Customer install + setup wizard | [SETUP.md](./SETUP.md) |
| Build a theme | [THEME_DEVELOPMENT.md](./THEME_DEVELOPMENT.md), [THEME_MANIFEST_SPEC.md](./THEME_MANIFEST_SPEC.md) |
| Build admin features | [DASHBOARD_DEVELOPMENT.md](./DASHBOARD_DEVELOPMENT.md) |
| Add a tier or change pricing | [PACKAGE_DEVELOPMENT.md](./PACKAGE_DEVELOPMENT.md) |
| Build a plugin | [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md) |
| What's in this release | This file |

---

## Changelog

- **v1.4.0** (2026-04) — Initial feature inventory. Reflects post-pricing-rebalance state: forms in Basic, single tier prices, dashboard analytics, contract-driven branding, dual-gate plugin compatibility, multi-provider payments, Mero Cloud add-on tiers.
