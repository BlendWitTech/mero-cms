# Mero CMS — Product Document

Last revision: April 2026 · v1.4.0

## 1. What it is

Mero CMS is a **self-hosted, one-time-licence content management system** built in Nepal for creators and businesses worldwide. Customers pay once, own their deployment forever, and get a premium CMS experience with pre-built themes, AI content tools, and a tier-gated visual page builder.

Think: WordPress's flexibility + Framer's design quality + Supabase's developer experience — licensed per deployment, no recurring fees, full source on your own servers.

## 2. Problem it solves

The CMS market has two painful extremes:

- **WordPress** — flexible and cheap, but aging, plugin-soup security issues, heavy, and dated templates.
- **Webflow / Framer / modern SaaS CMSs** — beautiful, fast, but SaaS-only, locks content into their infrastructure, monthly fees that compound forever, and often requires you to learn their DSL.

Businesses running a marketing site, a personal brand, or an agency portfolio often need:

1. A modern, good-looking site out of the box.
2. Full editorial control of content.
3. Their data in their own database.
4. A sensible pricing model that doesn't punish growth.
5. Professional polish (SEO, analytics, scheduling, audit logs, RBAC).

Mero CMS targets customers for whom all five matter.

## 3. Who it's for

### 3.1 Personas

**"Solo Siya" — personal brand**
Freelance designer in Kathmandu. Needs a portfolio + blog. Wants a one-time purchase, not a monthly bill. Wants to pick a theme, write posts, and not worry about maintenance.
Fits: **Personal Basic (NPR 20k)** or **Personal Premium (NPR 35k)**.

**"Agency Amit" — small agency**
Builds sites for clients in South Asia. Needs to ship many flavours of marketing sites, own the code, and occasionally customize per-client. Wants to bundle licences into his client work.
Fits: **Personal Professional (NPR 65–85k)** per deployment, or Enterprise for larger clients.

**"Startup Priya" — Series A company**
CTO at a SaaS company. Needs a professional marketing site, blog, plus content scheduling and analytics. Team of 6 content editors. Wants SSO, audit log, and the ability to hand a sandboxed CMS to marketing without them breaking things.
Fits: **Organizational Premium (NPR 60–80k)** or **Enterprise (NPR 100–150k)**.

**"Enterprise Raj" — large org / NGO / government**
Runs a division of a bank, an NGO, or a ministry. Needs white-labeling, custom branded admin, locked-down RBAC, a custom theme, SOC2-ready posture, and dedicated support.
Fits: **Organizational Enterprise (NPR 100–150k)** or **Custom (NPR 185k+)**.

### 3.2 Geography

Primary: Nepal + South Asia (USD equivalents available). Secondary: global English-speaking markets that value the one-time-licence model. Khalti is the default payment provider with Stripe on the roadmap.

## 4. Value proposition by tier

### Personal Basic — NPR 20,000
Essential tools for individuals.
1 starter theme · blog · menus · basic settings · basic SEO · 5 GB · email support.
_No plugin marketplace._

### Personal Premium — NPR 35,000 (recommended)
Power users.
3 themes · plugin marketplace · complete SEO suite · analytics · audit log · full site editor · 20 GB · priority support.

### Personal Professional — NPR 65k–85k
Agencies & developers who need to customize.
Custom theme + code-level theme editing + visual theme editor with component swap + webhooks + collections + forms + in-app analytics dashboard + 100 GB · dedicated support.

### Personal Custom — NPR 100k+
Contractual, fully tailored: unlimited themes, custom development scope, custom integrations, on-premise option, 24/7 support.

### Organizational Basic — NPR 35,000
Same as Personal Basic but for small orgs (20 GB, 3-seat team).

### Organizational Premium — NPR 60k–80k (recommended)
The SaaS-company tier. Same as Personal Premium but 50 GB + 10-seat team.

### Organizational Enterprise — NPR 100k–150k
Custom theme + visual + code editor + **admin dashboard branding** (colour + font of the admin UI itself) + 200 GB + unlimited team.

### Organizational Custom — NPR 185k+
White-label, on-premise, SLAs, 24/7, training.

## 5. Feature matrix

### 5.1 Content editing (all tiers)

- WYSIWYG blog post editor (TipTap) — headings, lists, images, links, tables, code blocks.
- Menu builder — nested 2-level navigation with drag-reorder.
- Media library — per-folder organisation, S3/R2/local storage, Sharp image pipeline (WebP + multiple sizes).
- Content scheduling — pick a future date, cron auto-publishes.
- Page sections editor — toggle, reorder, edit content of theme-declared sections.

### 5.2 Themes (all tiers)

