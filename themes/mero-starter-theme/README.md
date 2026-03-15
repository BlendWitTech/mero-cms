# Mero CMS — Starter Theme

The official starter theme for Mero CMS. Built as a standalone Next.js app that connects to your Mero CMS backend.

## What This Theme Is For

This is a comprehensive starter theme designed to showcase the power of Mero CMS. It includes sections for features, pricing, testimonials, and blog content, all easily customisable for your project.

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
cd themes/mero-starter-theme
npm install
cp .env.local.example .env.local
# Edit .env.local → set CMS_API_URL to your backend URL (usually http://localhost:3001)
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

The **Pricing** and **Features** sections are illustrative and hardcoded in the theme source. Edit them in `src/components/sections/Pricing.tsx` and `Features.tsx`.

---

## Required CMS Modules

This theme works best with these modules enabled:

- `blogs` — for blog posts
- `testimonials` — for testimonials
- `leads` — for contact form
- `menus` — for navigation

Enable them in **CMS Admin → Settings → Modules**.

---

## Design System

The theme uses CSS custom properties defined in `src/app/globals.css`.

---

## Deploying

Deploy anywhere that supports Next.js. Set `CMS_API_URL` to your backend URL.

---

## Packaging as a Theme ZIP

To upload through the CMS admin:

```bash
# From the themes/ directory
zip -r mero-starter-theme.zip mero-starter-theme/
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
