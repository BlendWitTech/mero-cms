# Mero CMS — Setup & Deployment Guide

## Branch Strategy

| Branch    | Environment | Backend                    | Frontend                  |
|-----------|-------------|----------------------------|---------------------------|
| `develop` | Staging     | Railway (staging service)  | Vercel (preview)          |
| `main`    | Production  | Railway (prod service)     | Vercel (production)       |
| any other | Local / PR  | CI build check only        | CI build check only       |

---

## 1. Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (local install or Docker)

### Setup
```bash
# Clone (requires approved contributor access or a paid license)
git clone https://github.com/blendwit-tech/mero-cms.git
cd mero-cms

# Backend
cd backend
cp .env.development.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.development.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001 (already set in example)
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Run the Setup Wizard
Open http://localhost:3000/setup — the wizard will:
1. Create your admin account
2. Select modules (blogs, services, testimonials, etc.)
3. Push the database schema
4. Optionally seed demo content

> `SETUP_COMPLETE` and `ENABLED_MODULES` are stored in the database — you do not need to set them as environment variables.

---

## 2. Staging Setup (Railway + Vercel)

### Step 1 — Railway (Backend)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select this repository; **Root Directory**: leave blank (repo root)
3. Railway will use `railway.json` at the root (DOCKERFILE builder)
4. Add a **PostgreSQL** plugin — Railway auto-injects `DATABASE_URL`
5. Set environment variables (see `backend/.env.staging.example`):
   ```
   JWT_SECRET          = <64-char random string>
   CORS_ORIGINS        = https://your-project.vercel.app
   CORS_VERCEL_PROJECT = your-vercel-project-name
   NODE_ENV            = production
   ```
6. Connect the service to the **`develop`** branch
7. **Watch Paths** (prevents rebuilds on unrelated changes):
   Railway → service → Settings → Watch Paths → add: `backend/**` and `themes/**`

### Step 2 — Vercel (Frontend)

1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Root Directory: `frontend`
3. Environment Variables → **Preview** environment:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.up.railway.app
   ```
4. Vercel auto-deploys a preview URL on every push to `develop`

### Step 3 — GitHub Secrets (for CI workflows)

GitHub → repo → Settings → Secrets → Actions → New secret:

| Secret               | Value                        |
|----------------------|------------------------------|
| `STAGING_API_URL`    | Railway staging service URL  |
| `PRODUCTION_API_URL` | Railway production URL       |

---

## 3. CI/CD Pipeline

### Workflows

| File                       | Trigger             | What it does                                   |
|----------------------------|---------------------|------------------------------------------------|
| `ci.yml`                   | All pushes + PRs    | Validates backend + frontend builds            |
| `deploy-staging.yml`       | Push to `develop`   | Validates build; Railway+Vercel auto-deploy    |
| `deploy-production.yml`    | Push to `main`      | Build validation → **manual approval** → deploy|

### Production Approval Gate

Set up the manual gate so every `main` deploy requires your sign-off:

1. GitHub → repo → **Settings → Environments → New environment** → name: `production`
2. Under **Required reviewers**, add yourself
3. Under **Deployment branches**, select **Selected branches** → add `main`

When someone pushes to `main`:
1. Build validation runs automatically
2. You get an email/notification to approve
3. After approval, Railway + Vercel deploy from `main`

### Branch Protection Rules

GitHub → repo → Settings → Branches → Add rule:

**`main`** (strict):
- ✅ Require PR before merging
- ✅ Require status checks: `Backend Build`, `Frontend Build`
- ✅ Require branches up to date before merging
- ✅ Restrict push to: yourself only

**`develop`** (relaxed):
- ✅ Require status checks: `Backend Build`, `Frontend Build`

---

## 4. Production Setup (when ready)

1. Create a **second Railway service** (same repo) → connect to `main` branch
2. Set production env vars (see `backend/.env.production.example`)
3. Vercel → Project → Settings → Domains → add custom domain
4. Vercel **Production** environment:
   ```
   NEXT_PUBLIC_API_URL = https://api.blendwit.com (or Railway prod URL)
   ```
5. Set `PRODUCTION_API_URL` GitHub secret

---

## 5. Make the Repo Private

**Cannot be done from code** — do it in GitHub:

GitHub → repo → **Settings → Danger Zone → Change visibility → Make private**

After making it private:
- Existing collaborators retain access
- New contributors: GitHub → repo → Settings → Collaborators → Add people
- Paid users receive a license and collaborator invite

---

## 6. Development Workflow

```
main         ← production (protected, requires PR + approval)
  └── develop  ← staging (integration branch)
        └── feature/my-feature  ← your day-to-day work
```

```bash
# Start a new feature
git checkout develop && git pull origin develop
git checkout -b feature/my-feature

# ... develop, commit ...
git push origin feature/my-feature

# Open PR: feature/my-feature → develop
# CI validates, review, merge → auto-deploys to staging

# When staging is stable:
# Open PR: develop → main
# CI validates, merge → approval gate triggers → production deploy
```

---

## 7. Theme Management

### Package a theme for upload
```bash
node scripts/zip-theme.js <theme-slug>
# Example:
node scripts/zip-theme.js cms-starter
# Output: themes/cms-starter.zip
```

Upload via: **Admin → Appearance → Themes → Upload Theme**

### Themes in Docker
`themes/<slug>/` directories with a valid `theme.json` are copied into `/themes/` in the Docker image and appear automatically in the backend.

---

## 8. Ports Reference (Local)

| Service          | Port |
|------------------|------|
| Frontend (Next)  | 3000 |
| Backend (NestJS) | 3001 |
| PostgreSQL        | 5432 |

---

## 9. Troubleshooting

**`prisma generate` fails in Docker**
- Ensure `ARG DATABASE_URL` and `ENV DATABASE_URL` are set in `backend/Dockerfile` — they are, with a CI placeholder value.

**`dist/main.js` not found after build**
- Check `backend/tsconfig.build.json` has `"rootDir": "src"` — this prevents TypeScript from widening the output path to `dist/src/main.js`.

**Themes not showing in dashboard**
- Ensure the Railway root directory is the repo root (not `backend/`) so Docker can `COPY themes/ /themes/`
- Each theme directory must contain a valid `theme.json`

**CORS errors from Vercel to Railway**
- Set `CORS_ORIGINS` in Railway env vars to your Vercel URL
- For Vercel preview URLs: also set `CORS_VERCEL_PROJECT` to your Vercel project name

**Setup wizard shows 500 errors**
- Run "Setup Theme" (Fresh Start) BEFORE clicking "Activate with demo content"
- The demo seed only runs when `setupType === 'FRESH'`