- The CMS ships without bundled themes. Customers activate `mero-starter-theme` after install, or upload / purchase their own. Theme authors follow `docs/THEME_MANIFEST_SPEC.md`.
- Each theme is a standalone Next.js app, owned by the customer after purchase.
- Themes declare their editable sections in `theme.json` → the CMS generates a form-based editor.

### 5.3 Visual Builder (Pro+)

Pro tier unlocks the three-pane page builder:
- **Visual Editor** (`/dashboard/themes/visual-editor`): click any section in a live iframe → its editor opens on the right.
- **Component variants**: themes can declare multiple versions of the same section (e.g. Hero-Dashboard vs Hero-Minimal). A dropdown swaps them.
- **Per-section style controls**: padding / background / text color / font scale on every section, stored as `_style` overrides.
- **Widget library** (v1 foundation): Heading + Spacer widgets placeable on any section. More coming (Image, Button, Columns, Rich Text, etc.).

### 5.4 Design tokens (Premium+)

- Global typography scale (`text-sm`/`base`/`lg`/`xl`/`2xl`/`3xl`).
- Global spacing scale (`space-1` … `space-8`).
- Primary / secondary / accent colours + heading/body fonts.
- Exposed to themes as CSS variables, so updating a token cascades instantly.

### 5.5 Code editor (Pro+)

File-tree + textarea editor over the active theme's `src/**`. WordPress-style. Blocks `.env*`, `node_modules`, `.git`, lockfiles. 1 MB read / 500 KB write caps. Every save audit-logged and triggers a theme revalidation ping.

### 5.6 Plugin Marketplace (Premium+)

Curated catalog of free and paid plugins:
- Advanced Analytics (funnels, cohorts)
- SEO Boost (schema, sitemaps)
- Newsletter Kit (Mailchimp, Buttondown)
- Cloudflare Turnstile (bot protection, free)
- Stripe Checkout
- AI Alt Text Generator
- Multilingual Lite
- Backup Scheduler (S3/R2, free)

Paid plugins purchased in-app through the existing payments module. Future v2.0 feature: remote registry with third-party publishers.

### 5.7 SEO (all tiers)

- Meta titles + descriptions on every page and post (Basic).
- Redirects manager, robots.txt editor, sitemap config (Premium+).
- Schema markup via SEO Boost plugin.

### 5.8 Analytics (Premium+)

Built-in Google Analytics 4 integration. Dashboard widgets: page views, top pages, sources. Pro+ can unlock in-app analytics plugin for funnels and cohorts.

### 5.9 Audit log (Premium+)

Every admin write is logged with user id, action, payload. Retention configurable. Exportable.

### 5.10 RBAC (all tiers)

Permissions enum covers: users, roles, content, media, settings, audit, analytics, SEO, themes. Pre-built roles: Super Admin, Editor, Writer, Viewer. Pro+ supports fully custom roles.

### 5.11 AI Content Studio (Pro+)

One-click generation for: blog posts, meta descriptions, product descriptions. Uses customer's own OpenAI / Anthropic key.

### 5.12 White-label & admin branding

- **Org Enterprise only**: customize the colours and fonts of the admin UI itself so it matches the customer's brand.
- **Custom tiers**: remove "Powered by Mero CMS" branding.

## 6. User flows

### 6.1 First-time setup

1. Customer receives the repo + licence key.
2. `npm install` (root).
3. Brings up Postgres via Docker.
4. `npm run db:push` — schema created from `prisma/modules/*.prisma`.
5. `npm run dev:all` — services boot.
6. Visit `http://localhost:3000/setup`, paste the licence key, create the admin, pick which optional modules to enable.
7. Pick a starter theme.
8. Write content. Publish.

### 6.2 Content editor flow (every day)

1. Log into `/dashboard`.
2. Sidebar: Content → All Posts. New Post. Write in TipTap. Save as SCHEDULED for tomorrow 9am → cron publishes it.
3. Site Pages → Home → tweak the hero copy. Save.
4. Media → drag + drop images. Sharp optimizes to WebP.

### 6.3 Designer flow (Pro+)

1. Theme → Visual Editor.
2. Click hero in the preview → editor opens on the right.
3. Section → Design tab → bump top padding to 120, change background colour.
4. Section → Content tab → swap "Hero with Dashboard Mock" variant to "Hero Centered Minimal".
5. Save. Preview repaints.
6. Theme → Customize → bump `--space-6` from 32 to 48 — every section using it expands globally.

### 6.4 Plugin purchase flow

1. Plugins → Marketplace → pick a paid plugin.
2. Click Purchase → Khalti flow.
3. On success, backend issues a `PLG-<slug>-<random>` licence key and installs.
4. Plugin appears under Installed; toggle on/off.

### 6.5 Team onboarding

1. Users → Invite. Send email.
2. Team member clicks magic link → sets password → RBAC role applied.
3. Audit log tracks everything from that point.

