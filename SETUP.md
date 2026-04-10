# Mero CMS — Setup & Deployment Guide

This guide walks through every step to get Mero CMS running locally, on Railway (staging and production), and on Vercel.

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

### Prerequisites

- Node.js 20+
- PostgreSQL (local install or use Docker: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15`)
- Git

### Step 1 — Clone the repository

```bash
git clone https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
git checkout develop
```

### Step 2 — Backend setup

```bash
cd backend
cp .env.development.example .env
```

Open `.env` and fill in:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/merocms"
JWT_SECRET="any-long-random-string-here"
```

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

Backend runs at **http://localhost:3001**

### Step 3 — Frontend setup

Open a new terminal:

```bash
cd frontend
cp .env.development.example .env.local
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### Step 4 — Run the setup wizard

Open **http://localhost:3000/setup** in your browser.

The wizard will:
1. Create your Super Admin account (email + password)
2. Let you select which modules to enable (blogs, services, testimonials, etc.)
3. Create the database schema
4. Optionally seed demo content from the active theme

> **Important:** On the wizard, click **Fresh Start** (not Restore). This seeds demo content.
> `SETUP_COMPLETE` and `ENABLED_MODULES` are stored in the database — never set them as env vars.

### Step 5 — (Optional) Start the demo playground locally

```bash
cd demo
cp .env.local.example .env.local
# Fill in OAuth keys (see Part 3 for how to create them)
npm install
npm run dev
```

Demo runs at **http://localhost:3002**

---

## Part 2 — Staging Setup (Railway + Vercel)

### Step 1 — GitHub repository setup

If you haven't already:

```bash
# Make sure you're on develop and it's pushed
git checkout develop
git push origin develop

# Make sure main is pushed
git push origin master:main
```

Then on GitHub:
- Go to **Settings → General → Default branch** → switch to `develop` → Update

### Step 2 — Railway (Backend, Staging)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select the `BlendWitTech/blendwit-cms` repository
3. **Root Directory**: leave **blank** (Railway must use the repo root, not `backend/`)
4. Railway will pick up `railway.json` automatically and use the Dockerfile builder

**Add a database:**
- In the project view → **+ New** → **Database** → **Add PostgreSQL**
- Railway will automatically inject `DATABASE_URL` into your backend service

**Set environment variables** (service → Variables tab):
```
NODE_ENV            = production
JWT_SECRET          = <generate with: openssl rand -base64 64>
CORS_ORIGINS        = https://your-frontend.vercel.app
CORS_VERCEL_PROJECT = your-vercel-project-name
```

> Fill in CORS values after Step 3 below — you can update them after Vercel is set up.

**Set Watch Paths** (prevents Railway rebuilding on frontend/demo changes):
- Service → Settings → Watch Paths
- Add: `backend/**`
- Add: `themes/**`

**Connect to develop branch:**
- Service → Settings → Source → Branch → `develop`

**After the first deploy:**
- Copy your Railway service URL (e.g. `https://blendwit-cms-backend.up.railway.app`)
- Add it to GitHub Secrets: repo → Settings → Secrets → Actions → New secret
  - Name: `STAGING_API_URL`
  - Value: your Railway URL

### Step 3 — Vercel (Frontend, Staging)

1. Go to [vercel.com](https://vercel.com) → **New Project** → **Import** → select `blendwit-cms`
2. **Root Directory**: `frontend`
3. Framework: Next.js (auto-detected)
4. **Environment Variables** → set for **Preview** environment:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.up.railway.app
   ```
5. Deploy

**After deploy:**
- Copy your Vercel URL (e.g. `https://blendwit-cms-frontend.vercel.app`)
- Go back to Railway → update `CORS_ORIGINS` to this URL
- Update `CORS_VERCEL_PROJECT` to your Vercel project name (the slug in the URL)

### Step 4 — Run the setup wizard on staging

Open your Vercel frontend URL + `/setup` and complete the wizard as in Part 1 Step 4.

### Step 5 — Vercel (Demo Playground, Staging)

1. Vercel → **New Project** → Import same repo
2. **Root Directory**: `demo`
3. Set environment variables (all environments):

```
NEXTAUTH_URL             = https://your-demo.vercel.app
NEXTAUTH_SECRET          = <generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID         = <from Google OAuth — see Part 3>
GOOGLE_CLIENT_SECRET     = <from Google OAuth>
GITHUB_CLIENT_ID         = <from GitHub OAuth>
GITHUB_CLIENT_SECRET     = <from GitHub OAuth>
LINKEDIN_CLIENT_ID       = <from LinkedIn OAuth>
LINKEDIN_CLIENT_SECRET   = <from LinkedIn OAuth>
CMS_API_URL              = https://your-backend.up.railway.app
NEXT_PUBLIC_DEMO_CMS_URL = https://your-frontend.vercel.app
NEXT_PUBLIC_BUY_URL      = https://blendwit.com/mero-cms/pricing
NEXT_PUBLIC_CONTACT_URL  = https://blendwit.com/contact
```

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
| `STAGING_API_URL` | Railway staging service URL |
| `PRODUCTION_API_URL` | Railway production service URL (add when ready) |

---

## Part 5 — Production Setup (when ready for custom domain)

### Railway — Production service

1. In your existing Railway project → **+ New Service** → Deploy from GitHub (same repo)
2. Connect to the `main` branch
3. Set Watch Paths: `backend/**` and `themes/**`
4. Add a second PostgreSQL database for production
5. Set environment variables (same as staging but with production values):
   ```
   NODE_ENV            = production
   JWT_SECRET          = <different 64-char secret from staging>
   CORS_ORIGINS        = https://your-production-domain.com
   ```
6. Copy this service URL → add as `PRODUCTION_API_URL` GitHub secret

### Vercel — Production domain

1. Vercel → your frontend project → **Settings** → **Domains**
2. Add your custom domain (e.g. `app.blendwit.com`)
3. Follow the DNS setup instructions Vercel gives you
4. Update the **Production** environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-production-railway-url.up.railway.app
   ```

### GitHub — Production approval gate (optional but recommended)

1. GitHub → repo → **Settings** → **Environments** → **New environment**
2. Name: `production`
3. **Required reviewers** → add your GitHub username
4. **Deployment branches** → Selected branches → add `main`

After this, every push to `main` will pause and send you an email. You click **Review deployments → Approve** before Railway and Vercel deploy.

---

## Part 6 — Day-to-Day Development Workflow

```
production   ← live (merge from main)
  └── main   ← clean trunk (merge from testing)
        └── testing ← staging (merge from develop)
              └── develop ← active work
```

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Work, commit, push
git push origin feature/my-feature

# Open PR: feature/my-feature → develop
# CI validates → merge to develop → testing → main → production
```

---

## Part 7 — CI/CD Workflows

| Workflow file | Trigger | What it does |
|---|---|---|
| `ci.yml` | Every push and PR | Builds backend + frontend + demo, validates |
| `deploy-staging.yml` | Push to `develop` | Confirms build passes (Railway+Vercel deploy automatically) |
| `deploy-production.yml` | Push to `main` | Runs full build check, logs success for production tracking |

Railway and Vercel automatically deploy when they detect a push to their connected branch. The GitHub workflows serve as build gates — if CI fails, you know before it reaches Railway.

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
| `backend/.env.staging.example` | Reference for Railway staging env vars |
| `backend/.env.production.example` | Reference for Railway production env vars |
| `frontend/.env.development.example` | Copy to `frontend/.env.local` for local dev |
| `frontend/.env.staging.example` | Reference for Vercel preview env vars |
| `demo/.env.local.example` | Copy to `demo/.env.local` for local demo dev |

---

## Troubleshooting

**`prisma generate` fails in Docker**
Ensure `backend/Dockerfile` has `ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci` — this provides a dummy value so Prisma can generate the client without a real DB during the build.

**`dist/main.js` not found after Railway build**
Check `backend/tsconfig.build.json` has `"rootDir": "src"`. Without this, TypeScript widens its output path to `dist/src/main.js` when root-level `.ts` files exist.

**Themes not showing in the CMS dashboard**
- Ensure Railway Root Directory is left **blank** (repo root), not set to `backend/`
- This allows Docker to run `COPY themes/ /themes/`
- Each theme must have a valid `theme.json` with a `slug` field

**CORS errors from Vercel frontend to Railway**
- Set `CORS_ORIGINS` in Railway to your exact Vercel URL
- For dynamic Vercel preview URLs: also set `CORS_VERCEL_PROJECT` to your Vercel project slug

**Setup wizard returns 500**
- Click **Fresh Start** (not Restore Backup) on the setup type screen
- The demo seed only runs when `setupType === 'FRESH'`
- Do not set `SETUP_COMPLETE` or `ENABLED_MODULES` as Railway env vars

**Media uploads not persisting on Railway**
Railway's filesystem is ephemeral — uploaded files are lost on redeploy. For production, configure an S3-compatible storage (e.g. Cloudflare R2) and set `STORAGE_DRIVER=s3` in the backend env vars.
