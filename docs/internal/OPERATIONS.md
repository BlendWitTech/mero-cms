# Operations Runbook

Click-by-click reference for everything you have to do **once**
to wire Mero CMS up on Render + Supabase + Vercel, and what to do
**after** when something goes wrong or a release ships.

This doc is paired with [`BRANCHING.md`](./BRANCHING.md). That one
covers how code flows; this one covers how the infrastructure runs.

**Stack:**

| Layer | Provider | Free tier | Notes |
|---|---|---|---|
| Frontend | Vercel | Yes (Hobby) | No spin-down. Auto-deploys per branch. |
| Backend | Render | Yes (Web Service) | 15-min idle spin-down. Persistent disk requires Starter ($7/mo). |
| Database | Supabase | Yes (500 MB) | Auto-backups, dashboard, point-in-time recovery on Pro. |

---

## First-time setup checklist

Estimated time: ~45 minutes if you have all the tabs ready.

### 1. Create the Supabase database (~10 min)

- Go to [supabase.com](https://supabase.com) and sign up.
- **New Project** → name it `mero-cms-staging` → region closest to
  your testers → set a strong DB password (save it somewhere — you'll
  need it once below).
- Wait ~2 minutes for the project to provision.
- Go to **Project Settings** → **Database** → **Connection string**
  tab → choose **URI** mode → copy the connection string. It looks
  like `postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres`.
- **Important:** also copy the **Connection pooling** URI from the
  same page — that's the one to use in production (port 6543, mode
  `transaction`). The direct connection (5432) is fine for testing.

Save the URI for step 2.

If you'll have a separate production database later, repeat this
step with project name `mero-cms-production`. Otherwise one project
is fine for testing/beta.

### 2. Create the Render backend service (~15 min)

