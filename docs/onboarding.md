# Mero CMS — Customer Onboarding Guide

This guide takes you from a fresh server to a running Mero CMS in under 30 minutes.

---

## Prerequisites

| Requirement | Minimum |
|-------------|---------|
| Server / VPS | 1 vCPU, 1 GB RAM (2 GB recommended) |
| OS | Ubuntu 22.04+ or any Linux with Docker |
| Docker | 24+ with Compose v2 |
| Domain | A domain or subdomain pointing to your server |
| License Key | Obtain from Blendwit after purchase |

---

## Step 1 — Get the code

Pull the latest stable release from the `main` branch (pinned to a version tag):

```bash
git clone --branch v1.2.0 --depth 1 https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
```

> Always pin to a specific tag. Never deploy from `develop`.

---

## Step 2 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in **all required values**:

```env
# Database
DB_USER=admin
DB_PASSWORD=<strong-random-password>
DB_NAME=mero_cms

# Auth — generate with: openssl rand -base64 32
JWT_SECRET=<long-random-string>

# Networking
CORS_ORIGINS=https://cms.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Licensing
LICENSE_KEY=<your-license-key-from-blendwit>

# Organisation prefix for Docker container names
ORG_NAME=yourcompany
```

---

## Step 3 — Start the services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** database
- **Backend** API (applies schema + runs starter seed on first boot)
- **Frontend** admin dashboard

Check everything is running:

```bash
docker compose ps
docker compose logs backend --tail=50
```

---

## Step 4 — Complete the setup wizard

Open your frontend URL in a browser (default: `http://localhost:3000`).

The setup wizard will guide you through:

1. **Create your Super Admin account** — name, email, password
2. **CMS branding** — title, subtitle, login avatar
3. **Select modules** — choose only the features you need
4. **Connect your theme** — upload or activate a built-in theme

After completing the wizard:
- `SETUP_COMPLETE=true` is saved to the database
- Your selected modules are saved to `ENABLED_MODULES`
- The Super Admin account is ready

---

## Step 5 — Invite team members

From the dashboard: **Users → Invite User**

| Role | Access level |
|------|-------------|
| Super Admin | Full access including roles and settings |
| Admin | Content + media + user management |
| Editor | Create and edit content + media upload |
| Author | Create content, view media |

Invited users receive an email with a setup link. The link expires in 48 hours.

---

## Step 6 — Configure your domain (production)

Update your `.env` with real domain values:

```env
CORS_ORIGINS=https://cms.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Then rebuild and restart:

```bash
docker compose down
docker compose up -d --build
```

Set up a reverse proxy (nginx/Caddy) pointing:
- `api.yourdomain.com` → port `3001` (backend)
- `cms.yourdomain.com` → port `3000` (frontend)

---

## Upgrading

To upgrade to a newer version:

```bash
git fetch --tags
git checkout v1.3.0          # or the new version tag
docker compose down
docker compose up -d --build
```

The backend applies any new schema migrations automatically on startup.

---

## License

Your `LICENSE_KEY` controls:

| Feature | Basic | Premium | Enterprise | Custom |
|---------|-------|---------|-----------|--------|
| Blogs, Pages, Menus, Media | ✓ | ✓ | ✓ | ✓ |
| Team, Services, Testimonials, Leads | — | ✓ | ✓ | ✓ |
| SEO, Redirects, Analytics, Sitemap | — | ✓ | ✓ | ✓ |
| Webhooks, Forms | — | ✓ | ✓ | ✓ |
| Collections, Comments | — | — | ✓ | ✓ |

The License tab in **Settings → License** shows your current tier, domain, seat count, and expiry.

To renew or upgrade, contact [Blendwit Tech](https://blendwit.com).

---

## Troubleshooting

### Backend won't start

```bash
docker compose logs backend
```

Common causes:
- `DATABASE_URL` is wrong — check `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` is missing
- Port 3001 is already in use — set `BACKEND_PORT=3002` in `.env`

### Frontend shows blank page

```bash
docker compose logs frontend
```

Common cause: `NEXT_PUBLIC_API_URL` was not set correctly at build time.
Fix: Update `.env` → `docker compose up -d --build frontend`

### Forgot Super Admin password

```bash
docker compose exec backend npx prisma studio
```

In Prisma Studio, find the user and update the `password` field with a new bcrypt hash. Or use the "Forgot Password" flow if SMTP is configured.

### Schema migration failed

```bash
docker compose exec backend npx prisma db push --accept-data-loss
```

---

## Backup

Back up the PostgreSQL volume regularly:

```bash
docker compose exec db pg_dump -U admin mero_cms > backup-$(date +%F).sql
```

Restore:

```bash
cat backup-2026-01-01.sql | docker compose exec -T db psql -U admin mero_cms
```

---

## Support

- Documentation: this file + [`.env.example`](../.env.example)
- Issues: [github.com/BlendWitTech/mero-cms/issues](https://github.com/BlendWitTech/mero-cms/issues)
- Licensing & upgrades: [blendwit.com](https://blendwit.com)
