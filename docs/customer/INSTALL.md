# Mero CMS — Installation Guide

Welcome, and thank you for purchasing Mero CMS. This guide walks you through every step of getting your website live, regardless of your technical background. Read the first section ("Choose your path") to figure out which option fits you, then jump to the matching chapter.

---

## What you bought

Mero CMS is a self-hostable content management system — think of it as the engine that powers your website's blog, pages, navigation, forms, media library, and admin dashboard. Your license unlocks specific features depending on the tier you purchased:

- **Personal Basic / Org Basic** — single site, blog, pages, forms, basic SEO.
- **Personal Premium / Org Premium** — adds analytics, redirects, sitemap, multi-author publishing.
- **Personal Pro / Org Enterprise** — adds advanced widgets (Carousel, VideoEmbed, Gallery, Accordion, Tabs, Countdown, PricingTable, ComparisonTable), white-labelling, API keys, audit log.
- **Custom** — everything above plus custom theme bundles and unlimited customisation.

Your license key was emailed to you after checkout. Keep it safe — you'll paste it into the setup wizard during installation.

---

## Choose your path

There are four ways to install Mero CMS, ordered from easiest to most technical. Pick the one that matches your situation.

### Path 1 — Mero Cloud (we host it for you)

**Best for:** anyone who doesn't want to manage servers, install software, or learn anything technical.

You get a hosted Mero CMS at a `your-name.merocms.com` (or your custom domain) URL. Sign up, paste your license key, you're in. Backups, updates, security patches, and uptime are our problem, not yours.

