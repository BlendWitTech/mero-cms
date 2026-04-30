# Mero CMS — Partner Agency Guide

You're an agency, freelancer, or design studio that wants to ship sites on Mero CMS. This guide is the onboarding pack: what Mero is, where it fits in your service mix, and a step-by-step from "you got a customer" to "you shipped a site they can edit".

If you only read one thing, read **[Section 4 — The Tier-2 build, end to end](#4-the-tier-2-build-end-to-end)**. The rest is supporting context.

---

## 1. What Mero is (in 90 seconds)

Mero CMS is a **self-hosted, one-time-license CMS** for SMBs. The customer pays once, you (or they) host it, and the site stays theirs forever — no monthly SaaS lock-in, no surprise rate hikes when a competitor closes a Series B.

Architecturally:

- **Backend** — NestJS + PostgreSQL + Prisma. Ships with site settings, pages, blogs, menus, media library, leads, forms, multi-user auth, plugin marketplace, license management.
- **Frontend admin** — Next.js 15 dashboard with a visual editor (Elementor-style click-to-edit), branding controls, analytics, SEO, plugin store.
- **Theme** — Next.js 15 App Router site that renders public traffic. Themes pull data from the backend's public API and are 100% customisable.

The thing you ship to a customer is **your branded theme**, hooked up to the customer's Mero install. Mero handles the boring stuff (auth, DB, media, forms, deploys); you handle the brand expression.

## 2. The four tiers, and where the work is

| Tier | Customer pays for | Who builds the site | Where you fit |
| --- | --- | --- | --- |
| **Basic** | Pre-built template, swap branding only | Customer (DIY) | Not your job. |
| **Premium** | Visual editor, swap content + media + colours | Customer (DIY) | Not your job. |
| **Professional / Enterprise** | Visual editor + Pro widgets + plugin marketplace | Customer mostly DIY | Light theming if they ask. |
| **Custom (Tier 2)** | A bespoke theme built for their brand | **You** | This is the gig. |

Tier-2 is where partner agencies make money. Customer comes in saying "we want a Mero site that looks like *us*", you build a theme, deploy it, hand them the keys, and they edit content themselves through the visual editor from then on.

Pricing this engagement is up to you — typical range is $2k–$15k depending on scope. Mero takes 0% of that revenue.

## 3. Tools we ship for partners

You don't have to read source. The pieces you'll touch:

- **`@mero/theme-base`** — npm package with all the section components (Hero, FeatureBlocks, Testimonials, FAQ, FinalCTA, plus 8 Pro widgets). Drop them in, restyle with CSS variables.
- **`@mero/theme-editor-bridge`** — npm package that adds visual-editor click-to-edit to your theme. One `<EditorBridge />` component in the layout.
- **`mero theme validate`** — CLI that lints your `theme.json` so editor / activation surprises stay at zero.
- **`mero theme build-registry`** — CLI that auto-generates `widget-registry.gen.tsx` from your `theme.json` widget catalog. Run after every catalog edit.
- **Templates** — 6 reference templates (`mero-hello`, `mero-storefront`, `mero-portfolio`, `mero-agency`, `mero-studio`, `mero-scale`) you can fork as starting points.

The contract these enforce is in [docs/THEME_CONTRACT.md](THEME_CONTRACT.md).

## 4. The Tier-2 build, end to end

Roughly the playbook I use when I take on a Mero theme job. Adjust to taste.

### 4.1 Discovery (1–2 days)

- Brand: logo, font, primary brand colour, secondary, neutrals.
- Sitemap: which pages? Which CTAs?
- Content: who writes the copy? You? Customer? AI-generated then refined?
- Plugins: do they need analytics-pro, SEO-boost, anything from the marketplace?
- Tier: confirm they're on Custom (Org-Custom or Personal-Custom).

Write this up in a one-pager. Get a sign-off before scaffolding.

### 4.2 Scaffold (15 min)

```bash
# In a fresh folder:
git clone https://github.com/<your-fork>/mero-cms.git
cd mero-cms
npm install

# Pick the closest template:
cp -r themes/mero-hello   themes/mero-clientname
cd themes/mero-clientname
# Update package.json name + theme.json slug.
```

Fire up `npm run dev` and confirm it boots. Now you have a live theme dev server you can iterate against.

### 4.3 Theme the brand (1–4 days)

- Edit `themes/mero-clientname/src/styles/globals.css` for the CSS variables (`--brand`, `--ink-1`, `--ink-2`, `--ink-3`, `--bg`, `--line`).
- Drop the customer's logo into `public/`.
- Tweak typography in the layout's `<head>`.
- Optional: customise the section components (Hero variants, FeatureBlocks layout). Most clients want maybe 2-3 sections heavily customised and the rest left as defaults.

The visual-editor is what the customer will use for content. So spend your time on **structure and brand**, not on copy. The customer will replace your placeholder copy via the editor.

### 4.4 Wire the manifest (30 min)

`theme.json` declares:

- `pageSchema` — every page slug + its sections.
- `widgetCatalog` — which widget types this theme supports in the visual editor (set `premium: true` on Pro widgets).
- `seedData.pages` — the initial content shown when the theme is first activated.
- `brandingFields` — which CSS variables the customer can override from the admin.
- `requiredCapabilities` / `optionalCapabilities` — features the theme expects from the install.

Run the validator after each edit:

```bash
npm run theme:validate -- mero-clientname
```

It catches typos (`page-shema`), unknown field types, dangling pageSchema references, broken icons. 0 errors before activation, every time.

After editing the widget catalog, regenerate the registry:

```bash
npm run theme:build-registry -- mero-clientname
```

That writes `themes/mero-clientname/src/lib/widget-registry.gen.tsx` — the file the renderer uses to dispatch widget types to components.

### 4.5 Visual editor wiring (10 min)

In your root layout:

```tsx
import { EditorBridge } from '@mero/theme-base';
// or directly: import EditorBridge from '@mero/theme-editor-bridge';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
                <EditorBridge />
            </body>
        </html>
    );
}
```

Then on every section component, mark editable surfaces:

```tsx
<section data-section-id="hero" data-section-type="Hero">
    <h1 data-editable="title">{data.title}</h1>
    <p  data-editable="subtitle">{data.subtitle}</p>
</section>
```

Now in admin → Visual Editor, the customer can click any field and edit inline.

### 4.6 Test in the editor (1 hr)

- Spin up the full stack (`npm run dev:all` from the repo root).
- Activate your theme from `/dashboard/themes`.
- Open the visual editor on every page in your sitemap.
- Click every editable field. Confirm the inspector renders the right control type.
- Toggle between desktop / tablet / mobile previews.
- Save. Reload. Confirm the change persisted.

If anything's broken here, the customer will hit it on day 1. Fix it now.

### 4.7 Deploy (1 hr)

Deployment options:

- **Self-hosted** — your client runs the backend on their infra (Docker compose ships in repo root).
- **Mero Cloud** — managed hosting. Customer connects their license, pushes the theme, Mero Cloud handles the rest. Cleanest for non-technical clients.

Either way, the steps are: build the backend, push the theme as a workspace package, run `npm run db:seed` once to load `seedData`, point DNS, done.

### 4.8 Handover (30 min)

- 15-min screen recording walking through the visual editor with the customer's actual content.
- Doc with: where to add a blog post, where to upload to the media library, where to find their license info, your support contract terms.
- Set them up in the admin with their own user account (give yourself a separate `support` account you can revoke later).

You're done. Customer edits content from now on. They come back to you when they want a new section type, a new page template, or a redesign.

## 5. Common questions agencies ask

**"Can I sell my customised theme to other customers?"** — Yes. Themes are yours. Many agencies build a portfolio of 5-10 industry-specific themes (lawyers, restaurants, agencies, ecommerce) and reuse them across customers with light brand swaps.

**"What about updates to `@mero/theme-base`?"** — Semver. Patch and minor are safe drop-ins; major may require small changes per the changelog. The CLI `theme:validate` flags any breaking-change shapes.

**"Can the customer break the theme by editing in the visual editor?"** — Not the structure, no. They can only edit field values within sections. Adding/removing sections requires Pro tier. Restoring defaults is one click.

**"Do I have to use Mero's section components?"** — No, but it's recommended. Roll your own components and the visual editor still works as long as you implement the `data-section-id` / `data-editable` markers and add an entry to `widgetCatalog`. The auto-registry CLI supports custom imports via `componentImport`.

**"Plugins — can I write one?"** — Yes. See [docs/PLUGIN_DEVELOPMENT.md](PLUGIN_DEVELOPMENT.md). Plugins can contribute widgets to the editor (Phase 6.1), data sources, custom admin pages, and more.

**"Do I need to know NestJS to build a theme?"** — No. Themes are pure Next.js + React. The backend is a black box you read from via `getSiteData()`, `getPage(slug)`, `getMenu(slug)`. You only touch the backend if the customer wants new content models (in which case it's a custom plugin, not a theme).

**"What's the support model?"** — Mero supports the platform; you support the theme you built. We respond to GitHub issues against `@mero/theme-base` and the admin within 1 business day on average.

## 6. Where to go next

- **[THEME_CONTRACT.md](THEME_CONTRACT.md)** — formal contract a theme must satisfy.
- **[THEME_DEVELOPMENT.md](THEME_DEVELOPMENT.md)** — long-form development guide with code samples.
- **[THEME_MANIFEST_SPEC.md](THEME_MANIFEST_SPEC.md)** — `theme.json` field-by-field reference.
- **[PLUGIN_DEVELOPMENT.md](PLUGIN_DEVELOPMENT.md)** — building a marketplace plugin.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the backend, admin, and theme talk to each other.

Welcome aboard.
