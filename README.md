# Mero CMS

**Mero CMS** is a modular, self-hosted content management system built by [Blendwit Tech](https://blendwit.com).
Enable only the modules your project needs — blogs, services, team, testimonials, SEO, analytics, and more — then deploy a theme that automatically seeds its own demo content.

> **License:** Commercial proprietary software. Access requires a paid license or approved contributor status.
> Contact [hello@blendwit.com](mailto:hello@blendwit.com) or visit [blendwit.com/mero-cms/pricing](https://blendwit.com/mero-cms/pricing).

---

## What It Does

- **Modular backend** — enable/disable content modules without touching code
- **Setup wizard** — first-run wizard creates the database, admin account, and seeds demo content
- **Theme system** — upload ZIP themes; each theme declares its required modules and seeds its own data
- **Role-based access control** — Super Admin, Admin, and custom roles with per-permission granularity
- **Public API** — themes fetch all data from a single `/public/site-data` endpoint
- **SEO toolkit** — per-page meta tags, sitemap, robots.txt, and URL redirects
- **Analytics** — Google Analytics 4 dashboard embedded in the admin UI
- **Media manager** — upload and manage images and files used across all content
- **Demo playground** — visitors sign in with Google/GitHub/LinkedIn and explore the CMS before purchasing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS, Prisma ORM, PostgreSQL |
| Admin UI | Next.js 15, React 19, Tailwind CSS |
| Themes | Next.js 15 (standalone apps) |
| Demo App | Next.js 15, NextAuth.js |
| Authentication | JWT, bcrypt, 2FA (TOTP) |
| Infrastructure | Docker, Railway (backend), Vercel (frontend + demo) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
blendwit-cms/
├── backend/                        # NestJS REST API — port 3001
│   ├── prisma/
│   │   ├── modules/                # Per-module Prisma schema fragments
│   │   └── schema.prisma           # Assembled schema (generated)
│   ├── Dockerfile                  # Multi-stage Docker build for Railway
│   └── src/
│       ├── auth/                   # JWT auth, guards, 2FA
│       ├── users/                  # User management
│       ├── roles/                  # Roles and permissions
│       ├── setup/                  # Setup wizard logic
│       ├── themes/                 # Theme discovery, activation, ZIP upload
│       ├── public/                 # Public read-only API for themes
│       ├── blogs/                  # Blog posts
│       ├── categories/             # Blog categories
│       ├── tags/                   # Blog tags
│       ├── comments/               # Reader comments
│       ├── pages/                  # Static pages
│       ├── menus/                  # Navigation menus
│       ├── services/               # Service offerings
│       ├── testimonials/           # Client testimonials
│       ├── team/                   # Team member profiles
│       ├── leads/                  # Contact form leads
│       ├── media/                  # File/image uploads
│       ├── seo-meta/               # Per-page SEO metadata
│       ├── redirects/              # URL redirect rules
│       ├── sitemap/                # Sitemap generation
│       ├── robots/                 # robots.txt management
│       ├── analytics/              # GA4 integration
│       ├── notifications/          # In-app admin notifications
│       ├── audit-log/              # Activity audit trail
│       ├── invitations/            # Contributor invite system
│       ├── mail/                   # Email (SMTP) service
│       └── settings/               # Site-wide settings store
├── frontend/                       # Next.js admin dashboard — port 3000
│   └── src/
│       ├── app/
│       │   ├── setup/              # Setup wizard pages
│       │   └── (admin)/dashboard/  # All dashboard pages
│       ├── components/             # Shared UI components
│       ├── lib/                    # API client, utilities
│       └── context/                # Auth, modules, notifications context
├── demo/                           # Demo playground app — port 3002
│   └── src/
│       ├── app/
│       │   ├── api/auth/           # NextAuth.js OAuth handlers
│       │   ├── playground/         # Live CMS demo tour
│       │   └── pricing/            # Pricing page with lead capture
│       └── components/
├── themes/                         # Built-in themes (auto-discovered)
│   └── cms-starter/                # CMS marketing website theme
├── scripts/
│   ├── build-schema.js             # Assembles Prisma schema from modules
│   ├── zip-theme.js                # Packages a theme into a ZIP for upload
│   └── dev-theme.js                # Starts a theme in dev mode
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Build validation on every push/PR
│       ├── deploy-staging.yml      # Staging status on develop push
│       └── deploy-production.yml   # Production approval gate on main push
├── railway.json                    # Railway DOCKERFILE builder config
├── LICENSE                         # Commercial proprietary license
├── README.md                       # This file
├── SETUP.md                        # Full deployment guide
├── DEVELOPER_GUIDE.md              # Architecture and coding patterns
├── CONTRIBUTING.md                 # Contributor rules
└── PRICING.md                      # Pricing tiers and license terms
```

---

## Available Modules

Selected during setup wizard — toggle later in **Dashboard → Settings → Modules**.

| Module | Description |
|---|---|
| Blogs | Blog posts with rich content |
| Categories | Taxonomy for blog posts |
| Tags | Tag-based blog post taxonomy |
| Comments | Reader comments on blog posts |
| Pages | Static page management |
| Menus | Dynamic nested navigation menus |
| Services | Service or product listings |
| Testimonials | Client testimonials and reviews |
| Team | Team member profiles |
| Leads | Contact form submission capture |
| Media | File and image upload management |
| SEO Meta | Per-page title, description, OG tags |
| Redirects | URL redirect rules |
| Sitemap | Auto-generated XML sitemap |
| Robots | Editable robots.txt |
| Analytics | Google Analytics 4 dashboard |
| Themes | Theme upload, activation, and management |

> Specialty modules (e.g. real estate plots) are shipped inside individual themes, not in the base CMS.

---

## Theme System

Themes are standalone Next.js apps that call the CMS public API. Fully self-contained — each theme declares what it needs and seeds its own content.

**How a theme works:**
1. `theme.json` declares slug, required modules, and seed data
2. Backend auto-discovers themes in the `themes/` directory at startup
3. Admin clicks **Setup** → backend seeds menus, posts, testimonials, services, etc.
4. Admin clicks **Activate** → backend marks it as the active theme
5. Theme fetches all data from `GET /public/site-data`

**Packaging a custom theme for upload:**
```bash
node scripts/zip-theme.js cms-starter
# Output: themes/cms-starter.zip
# Then: Dashboard → Appearance → Themes → Upload Theme
```

---

## Environments

| Environment | Branch | Backend | Frontend |
|---|---|---|---|
| Local Development | any | localhost:3001 | localhost:3000 |
| Staging | `develop` | Railway (staging service) | Vercel preview URL |
| Production | `main` | Railway (production service) | Vercel production domain |

---

## Quick Start (Local)

```bash
# 1. Clone (requires license or contributor access)
git clone https://github.com/BlendWitTech/blendwit-cms.git
cd blendwit-cms

# 2. Backend
cd backend
cp .env.development.example .env
# Edit .env: fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run start:dev

# 3. Frontend (new terminal)
cd frontend
cp .env.development.example .env.local
npm install
npm run dev

# 4. Open http://localhost:3000/setup and complete the wizard
```

Full deployment guide → [SETUP.md](SETUP.md)
Architecture and patterns → [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
Pricing → [PRICING.md](PRICING.md)

---

## License

Commercial proprietary software — Copyright (c) 2024–2026 Blendwit Tech. All rights reserved.
Unauthorized use, cloning, or distribution is prohibited without a valid license.
See [LICENSE](LICENSE) for full terms.