→ **Skip to [Path 1 — Mero Cloud](#path-1--mero-cloud-detailed) below.**

### Path 2 — Hire help (agency or freelancer)

**Best for:** anyone who wants to own their own server and data, but doesn't want to do the install themselves.

You pay an agency, freelance developer, or your IT person a one-time setup fee. They install Mero on a server you choose, hand you admin credentials, and you're done. Most agencies charge a flat fee for this.

→ **Skip to [Path 2 — Managed install](#path-2--managed-install-detailed) below.**

### Path 3 — Self-host on a server (VPS)

**Best for:** small businesses or technical-ish owners who want full control. Requires some terminal comfort.

You rent a VPS (DigitalOcean, Linode, Hetzner, Vultr — typically $5–$20/month), install Mero on it, point your domain at it. You own everything; you also handle backups, SSL renewal, and updates.

→ **Skip to [Path 3 — VPS self-host](#path-3--vps-self-host-detailed) below.**

### Path 4 — Run on your own computer (for testing)

**Best for:** developers and people who want to try Mero locally before committing to a host.

This is the developer path. You install Node.js and run the project on your laptop. It only runs while your computer is on, so this is for evaluation or development, not for serving real traffic.

→ **Skip to [Path 4 — Local self-host](#path-4--local-self-host-detailed) below.**

---

## Path 1 — Mero Cloud (detailed)

The simplest path. You never touch a server, terminal, or config file.

### Step 1 — Sign up

Open https://merocms.com/cloud (or whichever sign-up URL was in your purchase email).

Pick the same tier you purchased a license for. The cloud subscription covers hosting; your perpetual license covers the software. Some plans bundle both — check your invoice.

### Step 2 — Choose your domain

You can use:

- A free `your-name.merocms.com` subdomain (instant, no DNS work).
- Your own domain (`example.com`). After signing up, you'll get a CNAME or A record to add at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.). Allow up to 24 hours for DNS to propagate; usually it's much faster.

### Step 3 — Activate your license

In the Cloud onboarding, paste the license key from your purchase email. The system verifies it on the spot and unlocks all features for your tier.

### Step 4 — Run the setup wizard

You'll be redirected to a `/setup` page in your browser. Walk through the five short steps:

1. **Site & Admin** — name your site, create your admin account.
2. **Site Configuration** — your public URL, optional email service, optional file storage. Skip whatever you don't have ready.
3. **License & Modules** — your license is already loaded. Pick which modules to enable (blog, forms, services, testimonials, etc.).
4. **Complete** — a streaming progress terminal shows the install. Takes 10–30 seconds.

When the terminal says complete, you're in. Log in with the admin account you just created and start building your site.

### What you don't need to do

You don't install anything. You don't run any commands. You don't manage backups, SSL, security updates, or scaling — that's all included.

---

## Path 2 — Managed install (detailed)

You hire an agency, freelancer, or IT contact to install Mero CMS for you on a server you own.

### Step 1 — Decide where it'll live

Common options:

- **A VPS** ($5–$20/month) — DigitalOcean, Linode, Hetzner, Vultr. Most agencies prefer this. You'll own a tiny Linux server somewhere.
- **A managed Node.js host** — Railway, Render, Fly.io. Higher cost ($10–$50/month) but easier to manage.
- **An existing server you already have** — your office's Linux box, a Raspberry Pi, etc. Works as long as it can install Node.js 20+ and Postgres.

Your installer will tell you what they recommend.

### Step 2 — Send the installer your license key

Forward the license key from your purchase email to your installer. They'll need it to activate your tier during the wizard.

### Step 3 — Send them this guide

Hand them this same INSTALL.md and tell them to follow Path 3 (VPS self-host). Or if they already know Mero or want to use Docker / Cloud-native deploys, they can pick whichever path works for them.

### Step 4 — Get your credentials

When they're done, you'll receive:

- The URL of your site (`https://yourdomain.com`).
- The admin login URL (`https://yourdomain.com/login`).
- Your admin email and a one-time temporary password (change it immediately).

That's it. From here on, every change to your site happens in the browser-based admin dashboard.

### Typical agency cost

Setup is usually one-time $50–$300 depending on:

- Whether you bring your own VPS or they provision one.
- Whether you need DNS/email/SSL configuration.
- Whether you need theme customisation on top of install.

Ongoing maintenance (backups, updates, security patches) is sometimes a small monthly retainer. Negotiate this upfront.

---

## Path 3 — VPS self-host (detailed)

You'll provision a small Linux server, install Mero on it, point your domain at it, and run it as a service. This requires comfort with the command line and basic Linux skills.

### Step 1 — Provision a server

Sign up at any VPS provider. Recommended specs:

- **OS:** Ubuntu 22.04 or 24.04 LTS.
- **CPU:** 2 vCPU.
- **RAM:** 2 GB minimum, 4 GB recommended.
- **Disk:** 25 GB SSD.
- **Cost:** ~$10–$15/month at most providers.

When you create the server, save the IP address and SSH credentials.

### Step 2 — SSH in

From your computer:

```bash
ssh root@your-server-ip
```

(Replace with your actual IP. On Windows, use Windows Terminal or PuTTY.)

### Step 3 — Install Node.js, Postgres, and Git

Once logged into the server:

```bash
# Update package list
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Install Git
apt install -y git

# Verify versions
node -v    # should print v20.x.x
psql --version    # should print 15.x or later
```

### Step 4 — Create the database

```bash
sudo -u postgres psql -c "CREATE DATABASE mero_cms;"
sudo -u postgres psql -c "CREATE USER mero WITH ENCRYPTED PASSWORD 'pick-a-strong-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mero_cms TO mero;"
```

Replace `pick-a-strong-password` with something actually strong. Save it — the wizard will need it.

### Step 5 — Clone Mero CMS

```bash
cd /opt
git clone https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
npm run setup
```

`npm run setup` installs everything and takes a few minutes the first time.

### Step 6 — Set the database connection

Create a file at `/opt/mero-cms/backend/.env` with one line:

```
DATABASE_URL="postgresql://mero:pick-a-strong-password@localhost:5432/mero_cms"
```

Replace the password to match what you set in Step 4.

### Step 7 — Run a process manager

Install PM2, which keeps Mero running even after you log out and restarts it on crashes:

```bash
npm install -g pm2

cd /opt/mero-cms
pm2 start npm --name mero-cms -- run start:prod
pm2 startup        # follow the on-screen instructions to enable on boot
pm2 save
```

### Step 8 — Set up a reverse proxy

Install Nginx so people can reach your site at `yourdomain.com` instead of `your-server-ip:3000`:

```bash
apt install -y nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/mero-cms <<'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

ln -s /etc/nginx/sites-available/mero-cms /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Replace `yourdomain.com` with your actual domain (twice, in `server_name`).

### Step 9 — Point your domain at the server

At your domain registrar, create an A record:

- **Name:** `@` (or blank).
- **Value:** your server's IP address.
- **TTL:** 3600 or whatever default.

If you want `www.` as well, add another A record with `Name: www`. Wait 5–60 minutes for DNS to propagate.

### Step 10 — Enable HTTPS

Once DNS resolves to your server:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will ask for an email, accept the terms, and offer to redirect HTTP to HTTPS — say yes. Renewal happens automatically.

### Step 11 — Run the setup wizard

Open `https://yourdomain.com/setup` in your browser. Walk through the five steps. The Database step will be auto-skipped because Mero detects the `DATABASE_URL` you set in `.env`.

When the wizard's terminal finishes, log in at `https://yourdomain.com/login` with the admin account you just created.

### Backups

Set up a nightly backup of your Postgres database. The simplest cron job:

```bash
mkdir -p /opt/backups
crontab -e
```

Add this line:

```
0 2 * * * pg_dump -U mero mero_cms | gzip > /opt/backups/mero-$(date +\%F).sql.gz
```

This runs at 2 AM daily. Periodically copy `/opt/backups/` somewhere off-server (S3, your laptop, anywhere).

### Updates

When a new Mero release comes out:

```bash
cd /opt/mero-cms
git pull
npm run setup
pm2 restart mero-cms
```

---

## Path 4 — Local self-host (detailed)

This is for trying Mero on your laptop before committing to a real install. It only runs while your laptop is on.

### Prerequisites

- **Node.js 20 or later** — download from https://nodejs.org. Pick the LTS version.
- **Git** — download from https://git-scm.com.
- **Either Docker Desktop** — download from https://docker.com — *or* a Postgres server you can connect to.

### Step 1 — Clone

Open Terminal (macOS / Linux) or PowerShell (Windows) and run:

```bash
git clone https://github.com/BlendWitTech/mero-cms.git
cd mero-cms
```

### Step 2 — Install

```bash
npm run setup
```

This installs all dependencies. First run takes a few minutes.

### Step 3 — Start everything

```bash
npm run dev:all
```

This starts:

- Postgres (in a Docker container, if Docker is running).
- The backend at http://localhost:3001.
- The frontend at http://localhost:3000.
- The active theme dev server at http://localhost:3002.

If you're not using Docker, set up Postgres yourself first and put a `DATABASE_URL` in `backend/.env` pointing at it.

### Step 4 — Run the wizard

Open http://localhost:3000/setup in your browser. Walk through the five steps. Done.

### Stopping

In the Terminal where `dev:all` is running, press `Ctrl+C`. To start again, just run `npm run dev:all`.

---

## The setup wizard (all paths end here)

Regardless of how you got Mero installed, the first time you open `/setup` in your browser, you'll see a five-step wizard. Here's what each step does:

### Step 1 — Site & Admin

- **Site name** — what to call your site. Shows up in the browser tab and email templates. Editable later.
- **Admin name** — your full name as the site owner.
- **Admin email** — used for login and password resets.
- **Password** — at least 8 characters. You'll use this to log in.

### Step 2 — Database

If your database is already configured (env var or Cloud), this step is auto-skipped with a green "Database detected" banner.

If not, fill in:

- **Host** — usually `localhost`.
- **Port** — usually `5432`.
- **Database name** — the database you created.
- **Username / password** — the database user's credentials.

Click *Test connection*. Once it succeeds, click *Save & migrate*.

### Step 3 — Site Configuration

Three sections, each skippable:

- **Site URL** — the public URL of your site. Pre-filled from your browser; usually correct.
- **Email Service** — for password resets, invitations, form submissions. Pick *SMTP* (any email provider) or *Resend* (recommended — free tier, easy setup at resend.com). Skip for now if you don't have credentials yet — you can add them in Settings → Email later.
- **Storage** — pick *Local disk* unless you want to use S3 / Cloudflare R2 / Minio for media files. Local works fine for most sites.

Click *Continue* to save and move on.

### Step 4 — License & Modules

- **License key** — paste the key from your purchase email and click *Verify*. The system confirms your tier and unlocks the corresponding features.
- **Modules** — tick the modules you want enabled (blog, forms, services, testimonials, redirects, sitemap, etc.). Locked modules require a higher tier; visible but greyed out.

### Step 5 — Complete

A terminal-style log streams in real time as Mero builds your database schema, creates your admin user, persists your settings, and writes the env file. Takes 10–30 seconds depending on your hardware.

When you see `✓ setup    Setup complete`, you're done. You'll be redirected to the login page or your dashboard automatically.

---

## After setup — first steps in the dashboard

Log in at `/login` with the email and password from Step 1. Things you'll likely want to do first:

1. **Settings → Branding** — upload your logo, set primary colour, add your tagline.
2. **Themes** — preview the available themes and click *Activate* on the one you want. The active theme determines what your homepage and pages look like.
3. **Pages** (or *Site → Pages*) — edit the homepage and About page. The visual editor lets you click any section to edit it inline.
4. **Settings → Email Services** — if you skipped email setup in the wizard, configure it now so password resets and invitations work.
5. **Settings → Site URL** — confirm your public URL is correct (auto-filled from the wizard).

If anything goes wrong or you want to start over: **Settings → Danger Zone** has three actions:

- **Reinstall theme** — re-imports the active theme's seed content. Use this if your homepage looks broken.
- **Reset content** — wipes pages, posts, menus, but keeps users and settings. Use this when handing the install to a new owner.
- **Factory reset** — wipes everything and re-runs the setup wizard. Nuclear option.

Each action streams progress in the same terminal-style panel as the original wizard.

---

## Troubleshooting

### "Cannot connect to database"

- Check that Postgres is running (`systemctl status postgresql` on a VPS, or look for the Docker container).
- Check that the `DATABASE_URL` is right — username, password, hostname (use `localhost` if Postgres is on the same machine, NOT the public IP).
- Check that the database user has permission (rerun the `GRANT ALL PRIVILEGES` line from Step 4 of Path 3).

### "Invalid license key"

- Make sure you copied the entire key, including any dashes or trailing characters. License keys are long.
- Make sure your system clock is roughly correct — license verification checks the issued-at date.
- If still failing, contact support — we can re-issue your key.

### "Setup wizard says setup is already complete"

This means someone (maybe a previous run) already finished setup against this database. You have two options:

- Log in normally at `/login` with whatever credentials were created.
- Or run **Settings → Danger Zone → Factory reset** (if you can log in) to wipe and start over.

### "Email isn't sending"

- Check your SMTP credentials in Settings → Email Services. Click *Test connection* — it tells you exactly what's wrong (auth failure, timeout, hostname not found).
- Some email providers (Gmail, Yahoo) require an "app password" instead of your normal password. Generate one in your provider's security settings.
- If using Resend, check that your sending domain is verified at resend.com.

### "Frontend says 'Network error' or 'API unreachable'"

- Check that the backend is running. On a VPS: `pm2 status` should show `mero-cms` as `online`.
- Check the `CORS_ORIGINS` env var includes your domain. Default allows `http://localhost:3000`. For your domain, set it explicitly.

### "Terminal/streaming logs hang on first wizard run"

- This usually means your browser is blocking Server-Sent Events. Try a different browser (Chrome, Firefox, Safari all work). Some corporate networks block long-lived HTTP connections.

### Everything else

Email **support@blendwit.com** with:

- Which path you're on (1, 2, 3, or 4).
- The exact step that failed.
- Any error message you see (copy-paste, don't paraphrase).
- Your operating system and Node.js version (`node -v`).

We'll get back to you within one business day.

---

## License terms (quick reference)

- Your license is **perpetual** for the version you purchased. You can use this version forever.
- **Updates** are free for one year from purchase, then $10–$50/year for ongoing updates depending on tier.
- **You may** install on as many of your own servers as you like (no per-install limit on Personal tiers; check your tier for org limits).
- **You may not** redistribute, resell, or sublicense the source code.
- **You may** customise the code for your own use.
- **Source access** is included on all tiers — you have the full source on your server.

The full license text is in `LICENSE.md` in the repository.

---

## Need help?

- **Email:** support@blendwit.com
- **Documentation:** https://docs.merocms.com
- **Community forum:** https://community.merocms.com (if available for your tier)
- **Premium support:** included on Pro and Enterprise tiers — email response within 4 business hours.

Welcome to Mero CMS. Have fun building.
