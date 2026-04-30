# Branching & Release Strategy

This is the source of truth for how code flows from a developer's
laptop to a paying customer's site. Read this before pushing,
merging, tagging, or deploying.

---

## The model — develop → main → tag

We use a **two-branch + tag** model. No `testing`, no `production`,
no `staging`. Just:

| Branch / ref | Purpose | Auto-deploys to |
|---|---|---|
| `develop` | Default branch. Active development, integration target for feature branches. | Render staging service + Vercel preview |
| `main` | Production-ready trunk. Only stuff that's been tested on staging lands here. | Render production service + Vercel production (via manual approval gate) |
| `v1.2.3` tags | Cut releases — ship Docker images to GHCR, generate downloadable bundles attached to a GitHub Release. | GHCR (`ghcr.io/blendwittech/mero-cms/...`) + GitHub Releases page |
| Feature branches | Anything you push for a PR. `feature/foo`, `fix/bar`, etc. | CI only (build validation). PR comment links the Vercel preview. |

The earlier `testing` and `production` branches mentioned in older
docs are gone. The legacy `deploy.yml` workflow that fired on
`production` was deleted — `deploy-production.yml` (which fires on
`main` with a manual approval gate) is the one true production
deploy.

---

## Day-to-day flow

### Building a feature

```
1. git switch develop && git pull
2. git switch -c feature/your-feature-name
3. ... edit, commit ...
4. git push -u origin feature/your-feature-name
5. Open PR to develop
6. CI runs (.github/workflows/ci.yml) — must pass
7. Vercel posts a preview URL on the PR
8. Reviewer approves, you merge to develop
9. develop auto-deploys to Render staging + Vercel
10. Verify on staging URL
```

### Releasing to production

```
1. Once develop is solid (you've tested on staging),
   open PR from develop → main
2. CI runs again
3. Reviewer approves, you merge to main
4. deploy-production.yml fires → validates build → pauses at the
   "production" environment for manual approval
5. You go to GitHub → Actions → Review deployments → Approve
6. Render + Vercel deploy to production
7. Verify on production URL
```

### Cutting a versioned release (Docker images + customer download bundle)

```
1. Make sure main is at the commit you want to ship
2. git switch main && git pull
3. Update CHANGELOG.md with what's in this release
4. git tag v1.2.3
5. git push origin v1.2.3
6. release.yml fires:
     - Builds backend + frontend Docker images, pushes to GHCR
     - Generates a versioned source bundle .zip
     - Creates a GitHub Release with the changelog and download links
7. Set MERO_RELEASE_BUNDLE_PATH on production Render to the new
   bundle so customer downloads (via /downloads/:token) get the
   tagged version, not a moving target
```

### Hotfixing production

If production is broken and you need to ship a fix without going
through develop:

```
1. git switch -c hotfix/the-thing-that-broke main
2. ... fix it, commit ...
3. git push -u origin hotfix/the-thing-that-broke
4. Open PR to main directly
5. CI runs, reviewer approves, you merge
6. Production deploys (with the manual approval gate)
7. After hotfix is live, cherry-pick or merge the same fix back to
   develop so it doesn't get re-clobbered on next develop → main
```

Hotfixes should be rare. If they're frequent, your testing on
develop/staging is too shallow.

---

## Branch protection rules

These are configured in **Settings → Branches** on GitHub. You set
them up once and they stay:

**`main` (production trunk):**
- Require a pull request before merging.
- Require status checks to pass before merging — specifically the
  `Backend Build`, `Frontend Build`, and `Demo App Build` jobs from
  `ci.yml`.
- Require conversation resolution before merging.
- Restrict who can push directly (you only — admin override for
  emergencies).

**`develop` (integration):**
- Require status checks to pass.
- Don't require PRs (faster iteration; trust developers to not push
  broken stuff).
- Or, if you have a team: require PRs here too, but skip the
  conversation-resolution requirement.

---

## Environment naming

Within Render and Vercel, use this naming so monitoring and
dashboards stay readable:

| Environment | Render service | Vercel deployment | URL pattern |
|---|---|---|---|
| Staging | `mero-cms-backend-staging` | preview deployment of `develop` | `mero-cms-backend-staging.onrender.com`, `mero-cms-git-develop-<team>.vercel.app` |
| Production | `mero-cms-backend-production` | production deployment of `main` | `mero-cms-backend-production.onrender.com` (or custom domain), `mero-cms.vercel.app` (or custom domain) |
| Preview | (none — staging is shared) | per-PR preview | `mero-cms-git-<branch>-<team>.vercel.app` |

Both staging and production point at separate Postgres databases
(provisioned by Render). Never point a staging backend at the
production database — it's the fastest way to wipe customer data.

---

## Secrets per environment

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Used by | What it is |
|---|---|---|
| `STAGING_API_URL` | `deploy-staging.yml` | Render staging backend URL |
| `PRODUCTION_API_URL` | `deploy-production.yml` | Render production backend URL |
| `VERCEL_PROJECT` | `pr-preview-comment.yml` | Vercel project name (for preview URL prediction) |

**Service-level env vars** (set inside Render and Vercel, not in
GitHub) — see [`OPERATIONS.md`](./OPERATIONS.md) for the full list.

---

## Why this model and not GitFlow / trunk-based / something fancier

We picked the simplest possible model that gives:

- **A safety net before production** (`develop` auto-deploys to a
  staging environment so you catch bad changes before they hit
  customers).
- **A clean release marker** (semver tags from `main` are the
  shippable artefacts; nothing else is "released").
- **A manual gate on production** (the `production` GitHub
  Environment requires you to click Approve).

GitFlow's `release/`, `hotfix/`, and `feature/` ceremony is
overkill at our team size. Trunk-based requires feature flags +
mature testing infrastructure we don't have yet. This model lands
in the middle and rewards us for keeping develop close to main.

---

## When to revisit this

Review this doc whenever:

- You add a new long-lived environment (e.g., a separate `qa`
  environment for a partner agency).
- You hire a second engineer and need stricter merge rules on
  `develop`.
- You start running automated end-to-end tests and want them gating
  the staging→production promotion.

Until then, keep it as-is. Process complexity is debt.