## 7. Competitive landscape

| Product | Pricing model | Strength | Weakness vs Mero |
| --- | --- | --- | --- |
| **WordPress** | Free + hosting + plugins | Huge ecosystem, familiar | Plugin-soup security, dated templates, slow by default |
| **Webflow** | $23–235/mo per site | Visual builder | SaaS lock-in, monthly fees compound, content lives with Webflow |
| **Framer** | $15–45/mo per site | Beautiful output | SaaS lock-in, weak CMS surface |
| **Ghost** | $9–199/mo hosted or self-host free | Publication focus | Thin for marketing sites, no built-in page builder |
| **Sanity / Contentful** | $99+/mo | Great structured content + APIs | No visual editor, devs required |
| **Payload CMS** | Free OSS + hosting | Flexible, Node-based | No included themes, no page builder |

Mero's wedge: **premium visual output + one-time licence + self-host + pre-built themes + tier-gated builder**. WordPress price sensibility, Framer design, Sanity-level structure — all owned.

## 8. Product roadmap

### Shipped (v1.4)

- Eight-tier package matrix with full enforcement
- Theme manifest system — BYOT (bring-your-own-theme) with compat declarations
- Visual Theme Editor — inline click-to-edit
- Section variants (component swap)
- Per-section style controls (Design tab)
- Global design tokens (typography + spacing)
- Widget library v1 (Heading + Spacer)
- Code-level theme editor
- Plugin Marketplace + in-app purchase
- Admin dashboard branding (Org Enterprise)
- Content scheduling (publishAt + cron)
- Audit log, analytics, SEO, webhooks, collections, forms
- Sharp image pipeline, TipTap editor
- Throttler, Swagger, Jest baseline
- Health check with DB + storage probes

### v1.5 — i18n (next)

- Locale field on content models.
- Locale-aware public API.
- Admin language switcher (start with English, Nepali).

### v2.0 — Platform

- **Widget library expansion** — Image, Button, Rich Text, Columns, Spacer, Video, Embed, Divider, HTML.
- **Drag-from-palette** — drag widgets from a left rail onto the canvas in the Visual Editor.
- **Theme marketplace** — remote registry with third-party themes.
- **Plugin SDK** — hook system for plugins to register sidebar entries, section types, form fields.
- **`create-mero-app` CLI** — scaffold a new deployment in one command.
- **White-label client portal** — multi-client management for agencies.
- **E-commerce module** — product catalogue, Stripe checkout, order management.
- **60% test coverage.**

### v3.0 — SaaS option

Optional Mero-hosted version for customers who don't want to self-host but still want the one-time-licence model — buy a licence, we host it on AWS with an SLA.

## 9. Pricing philosophy

- **One-time purchase, lifetime ownership.** No subscriptions. A customer who bought Premium in 2026 can run it in 2036 without paying again.
- **Support is optional and time-boxed.** One year of priority / dedicated support included in the price; renewable separately if they want it.
- **Upgrades are additive.** Premium → Professional = pay the difference. Plugin purchases are separate.
- **NPR-first pricing.** The target market is Nepalese and South Asian customers with Khalti as the default payment provider. USD equivalents are available for global customers (roughly 1 USD = 130 NPR).

## 10. What Mero CMS is NOT

- **Not a headless-only CMS.** It ships with full themes out of the box. Power users can use it headlessly via `/public/*` but most users will pick a theme.
- **Not WordPress-plugin-compatible.** The plugin system is ours.
- **Not a Webflow replacement for complex marketing campaigns.** The visual builder covers marketing sites, blogs, and static pages — not full Webflow-level interactive landing pages (yet).
- **Not a multi-site / multi-tenant platform in v1.** One deployment = one site. Multi-site is in v2.0's white-label client portal.

## 11. Support matrix

| Tier | Support |
| --- | --- |
| Basic | Email, business hours, 1 year |
| Premium | Priority email, 24-hour response, 1 year |
| Professional / Enterprise | Dedicated Slack channel, 2-hour response, 1 year |
| Custom | 24/7 priority, dedicated solutions engineer |

## 12. Open questions on the roadmap

- Multi-language: ship as a plugin (Multilingual Lite) or bake into core?
- Multi-site: separate product or white-label v2.0 feature?
- App marketplace for integrations (Segment, HubSpot, Salesforce) — core or plugins?

## 13. Success metrics

- **Activation**: % of customers who publish ≥5 pages within 14 days of purchase.
- **Feature adoption**: % of Pro+ customers who use the Visual Editor within 30 days.
- **Retention**: % of customers still running the CMS a year after purchase (measured via opt-in telemetry).
- **Support cost**: hours of support per customer per month — aim < 30 min avg.
- **ARPU uplift**: % of Basic customers who upgrade to Premium within 12 months — target 25%.