- Go to [render.com](https://render.com) and sign up.
- **New** → **Blueprint** → connect your GitHub repo. Render reads
  `render.yaml` at the repo root and creates the staging service
  automatically.
- If you'd rather click through it manually:
    - **New** → **Web Service** → connect GitHub → pick your repo.
    - Branch: `develop`.
    - Runtime: Docker. Render auto-detects `backend/Dockerfile`.
    - Plan: **Free**.
    - Service name: `mero-cms-backend-staging`.

**Set environment variables** (Render dashboard → your service →
**Environment** tab → **Add Environment Variable**):

  | Variable | Value | Why |
  |---|---|---|
  | `DATABASE_URL` | Supabase connection string from step 1 | Backend Prisma connection |
  | `JWT_SECRET` | Run `openssl rand -base64 32` locally and paste it | Signs auth + license tokens. **Set once and never change.** Without this on free tier, sessions invalidate every time the service spins up. |
  | `NODE_ENV` | `production` | Disables verbose logs |
  | `MERO_DATA_DIR` | `/app/data` | Only useful on paid plans (free tier has no persistent disk; see caveat below) |
  | `CORS_ORIGINS` | _leave empty for now_ | Will set after Vercel step |
  | `PORT` | `3001` | Backend listens here |

Click **Save Changes**. Render redeploys automatically (~3 minutes).

**Free tier caveat — read this:**

Render's free Web Service has **no persistent disk**. So:

- `secrets.json` and `setup.json` get wiped on every redeploy or
  spin-down/spin-up cycle. We work around this by setting
  `JWT_SECRET` as an explicit env var (overrides auto-generation)
  and storing the customer's saved license key as `LICENSE_KEY`
  env var (set after the wizard runs once).
- `backend/uploads/` (the local-disk media library) is also wiped.
  For testing this is OK; for production you'd switch the storage
  step in the wizard to S3/R2/Supabase Storage so uploads persist.
- The 15-minute idle spin-down means the first request after
  inactivity takes 30-60 seconds. Real testers using the demo
  regularly never hit this; cold-link clickers see a slow first load.

When you outgrow free tier — paying customers, can't tolerate cold
starts — bump the plan to **Starter ($7/mo)**. That gives you an
always-on service AND a persistent disk you can mount at `/app/data`,
which fixes both issues. The render.yaml has the production block
ready to uncomment.

**Note your staging URL:**

Render shows it on the service page (something like
`mero-cms-backend-staging.onrender.com`). Copy it.

### 3. Set up Vercel (~10 min)

- Go to [vercel.com](https://vercel.com) and sign up.
- **Add New** → **Project** → import your GitHub repo.
- **Important:** in **Configure Project**, set **Root Directory**
  to `frontend`. (Vercel auto-detects Next.js after that.)
- Under **Environment Variables** add:

  | Variable | Value | Apply to |
  |---|---|---|
  | `NEXT_PUBLIC_API_URL` | The Render URL from step 2 | Preview + Production |

- Click **Deploy**. First deploy takes ~3 minutes.
- Copy the URL (`mero-cms.vercel.app` or similar). Save for step 4.

### 4. Wire CORS back to Render (~2 min)

- Render → backend service → **Environment** tab.
- Edit `CORS_ORIGINS`. Paste:
  ```
  https://mero-cms.vercel.app,https://mero-cms-git-develop-<team>.vercel.app
  ```
- Replace with your actual Vercel URLs. The second is the preview
  URL pattern — `<team>` is your Vercel team slug, copy it from any
  preview URL Vercel emits.
- If you'll add a custom domain later, add that too.
- Save. Render redeploys automatically.

### 5. Add GitHub Actions secrets (~5 min)

Repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**:

  | Secret | Value |
  |---|---|
  | `STAGING_API_URL` | Render staging URL (e.g. `https://mero-cms-backend-staging.onrender.com`) |
  | `PRODUCTION_API_URL` | Render production URL (set when you create that service later) |
  | `VERCEL_PROJECT` | Your Vercel project slug (e.g. `mero-cms`) — used for PR preview URL prediction |

### 6. Set up GitHub Environments (~5 min)

- Repo → **Settings** → **Environments** → **New environment**.
- Name: `production`.
- Tick **Required reviewers** and add yourself.
- Click **Save**.

This is what makes the manual approval gate work for production
deploys.

### 7. (Later) Production environment (~10 min)

When you're ready for paying customers:

- Bump the staging service to **Starter ($7/mo)** OR create a second
  Render service for `main` branch. Easiest is to uncomment the
  production block in `render.yaml` and re-blueprint.
- Create a separate Supabase project for production data — never
  point staging at production data.
- Update `PRODUCTION_API_URL` GitHub secret with the new Render URL.
- In Vercel, set `NEXT_PUBLIC_API_URL` for the **Production**
  environment specifically (Vercel supports per-environment env vars).

If you skip prod for now, beta-testing on the staging environment
alone is fine. You can run real customers on staging until they
complain about cold starts.

### 8. Branch protection rules (~3 min)

Repo → **Settings** → **Branches** → **Add rule**.

For `main`:
- Require pull request before merging.
- Require status checks: tick `Backend Build`, `Frontend Build`,
  `Demo App Build`.
- Require conversation resolution: yes.

For `develop`:
- Require status checks. Skip the rest for fast iteration.

### 9. Custom domain (optional, ~10 min)

For your customer-facing URLs:

- **Frontend on Vercel:** Project → **Settings** → **Domains** →
  Add. Point a CNAME at `cname.vercel-dns.com` from your registrar.
  Vercel handles SSL automatically.
- **Backend (API) on Render:** backend service → **Settings** →
  **Custom Domains** → Add. Render shows you a CNAME to add.
- After DNS propagates: update `CORS_ORIGINS` (Render) and
  `NEXT_PUBLIC_API_URL` (Vercel).

---

## Daily ops

### "I pushed to develop, where do I see the deploy?"

- **CI status:** GitHub repo → **Actions** tab → most recent run.
- **Backend deploy:** Render dashboard → your service → **Events**
  tab. Latest deploy is at the top.
- **Frontend deploy:** Vercel dashboard → your project. Latest
  deploy is at the top with the preview URL.

Both Render and Vercel auto-deploy from `develop` via their GitHub
integrations — they don't need anything from CI to run.

### "I want to ship to production"

- Open a PR from `develop` → `main`.
- Wait for CI to pass.
- Get a review (or self-approve if solo).
- Merge.
- GitHub → **Actions** → find the `Deploy — Production` workflow.
- It pauses on the **Await Production Approval** job.
- Click **Review deployments** → tick `production` → **Approve and
  deploy**.
- Watch Render + Vercel deploy.

### "I want to cut a versioned release"

```
git switch main && git pull
# Update CHANGELOG.md
git tag v1.2.3
git push origin v1.2.3
```

`release.yml` fires:
- Backend + frontend Docker images pushed to GHCR.
- (Once we extend it) a versioned source bundle `.zip` attached to
  the GitHub Release.
- Changelog auto-generated from commit messages.

---

## Reading logs

| What | Where |
|---|---|
| Backend runtime logs | Render → backend service → **Logs** tab (live tail) |
| Frontend runtime logs (server-rendered pages) | Vercel → project → **Logs** tab |
| Frontend runtime logs (browser) | Customer's DevTools console |
| Build logs (CI) | GitHub Actions run for the commit |
| Build logs (Render) | Render → backend service → **Events** → click a deploy |
| Build logs (Vercel) | Vercel deployment → **Build Logs** tab |
| Postgres queries | Supabase → project → **SQL Editor** for ad-hoc, or **Database** → **Logs** for slow query detection |
| Webhook delivery (Khalti/Stripe/eSewa) | Provider dashboard → Developers → Webhooks → recent deliveries |
| Email delivery | Settings → Email Services in admin (test connection) — for live sends, your SMTP/Resend dashboard |

---

## Rollback procedures

### Roll back the backend (Render)

- Render → backend service → **Events** tab.
- Find the last good deploy → click **Rollback to this deploy**.
- Takes ~30 seconds. Migrations don't roll back automatically; if a
  deploy added a Prisma migration that's now wrong, you'll need to
  manually restore the DB from a Supabase backup or push a new
  migration.

### Roll back the frontend (Vercel)

- Vercel → project → **Deployments**.
- Find the last good production deploy → **⋯** → **Promote to
  Production**. Instant zero-downtime swap.
- Vercel keeps deploys forever, so this is true zero-downtime
  rollback.

### Roll back a release tag

You don't roll back tags — you ship a new one. If `v1.2.3` breaks
production:

```
git switch main && git pull
# Revert or fix
git commit -m "Revert: <thing that broke>"
git tag v1.2.4
git push origin main v1.2.4
```

### Database point-in-time restore

Supabase free tier has daily backups (kept 7 days). Pro tier has
PITR (any moment in the last 7 days). To restore:

- Supabase → project → **Database** → **Backups** → pick a backup →
  **Restore**.
- This creates a new Supabase project pointing at the restored
  data; you switch by updating `DATABASE_URL` on Render to the new
  project's connection string.

---

## Known gotchas

**Render free tier wakes slowly.**
After 15 minutes of no traffic, the service sleeps. The first
request after a sleep takes 30-60 seconds while the container
starts. Real testers using the product won't hit this; ad-hoc
visitors clicking the URL cold will. If this becomes a problem:
either upgrade to Starter ($7/mo, no spin-down) or set up an
external pinger (e.g. UptimeRobot every 10 minutes) to keep the
service warm. **Don't** rely on internal cron jobs to ping itself
— the cron only fires while the service is awake.

**Render free tier has no persistent disk.**
`secrets.json`, `setup.json`, and `backend/uploads/` are wiped on
every wake. Workaround:
- Set `JWT_SECRET` as an explicit env var (so it doesn't regenerate).
- After the wizard runs once, copy the saved license key from the
  DB and set it as `LICENSE_KEY` env var (so subsequent wakes have
  it pre-loaded without the wizard re-prompting).
- For uploads, switch the wizard's storage step to S3/R2/Supabase
  Storage. Local disk is unreliable on free tier.

**Supabase connection limit.**
Free tier has 60 concurrent connections via the direct port (5432)
and 200 via the pooler (6543). NestJS keeps a connection pool — if
you see "too many connections" in logs, switch `DATABASE_URL` to the
**Connection Pooling** URI from Supabase (port 6543, mode
`transaction`).

**Vercel preview URLs change per PR.**
Don't hard-code preview URLs in `CORS_ORIGINS`. Use the
`CORS_VERCEL_PROJECT` env var pattern that the backend's main.ts
already supports — match by project slug instead of full URL.

**Wizard `setup.json` collision between staging and prod.**
Each Render service has its own (or no) volume; they don't share.
Inside one environment, the wizard refuses to re-run after first
completion — to re-test, do **Settings → Danger Zone → Factory
reset** in the admin UI.

**Render auto-deploy doesn't run migrations.**
The backend's Dockerfile runs `npx prisma db push --accept-data-loss`
on startup, which handles fresh schemas fine. But for schema changes
on an existing DB with data, you want `prisma migrate deploy` not
`db push`. We'll add a `release.yml` step that runs migrations
before flipping traffic when we're closer to a real production.

**The `/setup/progress` SSE channel is unauthed.**
Anyone who can reach the staging API can watch your setup logs.
Not a security issue (events are operational metadata only, no
secrets), but a privacy concern in a multi-tenant world. For
testing/beta this is fine. Lock it down before going GA.

---

## When something is broken

1. **Frontend won't load:** check Vercel logs first, then verify
   `NEXT_PUBLIC_API_URL` is right, then check the backend is up.
2. **Frontend loads but API calls fail with CORS error:** check
   `CORS_ORIGINS` on Render. The browser console will tell you
   exactly which origin was rejected — make sure it's whitelisted.
3. **First request takes 60 seconds:** Render free tier waking up.
   Either wait, or pay $7/mo for always-on.
4. **CI fails on PR:** open the failing job in GitHub Actions,
   scroll to the red step. Backend Build failures are usually
   Prisma schema or TS type errors; Frontend Build failures are
   usually missing props or wrong import paths.
5. **Render deploy hangs at "Building":** check the build logs.
   Most often a stale `package-lock.json`. Run `npm install`
   locally, commit the updated lockfile, push.
6. **Backend says "no JWT_SECRET":** the env var isn't set. Add it
   to Render's Environment tab and let it redeploy.
7. **Supabase says "too many connections":** switch to the pooler
   URI (port 6543) in `DATABASE_URL`.
8. **Email isn't sending in production:** check Settings → Email
   Services → Test Connection in the admin UI. Auth failure is
   the #1 cause; for Gmail you need an "app password" not your
   real password.
9. **Customer says download link is expired:** they hit
   `POST /downloads/refresh` with their license key. The endpoint
   exists; we just don't have a UI for it yet. Manual workaround:
   you mint a token via the admin or directly via the DB.

If none of those help, the runbook has failed you — open an issue
in the repo so someone can update this doc.
