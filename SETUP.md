# Setup Guide — Mero CMS

## Prerequisites

- **Node.js** v20+
- **npm** v10+
- **PostgreSQL** database (local, Docker, or hosted)

---

## Option A — Local Development

### 1. Clone and install

```bash
git clone https://github.com/BlendWitTech/blendwit-cms-saas.git
cd blendwit-cms-saas
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mero_cms?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=3001
CORS_ORIGINS="http://localhost:3000,http://localhost:3002"
```

### 3. Start a local PostgreSQL database (infrastructure only)

```bash
docker-compose up -d db pgadmin
```

This starts PostgreSQL on port `5432` and pgAdmin on port `5050`. Note that the frontend and backend are intended to be run locally in this mode for the best development experience.

### 4. Start development servers

```bash
npm run dev
```

- **Admin UI** → http://localhost:3000
- **Backend API** → http://localhost:3001

### 5. Run the setup wizard

Open **http://localhost:3000/setup** in your browser.

The wizard will:
1. Ask for your site name and admin credentials
2. Let you select modules (blogs, portfolio, themes, etc.)
3. Build a minimal Prisma schema for your selections
4. Push the schema to the database (creates only the tables you need)
5. Create your admin account with a Super Admin role
6. Restart the server with your modules active

After the wizard completes, you're redirected to the login page at **http://localhost:3000**.

### 6. Apply a theme (optional)

1. Log in to the dashboard
2. Go to **Themes**
3. Click **Setup** on a theme to seed its content (menus, posts, testimonials, media)
4. Click **Activate** to mark it as the active theme
5. Set the **Deployed URL** to your theme's running address

To start the included marketing theme:

```bash
npm run dev:theme
# Runs on http://localhost:3002
```

---

## Option B — Docker (All Services Containerized)

This option runs the entire stack (Admin UI, Backend API, and Database) inside Docker. This is useful for testing the production-like environment.

### 1. Clone and configure

```bash
git clone https://github.com/BlendWitTech/blendwit-cms-saas.git
cd blendwit-cms-saas
cp backend/.env.example backend/.env
```

Edit `backend/.env` — update `JWT_SECRET` at minimum.

### 2. Start all containers

```bash
docker-compose up -d
```

Services started:
| Service | URL |
|---|---|
| Admin UI | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| pgAdmin | http://localhost:5050 |

### 3. Run the setup wizard

Open **http://localhost:3000/setup** — same steps as above.

> **Note:** After the wizard completes and calls `process.exit(0)`, Docker's `restart: always` policy automatically brings the backend container back up.

### Customising Docker defaults

Create a `.env` file at the project root:

```env
ORG_NAME=mycompany
DB_USER=admin
DB_PASSWORD=strongpassword
DB_NAME=mycompany_cms
JWT_SECRET=very-long-secret-here
PGADMIN_EMAIL=admin@mycompany.com
PGADMIN_PASSWORD=pgadminpassword
CORS_ORIGINS=https://mycompany.com,https://cms.mycompany.com
NEXT_PUBLIC_API_URL=https://api.mycompany.com
```

---

## Changing Modules After Setup

Go to **Dashboard → Settings → Modules**. Toggling modules will:
1. Rebuild the schema with new selections
2. Run `prisma db push` (new tables added; unused tables left in place)
3. Restart the server

> **Warning:** Disabling a module does not drop its tables or delete data. Re-enabling it later restores full access.

---

## Resetting

```bash
npm run reset
```

Wipes `node_modules`, build artifacts, `.env` files, and drops the database. Use this to start fresh.

---

## Ports Reference

| Service | Port |
|---|---|
| Admin UI (Next.js) | 3000 |
| Backend API (NestJS) | 3001 |
| Marketing theme | 3002 |
| PostgreSQL | 5432 |
| pgAdmin | 5050 |

---

## Troubleshooting

**Setup wizard can't connect to backend**
- Ensure the backend is running: `npm run dev:backend`
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (or environment)

**`prisma db push` fails during setup**
- Check `DATABASE_URL` is correct in `backend/.env`
- Ensure PostgreSQL is running and the database exists

**Server doesn't restart after setup**
- In dev: ensure you're using `nodemon` (the default `npm run start:dev`)
- In Docker: `restart: always` handles this automatically
- In PM2: `process.exit(0)` triggers PM2's restart policy

**Theme not showing in Themes page**
- Ensure the theme folder has a `theme.json` file
- Built-in themes must be in the `themes/` directory at the project root
- In Docker, the `themes/` directory is volume-mounted to `/themes` inside the container
