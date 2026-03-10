# Mero CMS — Marketing Theme

The official marketing website for the Mero CMS product. Built as a standalone Next.js app that connects to your Mero CMS backend.

## What This Theme Is For

This theme is **not** for client sites. It's designed to run the Mero CMS product website itself — showcasing features, pricing, collecting leads, and publishing blog content.

> **For client projects**: Use `themes/starter/` as your starting point, or build a custom theme.

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page (Hero → Features → How It Works → Pricing → Testimonials → Blog → CTA) |
| `/pricing` | Full pricing page with FAQ |
| `/blog` | Blog listing (paginated) |
| `/blog/:slug` | Blog post |
| `/contact` | Contact page with lead capture form |

---

## Quick Start

```bash
cd themes/mero-cms-marketing
npm install
cp .env.local.example .env.local
# Edit .env.local → set CMS_API_URL to your backend URL
npm run dev   # runs on http://localhost:3002
```

---

## Content Management

All live content is managed through the CMS admin (`http://localhost:3000/dashboard`):

| Section | Managed in CMS admin |
|---|---|
| Testimonials | Admin → Testimonials |
| Blog posts | Admin → Blog |
| Contact leads | Admin → Leads |
| Navigation menus | Admin → Menus |
| Site title & social links | Admin → Settings → General |
| Logo & favicon | Admin → Settings → Media |

The **Pricing** and **Features** sections are hardcoded in the theme source (not CMS-driven) since they describe the product itself. Edit them directly in `src/components/sections/Pricing.tsx` and `Features.tsx`.

---

## Required CMS Modules

This theme requires the following modules to be enabled in your CMS:

- `blogs` — for blog posts
- `testimonials` — for the testimonials section
- `leads` — for the contact form
- `menus` — for navigation (optional — falls back to hardcoded nav)

Enable them in **CMS Admin → Settings → Modules**.

---

## Design System

The theme uses CSS custom properties defined in `src/app/globals.css`. Key values:

```css
--color-bg: #0a0f1e        /* deep navy */
--color-surface: #111827   /* card backgrounds */
--color-accent: #3b82f6    /* electric blue */
--color-text: #f9fafb
--color-muted: #9ca3af
```

To rebrand, update the CSS variables and the gradient colors in `Hero.tsx` and `Pricing.tsx`.

---

## Deploying

This is a standard Next.js app. Deploy anywhere:

### Vercel
```bash
# Push to a Git repo, then import in Vercel
# Set environment variable: CMS_API_URL=https://your-backend.com
```

### Self-hosted
```bash
npm run build
npm start   # port 3002
# Reverse proxy your domain → localhost:3002
```

**Important:** Set `CMS_API_URL` to the public URL of your CMS backend in production.

---

## Packaging as a Theme ZIP

To upload this theme through the CMS admin:

```bash
# From the themes/ directory
zip -r mero-cms-marketing.zip mero-cms-marketing/
```

Then: **CMS Admin → Themes → Upload Theme → Select ZIP → Setup → Activate**

---

## File Structure

```
src/
├── app/
│   ├── globals.css           ← Design system (CSS vars, utilities)
│   ├── layout.tsx            ← Root layout + CMS metadata
│   ├── page.tsx              ← Landing page
│   ├── pricing/page.tsx      ← Pricing + FAQ
│   ├── blog/page.tsx         ← Blog listing
│   ├── blog/[slug]/page.tsx  ← Blog post
│   └── contact/page.tsx      ← Contact + lead form
├── components/
│   ├── layout/
│   │   ├── Header.tsx        ← Sticky navigation
│   │   └── Footer.tsx        ← 4-column footer
│   └── sections/
│       ├── Hero.tsx          ← Hero with dashboard mockup
│       ├── Features.tsx      ← 12-feature grid
│       ├── HowItWorks.tsx    ← 4-step process
│       ├── Pricing.tsx       ← Free vs Pro (Freemium)
│       ├── Testimonials.tsx  ← CMS-powered (with static fallback)
│       ├── BlogPreview.tsx   ← Latest 3 posts
│       └── ContactForm.tsx   ← Lead capture (client component)
└── lib/
    └── cms.ts                ← Typed CMS client + submitLead()
```
