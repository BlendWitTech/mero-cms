# Mero CMS

**Mero CMS** is a modular, self-hosted content management system built by [Blendwit Tech](https://blendwit.com).

It consists of three parts that are always deployed separately:

| Part | What it is | Deployed on |
|------|-----------|-------------|
| **Backend** (`backend/`) | NestJS REST API + admin logic | Railway |
| **Dashboard** (`frontend/`) | Next.js admin panel | Vercel |
| **Theme** (separate repo) | Client's public-facing website | Vercel |

### Branch Strategy

| Branch | Purpose | Purchase/Deploy |
| :--- | :--- | :--- |
| `main` | **Clean Base Version**. Stripped of all demo code. | For clean agency/client purchases. |
| `stable` | **Production Version**. Code used by live clients. | For `ktm-plots` and current client setups. |
| `marketing` | **Demo Version**. Includes showcase/demo logic. | For `demo.merocms.com`. |
| `develop` | **Internal Development**. Where new features are merged. | For developers and team testing. |

---

## For Agencies — Delivering to a Client

There are three ways to deliver Mero CMS to a client. Pick the one that fits.

---

### Model A — You manage everything (recommended)

You host the CMS. Client gets a login and a live website. They never touch a server.

```
You → Deploy backend on Railway        (mero-cms @ v1.1.0, root: backend/)
You → Deploy dashboard on Vercel       (mero-cms @ v1.1.0, root: frontend/)
You → Fork mero-cms-theme-starter      → build client design → deploy on Vercel
You → Run setup wizard, seed content
You → Hand client: dashboard URL + login + live site URL
```

**Client gets:** A working CMS and live website. No server knowledge needed.
**You manage:** Hosting, upgrades, backups. Charge a monthly retainer.

**To upgrade a client later:**
- Railway → Service → Settings → Source → change tag `v1.1.0` → `v1.2.0`
- Vercel → Settings → Git → update pinned tag → redeploy
- Theme is unaffected (separate repo, separate deployment)

---

### Model B — Client self-hosts, you deploy

Client owns the Railway/Vercel accounts. You deploy on their behalf.

```
Client → Creates Railway + Vercel accounts, gives you access
You    → Deploy backend on their Railway   (mero-cms @ v1.1.0)
You    → Deploy dashboard on their Vercel  (mero-cms @ v1.1.0)
You    → Build and deploy theme on Vercel  (separate theme repo)
You    → Run setup wizard → hand over credentials
Client → Owns all infrastructure going forward
```

**Client gets:** Full ownership of hosting and code.
**To upgrade:** Client (or you) updates the pinned tag and redeploys.

---

### Model C — Client pulls and self-deploys

For technical clients who want full control from day one.

```
Client → Clones mero-cms at tag v1.1.0
Client → Deploys backend (Railway/VPS) + dashboard (Vercel) themselves
You    → Build the theme → hand ZIP or separate repo to client
Client → Uploads theme ZIP via dashboard → Setup → Activate
Client → Manages hosting, upgrades, backups themselves
```

**Client gets:** Full source access and self-management.

---

## For Developers — Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (or Docker)

### 1. Clone and install

```bash
git clone https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit: DATABASE_URL, JWT_SECRET, SMTP settings

cp frontend/.env.local.example frontend/.env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Database

```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed default roles (optional)
```

### 4. Start dev servers

```bash
npm run dev           # Backend on :3001 + Dashboard on :3000
```

Open `http://localhost:3000` → complete the setup wizard.

### 5. Run a theme locally

```bash
# In a separate terminal, inside your theme repo:
CMS_API_URL=http://localhost:3001 npm run dev
# Theme runs on http://localhost:3002
```

---

## Architecture

```
mero-cms/                        ← This repo (engine)
  backend/                       ← NestJS API  → Railway
  frontend/                      ← Admin dashboard → Vercel
  themes/
    blank/                       ← Minimal built-in placeholder (always present)
  demo/                          ← Shared demo site (ONE deployment, never per client)

mero-cms-theme-starter/          ← Fork this for every new client theme
  src/lib/cms.ts                 ← CMS data fetching (do not modify)
  src/app/                       ← Pages: Home, Blog, [slug]
  src/app/api/revalidate/        ← Cache invalidation endpoint
  theme.json                     ← Theme metadata + seed data

mero-cms-client-starter/         ← Fork this for every new client onboarding
  SETUP.md                       ← Step-by-step deployment checklist
  client.md                      ← Client contacts, deployment URLs, notes
  .env.backend.example           ← All Railway backend env vars
  .env.frontend.example          ← Vercel dashboard env vars
  .env.theme.example             ← Vercel theme env vars
```

---

## Environment Variables

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Long random string for auth tokens |
| `FRONTEND_URL` | Yes | Dashboard Vercel URL (for invite emails) |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `CORS_VERCEL_PROJECT` | No | Vercel project name (allows all preview URLs) |
| `THEME_URL` | Yes | Client's deployed theme Vercel URL |
| `REVALIDATE_SECRET` | Yes | Shared secret for cache invalidation |
| `EMAIL_PROVIDER` | No | `smtp` (default) or `resend` |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | For SMTP | Gmail or any SMTP |
| `RESEND_API_KEY` | For Resend | Resend.com API key |

### Dashboard (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend Railway public URL |

### Theme (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `CMS_API_URL` | Yes | Backend Railway public URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Theme's own public URL |
| `REVALIDATE_SECRET` | Yes | Must match backend's `REVALIDATE_SECRET` |

---

| Tag Suffix | Use Case | Example |
| :--- | :--- | :--- |
| (None) | Clean `main` branch releases | `v1.1.0` |
| `-stable` | Production client releases | `v1.1.0-stable` |
| `-marketing` | Demo/Showcase site releases | `v1.1.0-marketing` |
| `-develop` | Internal development snapshots | `v1.1.0-develop` |

Always pin client deployments to a specific tag in Railway and Vercel.
**Never point a client's production deployment to `main` (clean) or `develop`.**

---

## Modules

Enable only what each client needs via `ENABLED_MODULES` env var on Railway:

```
ENABLED_MODULES=blogs,services,testimonials,team,leads,seo,analytics,themes,menus,categories,comments,redirects,robots,sitemap
```

---

## Onboarding a New Client (Quick Reference)

```
1. Fork mero-cms-client-starter  → client-[name]  (private repo)
2. Follow SETUP.md in that repo
3. Fork mero-cms-theme-starter   → [name]-theme
4. Build client design → fill theme.json → deploy to Vercel
5. Set THEME_URL in Railway backend env → redeploy
6. Open dashboard → Setup wizard → connect theme → done
```

Full checklist: [mero-cms-client-starter/SETUP.md](https://github.com/BlendWitTech/mero-cms-client-starter)

---

## Demo Site

`demo/` is deployed **once** as a shared sales/demo site.
**Never deploy it per client.** See [`demo/DEMO-ONLY.md`](demo/DEMO-ONLY.md).

---

Built by [Blendwit Tech](https://blendwit.com)
