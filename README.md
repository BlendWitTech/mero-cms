> **Branch:** `develop` — active development. Unstable. Do not use for client deployments.
> For stable agency use, see the [`main`](https://github.com/BlendWitTech/mero-cms/tree/main) branch.

---

# Mero CMS — Developer Guide

**Mero CMS** is a modular, self-hosted CMS built by [Blendwit Tech](https://blendwit.com).

| Part | Stack | Default port |
|------|-------|-------------|
| `backend/` | NestJS REST API | 3001 |
| `frontend/` | Next.js admin dashboard | 3000 |

---

## Branch Strategy

| Branch | Purpose | Tag format |
|--------|---------|-----------|
| `main` | Clean production code — no demo, no dev notes | `v1.2.0` |
| `marketing` | `main` + demo overlay for `demo.merocms.com` | `v1.2.0-marketing` |
| `stable` | Frozen snapshot used by live clients | `v1.1.0-stable` |
| `develop` | Active development — merge here first | `v1.2.0-dev` |

**Never point a live client deployment at `develop` or `main` directly. Always use a pinned tag.**

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)

### 1. Install

```bash
git clone https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
npm install          # root workspace (installs backend deps)
cd frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp .env.example backend/.env
# Required: DATABASE_URL, JWT_SECRET

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
```

### 3. Database

```bash
cd backend
npx prisma db push        # apply schema
npm run seed:starter      # seed roles + CMS defaults (no users)
# Then open http://localhost:3000 → complete setup wizard
```

### 4. Start dev servers

```bash
# Terminal 1 — backend
cd backend && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

---

## Docker

### Standard deployment

```bash
cp .env.example .env
# Fill in: JWT_SECRET, DB_PASSWORD, LICENSE_KEY
docker compose up -d
```

### Demo deployment (marketing branch only)

```bash
docker compose -f docker-compose.yml -f docker-compose.demo.yml up -d
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string — `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_URL` | Backend public URL (frontend build-time var) |

### Licensing

| Variable | Description |
|----------|-------------|
| `LICENSE_KEY` | RSA-signed JWT from Blendwit — sets tier, domain, seats, expiry |

Generate a key internally:
```bash
node tools/issue-license.js --tier Premium --domain client.com --seats 5 --days 365
```

### Module selection (set by setup wizard)

| Variable | Description |
|----------|-------------|
| `ENABLED_MODULES` | Comma-separated module keys, e.g. `blogs,seo,analytics` |
| `SETUP_COMPLETE` | `true` after setup wizard runs |

### Optional

| Variable | Description |
|----------|-------------|
| `MAIL_HOST` / `MAIL_USER` / `MAIL_PASSWORD` / `MAIL_FROM` | SMTP for invitations + password reset |
| `WEBHOOK_SECRET_KEY` | Encryption key for webhook secrets (defaults to `JWT_SECRET`) |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |

Full reference: [`.env.example`](.env.example)

---

## Modules

All modules except core are opt-in via `ENABLED_MODULES`:

| Key | What it adds |
|-----|-------------|
| `blogs` | Posts, authors, drafts/publish workflow |
| `categories` / `tags` | Blog taxonomy |
| `comments` | Moderated comments on posts |
| `team` | Team member profiles |
| `services` | Services showcase |
| `testimonials` | Client testimonials |
| `leads` | Lead capture forms |
| `seo` | Per-page SEO meta fields |
| `redirects` | 301/302 redirect rules |
| `analytics` | Page view tracking |
| `sitemap` | XML sitemap generation |
| `robots` | robots.txt management |
| `forms` | Custom form builder |
| `webhooks` | Event-driven webhooks |

---

## Licensing Tiers

| Tier | Unlocks |
|------|---------|
| Basic | blogs, categories, tags, pages, menus, media, forms |
| Premium | Basic + team, services, testimonials, leads, seo, redirects, analytics, sitemap, robots, webhooks |
| Enterprise | Premium + collections, comments |
| Custom | All modules |

`TierGuard` reads the `LICENSE_KEY` JWT. Without a key, the CMS runs as **Basic** (unlicensed).

---

## Releasing

Tag `develop` as `v{major}.{minor}.{patch}-dev`, merge to `main`, tag as `v{major}.{minor}.{patch}`:

```bash
git tag v1.3.0-dev
git checkout main && git merge develop --no-ff
git tag v1.3.0
git push origin main develop --tags
```

For the marketing/demo branch:
```bash
git checkout marketing && git merge main --no-ff
# restore/update backend/src/demo/ files as needed
git tag v1.3.0-marketing
git push origin marketing --tags
```

GitHub Actions will automatically build and push Docker images to GHCR on tag push.

---

## Architecture

```
mero-cms/                   ← This repo (CMS engine)
  backend/                  ← NestJS API
    src/
      auth/                 ← JWT auth, roles, LicenseService, TierGuard
      demo/                 ← Demo-only code (loaded when DEMO_MODE=true)
      [module]/             ← Feature modules (blogs, media, themes, …)
    prisma/
      schema.prisma         ← Main schema
      modules/              ← Per-module schema fragments
      seed-starter.ts       ← Minimal seed for new installs
      seed-demo.ts          ← Demo seed (marketing branch only)
  frontend/                 ← Next.js admin panel
    src/app/(admin)/        ← Protected admin routes
    src/components/         ← Shared UI components
  themes/
    blank/                  ← Built-in placeholder theme
  tools/
    issue-license.js        ← Internal CLI to generate LICENSE_KEY JWTs
    keys/                   ← Private RSA key (gitignored — never commit)
```

---

Built by [Blendwit Tech](https://blendwit.com)
