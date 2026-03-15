# Mero CMS — Backend

NestJS REST API for Mero CMS. Runs on port **3001**.

## Tech

- **NestJS** — framework
- **Prisma** — ORM
- **PostgreSQL** — database
- **Passport / JWT** — authentication
- **bcrypt** — password hashing
- **TOTP** — 2FA

## Local Setup

```bash
cd backend
cp .env.development.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

npm install
npx prisma migrate dev
npm run start:dev
```

API: http://localhost:3001

## Scripts

```bash
npm run start:dev     # Development (watch mode)
npm run start:prod    # Production (runs dist/main.js)
npm run build         # Compile TypeScript to dist/
npm run lint          # ESLint
npm run test          # Jest unit tests
npm run test:e2e      # E2E tests
```

## Key Endpoints

| Method | Path                          | Auth     | Description                    |
|--------|-------------------------------|----------|--------------------------------|
| POST   | /auth/login                   | No       | Login, returns JWT             |
| GET    | /auth/me                      | JWT      | Current user profile           |
| GET    | /public/site-data             | No       | All public data for themes     |
| GET    | /public/blogs                 | No       | Published blog posts           |
| GET    | /public/blogs/:slug           | No       | Single post by slug            |
| GET    | /public/pages/:slug           | No       | Single page by slug            |
| GET    | /public/services              | No       | Service listings               |
| GET    | /public/menus/:slug           | No       | Navigation menu                |
| POST   | /setup/init                   | No       | Run setup wizard               |
| POST   | /setup/complete               | No       | Complete setup                 |
| GET    | /themes                       | JWT      | List available themes          |
| POST   | /themes/:slug/activate        | JWT      | Activate a theme               |
| POST   | /themes/:slug/setup           | JWT      | Seed theme content             |
| POST   | /themes/upload                | JWT      | Upload theme ZIP               |
| GET    | /blogs                        | JWT      | List all blog posts (admin)    |
| POST   | /blogs                        | JWT      | Create blog post               |
| PATCH  | /blogs/:id                    | JWT      | Update blog post               |
| DELETE | /blogs/:id                    | JWT      | Delete blog post               |
| GET    | /settings                     | JWT      | Site settings                  |
| PATCH  | /settings                     | JWT      | Update settings                |
| GET    | /users                        | JWT      | List users (admin)             |
| GET    | /roles                        | JWT      | List roles                     |

## Prisma Schema

The `prisma/schema.prisma` is assembled from fragments in `prisma/modules/` by `scripts/build-schema.js`. Do not edit `schema.prisma` directly — edit the module fragment instead.

```bash
# Apply migrations in development
npx prisma migrate dev

# Push schema without migration (staging)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate

# View database in browser
npx prisma studio
```

## Docker

The backend is containerized using `backend/Dockerfile`. The Docker build context is the **repo root** (not `backend/`) so themes are included:

```bash
# From repo root
docker build -f backend/Dockerfile -t mero-cms-backend .
docker run -e DATABASE_URL="..." -e JWT_SECRET="..." -p 3001:3001 mero-cms-backend
```

On Railway, this is handled automatically by `railway.json`.

## CORS

Allowed origins are configured via environment variables:

```env
# Explicit origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Allow all Vercel preview URLs for a project
CORS_VERCEL_PROJECT=your-vercel-project-name
```

For detailed architecture and patterns, see [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md).
