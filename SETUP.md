# Mero CMS — Developer Setup & Deployment Guide

This guide is for **developers and contributors** working on Mero CMS itself, or for anyone deploying Mero to staging / production infrastructure (Render + Supabase + Vercel by default; Railway, Fly.io, VPS, or Docker if you'd rather).

> **If you're a customer who just bought a Mero CMS license**, you probably want [docs/customer/INSTALL.md](docs/customer/INSTALL.md) instead — it covers the four installation paths in customer-friendly language: Mero Cloud (we host it), managed install (your agency installs it), VPS self-host (you install on a server), or local self-host (testing on your laptop).

This document focuses on the developer workflow and the underlying mechanics. It assumes you're comfortable with Node.js, Git, and the command line.

---

## Branch Strategy

| Branch | Environment | Status | Target |
|---|---|---|---|
| `develop` | Local/Dev | Drafting | Active development |
| `testing` | Staging | Preview | Staging/QA branch |
| `main` | Trunk | Trunk | Feature integration |
| `production` | Production | Stable | Live client deployments |
| `marketing` | Demo | Marketing | [demo.merocms.com](https://demo.merocms.com) |

Standard promotion path: `develop` → `testing` → `main` → `production`.

---

## Part 1 — Local Development

This is the developer workflow — fast iteration with hot reload, direct source access, real-time TypeScript and React errors in your terminal.

**Prerequisites:** Node.js 20+, Git, and either Docker (for the local Postgres container started by `dev:all`) or a Postgres instance you point at via `DATABASE_URL`.

### Step 1 — Clone the repository

```bash
git clone https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
git checkout develop
```

### Step 2 — One-time install

From the repo root:

```bash
npm run setup
```

This runs `scripts/setup.ps1` which installs all npm workspaces (backend, frontend, themes), generates the Prisma client, and prepares the dev environment. You only run it once per checkout.

### Step 3 — Start everything

```bash
npm run dev:all
```

That single command starts:

- **Postgres** in Docker (`docker compose up db -d`) — skipped silently if Docker isn't running, in which case set `DATABASE_URL` to point at your own Postgres instance.
- **Backend** at `http://localhost:3001`.
- **Frontend** at `http://localhost:3000`.
- **Active theme** dev server at `http://localhost:3002`.

If you only want backend + frontend (no theme dev server), run `npm run dev` instead.

> The wizard collects database credentials in the browser if `DATABASE_URL` isn't already set in env — you never need to hand-edit `.env`. `JWT_SECRET` is auto-generated to `secrets.json` on first boot, also handled for you.

### Step 4 — Run the setup wizard

Open **http://localhost:3000/setup** in your browser.

The wizard walks you through:

1. **Site & Admin** — name your site, create the Super Admin account.
2. **Database** — connection details (skipped automatically when `DATABASE_URL` is set in env, e.g. via the `dev:all` Docker container).
3. **Site Configuration** — public site URL, optional SMTP/Resend email, optional S3/R2/Minio storage. Each section is skippable; everything can be revisited later from Settings.
4. **License & Modules** — paste your license key (optional) and pick which modules to enable.
5. **Complete** — schema build, migrations, admin user creation, and a live streaming terminal that shows each step.

> **Important:** On the wizard, click **Fresh Start** (not Restore) for a brand-new install. This seeds demo content from the active theme.
>
> `SETUP_COMPLETE` and `ENABLED_MODULES` are stored in the database — the wizard manages them; never set them as env vars manually.
>
> To change anything after setup — site URL, email, storage, etc. — go to **Settings** in the admin dashboard. To start over, **Settings → Danger Zone** has Reset content / Factory reset / Reinstall theme buttons that stream their own progress through the same terminal.

### Other useful commands

```bash
npm run reset          # full project reset (runs scripts/reset.ps1)
npm run clean          # clean build artifacts
npm run dev            # backend + frontend only (no theme)
npm run dev:backend    # backend only
npm run dev:frontend   # frontend only
npm run dev:theme      # active theme dev server only
npm run dev:db         # Postgres docker container only
npm run prisma:generate # regenerate the Prisma client
npm run mint-license   # mint a JWT-signed Custom-tier license for testing
npm run theme:validate # validate theme.json against the manifest schema
```

### Step 5 — (Optional) Start the demo playground locally

```bash
cd demo
cp .env.local.example .env.local
# Fill in OAuth keys (see Part 3 for how to create them)
npm install
npm run dev
```

Demo runs at **http://localhost:3002**

### Optional — Docker Compose (for production-like local testing)

If you want to test what a customer's Docker self-host would look like — built containers, named volumes, the actual `MERO_DATA_DIR` persistence model — use the compose file at the repo root:

```bash
docker compose up --build
```

This is **not** the recommended developer workflow (no hot reload, slower iteration, build cache to fight) but it's the right way to verify changes before tagging a release. The compose file ships with sensible defaults — no `.env` required.

Customer-facing Docker instructions live in [docs/customer/INSTALL.md](docs/customer/INSTALL.md) (Path 4 — Local self-host). Don't recommend Docker as the primary customer path; Mero Cloud and managed install are better fits for non-developers.

---

## Part 2 — Staging Setup

The hosting stack for testing/beta is **Render** (backend) + **Supabase**
(Postgres) + **Vercel** (frontend). This was previously documented as
Railway here; we moved off Railway because their free tier is a one-time
$5 trial credit, while Render + Supabase + Vercel are all genuinely free
for testing-grade traffic.

The full click-by-click setup — provisioning Supabase, creating the Render
service, configuring Vercel, wiring CORS, adding GitHub Actions secrets,
setting up the production approval gate — lives in
**[`docs/internal/OPERATIONS.md`](./docs/internal/OPERATIONS.md)**. That's
the canonical runbook; treat this part of SETUP.md as the high-level map.

The branch model that drives all of this — `develop` → staging,
`main` → production with manual approval, tags for releases — is in
**[`docs/internal/BRANCHING.md`](./docs/internal/BRANCHING.md)**.

If you'd rather host on Railway, Fly.io, or your own VPS, the workflows
and Dockerfiles work identically; you'd swap the dashboard click-paths.
The render.yaml at the repo root is Render-specific Infrastructure as Code
— ignore it on other platforms.

---

## Part 3 — OAuth Apps (for Demo Playground)

You need three OAuth apps — one each from Google, GitHub, and LinkedIn.

### Google

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorised redirect URIs:
   - `http://localhost:3002/api/auth/callback/google` (local)
   - `https://your-demo.vercel.app/api/auth/callback/google` (staging)
6. Copy **Client ID** and **Client Secret**

### GitHub

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. Homepage URL: `https://your-demo.vercel.app`
4. Authorization callback URL: `https://your-demo.vercel.app/api/auth/callback/github`
5. Copy **Client ID** and **Client Secret**

> For local: create a second GitHub OAuth App with callback `http://localhost:3002/api/auth/callback/github`

### LinkedIn

1. Go to [linkedin.com/developers/apps](https://linkedin.com/developers/apps) → **Create app**
2. Fill in app name, company, logo
3. **Auth** tab → Authorized redirect URLs:
   - `https://your-demo.vercel.app/api/auth/callback/linkedin`
4. **Products** tab → Request access to **Sign In with LinkedIn using OpenID Connect**
   (approval is automatic for most apps)
5. Copy **Client ID** and **Client Secret**

---

## Part 4 — GitHub Actions Secrets

These secrets are used by the CI/CD workflows.

Go to: GitHub → repo → **Settings** → **Secrets and variables** → **Actions**

| Secret name | Value |
|---|---|
| `STAGING_API_URL` | Render staging backend URL (e.g. `mero-cms-backend-staging.onrender.com`) |
| `PRODUCTION_API_URL` | Render production backend URL (add when ready) |
| `VERCEL_PROJECT` | Vercel project slug (used by `pr-preview-comment.yml` to predict preview URLs) |

---

## Part 5 — Production Setup (when ready for custom domain)

Production is a second copy of the staging stack — separate Render
service for the backend, separate Supabase project for the database,
separate Vercel deployment configured for your custom domain. The
mechanics are identical to staging but pointed at `main` instead of
`develop`. Click-by-click steps live in
[`docs/internal/OPERATIONS.md`](./docs/internal/OPERATIONS.md) under
the "Production environment" section.

The **manual approval gate** for production deploys is configured in
GitHub Environments and already wired into `deploy-production.yml`. See
the same OPERATIONS.md section for the dashboard steps.

> Reminder: free-tier Render Web Services have no persistent disk, so
> the wizard's saved state and uploads regenerate per redeploy. For
> production, bump the backend service to Render's Starter plan
> ($7/mo) — the `render.yaml` has a commented production block ready
> to uncomment.

---

## Part 6 — Day-to-Day Development Workflow

The branch model is `develop → main → tags`. Two long-lived branches,
plus version tags for releases. See
[`docs/internal/BRANCHING.md`](./docs/internal/BRANCHING.md) for the
full doc — including hotfix flow, branch protection, and why we picked
this model over GitFlow / trunk-based.

Quick reference:

```bash
# Start a new feature
git switch develop && git pull
git switch -c feature/my-feature

# Work, commit, push
git push -u origin feature/my-feature

# Open PR → develop. CI validates. Merge.
# develop auto-deploys to staging (Render + Vercel preview).
# When solid, open PR develop → main, get approval, merge.
# Production deploys after the manual approval gate.
```

---

## Part 7 — CI/CD Workflows

| Workflow file | Trigger | What it does |
|---|---|---|
| `ci.yml` | Every push and PR | Builds backend + frontend + demo, validates |
| `deploy-staging.yml` | Push to `develop` | Confirms build passes (Render + Vercel deploy automatically via their GitHub integrations) |
| `deploy-production.yml` | Push to `main` | Runs full build check, logs success for production tracking |

Render and Vercel automatically deploy when they detect a push to their connected branch. The GitHub workflows serve as build gates — if CI fails, you know before it reaches the host.

---

## Part 8 — Making the Repo Private

GitHub does not allow changing visibility from code — do it manually:

1. GitHub → repo → **Settings**
2. Scroll to **Danger Zone**
3. **Change repository visibility** → **Make private**
4. Type the repo name to confirm → **I understand, make this repository private**

After this:
- Go to **Settings → Collaborators → Add people** to invite approved contributors
- Contributors must use PRs — they cannot push directly to `develop` or `main`

---

## Part 9 — Invite Contributors

1. GitHub → repo → **Settings** → **Collaborators** → **Add people**
2. Enter their GitHub username or email address
3. They receive an invite email
4. Once accepted, they can clone the repo
5. They push to feature branches and open PRs to `develop`
6. You review and approve before merging

---

## Ports Reference (Local)

| Service | Port |
|---|---|
| Frontend / Admin UI (Next.js) | 3000 |
| Backend API (NestJS) | 3001 |
| Demo Playground (Next.js) | 3002 |
| PostgreSQL | 5432 |

---

## Environment Files Reference

| File | Used for |
|---|---|
| `backend/.env.development.example` | Copy to `backend/.env` for local dev |
| `backend/.env.staging.example` | Reference for staging env vars (set in Render dashboard, not in `.env`) |
| `backend/.env.production.example` | Reference for production env vars (set in Render dashboard, not in `.env`) |
| `frontend/.env.development.example` | Copy to `frontend/.env.local` for local dev |
| `frontend/.env.staging.example` | Reference for Vercel preview env vars |
| `demo/.env.local.example` | Copy to `demo/.env.local` for local demo dev |

---

## Troubleshooting

**`prisma generate` fails in Docker**
Ensure `backend/Dockerfile` has `ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci` — this provides a dummy value so Prisma can generate the client without a real DB during the build.

**`dist/main.js` not found after backend build (Render or Railway)**
Check `backend/tsconfig.build.json` has `"rootDir": "src"`. Without this, TypeScript widens its output path to `dist/src/main.js` when root-level `.ts` files exist.

**Themes not showing in the CMS dashboard**
- Ensure the build context is the **repo root** (not `backend/`). On Render the Dockerfile path is set to `./backend/Dockerfile` with the context at root — same on Railway. The Dockerfile copies from the repo root because it needs `themes/` and `scripts/` alongside `backend/`.
- This allows Docker to run `COPY themes/ /themes/`
- Each theme must have a valid `theme.json` with a `slug` field

**CORS errors from Vercel frontend to backend**
- Set `CORS_ORIGINS` on the backend (Render → Environment tab) to include your exact Vercel URL.
- For dynamic Vercel preview URLs: also set `CORS_VERCEL_PROJECT` to your Vercel project slug

**Setup wizard returns 500**
- Click **Fresh Start** (not Restore Backup) on the setup type screen
- The demo seed only runs when `setupType === 'FRESH'`
- Do not set `SETUP_COMPLETE` or `ENABLED_MODULES` as host env vars

**Media uploads not persisting on the host**
Both Render's free tier and Railway's free tier have ephemeral filesystems — uploaded files are lost on redeploy. The fix is the same in both: in the wizard's Site Configuration → Storage step, pick S3 / Cloudflare R2 / Supabase Storage instead of Local. Local-disk uploads only work on Render Starter (with a persistent disk) or a real VM. The wizard exposes this so customers don't need to edit env vars.
