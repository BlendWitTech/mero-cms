# Mero CMS

A modular, self-hosted CMS built with NestJS and Next.js. Enable only the features your project needs — blogs, portfolio, team, testimonials, SEO, analytics, and more. Deploy a theme, seed content automatically, and go live in minutes.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/BlendWitTech/blendwit-cms-saas.git
cd blendwit-cms-saas

# 2. Install dependencies
npm install

# 3. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET

# 4. Start development servers
npm run dev
# Backend → http://localhost:3001
# Admin UI → http://localhost:3000

# 5. Open the setup wizard
# http://localhost:3000/setup
# — Enter site name and admin credentials
# — Select modules (blogs, team, themes, etc.)
# — Schema is built and DB is pushed automatically
# — Server restarts, you're redirected to login

# 6. Apply a theme (optional)
# Dashboard → Themes → click "Setup" on a theme
# Content seeds automatically from theme.json
```

## Project Structure

```
mero_cms/
├── backend/          # NestJS REST API (port 3001)
│   ├── prisma/
│   │   ├── modules/  # Per-module schema files (assembled by build-schema.js)
│   │   └── schema.prisma
│   └── src/
│       ├── setup/    # Setup wizard API
│       ├── themes/   # Theme management
│       ├── public/   # Public data endpoint for themes
│       └── ...
├── frontend/         # Next.js admin UI (port 3000)
│   └── src/app/
│       ├── setup/    # Setup wizard page
│       └── (admin)/dashboard/
├── themes/           # Built-in themes (auto-discovered)
│   ├── mero-cms-marketing/  # Marketing site theme (port 3002)
│   └── starter/             # Minimal starter theme
└── scripts/
    └── build-schema.js  # Assembles schema from selected modules
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, Prisma, PostgreSQL |
| Frontend (Admin) | Next.js 15, React, Tailwind CSS |
| Themes | Next.js 15 (separate apps) |
| Auth | JWT, bcrypt, 2FA (TOTP) |
| Infrastructure | Docker, Docker Compose |

## Modules

Core modules are always active. Optional modules are selected during setup and can be changed later in **Dashboard → Settings → Modules**.

| Module | Description |
|---|---|
| Blogs, Categories, Tags | Blog posts with taxonomy |
| Comments | Reader comments on posts |
| Portfolio, Project Categories | Project showcase with galleries |
| Team | Team member profiles |
| Services | Service offerings |
| Testimonials | Client reviews |
| Timeline | Company milestones |
| Menus | Dynamic nested navigation |
| Pages | Static page management |
| Leads | Contact form lead capture |
| Themes | Theme upload and management |
| SEO, Redirects, Sitemap, Robots | SEO toolset |
| Analytics | Google Analytics 4 dashboard |

## Themes

Themes are Next.js apps that read from the CMS public API (`GET /public/site-data`). Built-in themes in `themes/` are auto-discovered — no ZIP upload needed.

**Installing a theme:**
1. Dashboard → Themes
2. Click **Setup** — seeds menus, posts, testimonials, and media from `theme.json`
3. Click **Activate** to set it as the active theme
4. Set the **Deployed URL** so the dashboard links to your live theme

**Creating a theme:** copy `themes/starter/`, update `theme.json`, add seed data, place images in `media/`.

## Development Scripts

```bash
npm run dev          # Backend + Admin UI
npm run dev:all      # Backend + Admin UI + Marketing theme
npm run dev:theme    # Marketing theme only (port 3002)
npm run build        # Build backend and frontend
```

## Docker

```bash
# Copy and configure
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Then open http://localhost:3000/setup
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## License

Private / Proprietary — Blendwit Technology
