# Mero CMS — Developer Guide

This guide covers the architecture, coding patterns, and workflows for contributors working on Mero CMS. Read this before writing any code.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend — NestJS](#backend--nestjs)
3. [Frontend — Next.js Admin](#frontend--nextjs-admin)
4. [Theme Development](#theme-development)
5. [Database & Prisma](#database--prisma)
6. [Authentication & Permissions](#authentication--permissions)
7. [Module System](#module-system)
8. [Public API (for Themes)](#public-api-for-themes)
9. [Adding a New Feature Module](#adding-a-new-feature-module)
10. [Environment Variables](#environment-variables)
11. [Git Workflow](#git-workflow)
12. [Commit Convention](#commit-convention)
13. [CI/CD Pipeline](#cicd-pipeline)

---

## Architecture Overview

```
┌─────────────────┐      JWT       ┌──────────────────────┐
│  Admin UI       │ ─────────────► │  NestJS Backend      │
│  Next.js 15     │                │  Port 3001           │
│  Port 3000      │                │                      │
└─────────────────┘                │  ┌────────────────┐  │
                                   │  │ Prisma ORM     │  │
┌─────────────────┐  Public API    │  │ PostgreSQL      │  │
│  Theme App      │ ─────────────► │  └────────────────┘  │
│  Next.js 15     │  (no auth)     │                      │
│  Port 3002+     │                │  ┌────────────────┐  │
└─────────────────┘                │  │ /themes dir    │  │
                                   │  │ (auto-scanned) │  │
                                   │  └────────────────┘  │
                                   └──────────────────────┘
```

- **Admin UI** communicates with the backend using JWT authentication
- **Themes** communicate with the backend via public unauthenticated endpoints
- **Backend** reads theme files from the `themes/` directory (or `/themes/` in Docker)
- **Database** state drives everything — setup completion, enabled modules, active theme, settings

---

## Backend — NestJS

### Directory Structure

```
backend/src/
├── main.ts                 # Entry point — bootstraps NestJS, CORS, global pipes
├── app.module.ts           # Root module — imports all feature modules
├── prisma/
│   └── prisma.service.ts   # PrismaClient singleton
├── auth/
│   ├── jwt.strategy.ts     # Passport JWT strategy
│   ├── jwt-auth.guard.ts   # Guard — attach to protected routes
│   ├── permissions.guard.ts # Guard — checks user permissions
│   ├── permissions.decorator.ts  # @RequirePermissions(...)
│   └── permissions.enum.ts # All permission constants
├── setup/
│   ├── setup.controller.ts # POST /setup/*, POST /setup/complete
│   └── setup.service.ts    # Wizard logic, schema build, module activation
└── [feature]/
    ├── [feature].module.ts
    ├── [feature].controller.ts
    ├── [feature].service.ts
    └── dto/
        ├── create-[feature].dto.ts
        └── update-[feature].dto.ts
```

### Controller Pattern

Every protected controller follows this pattern:

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@Controller('blogs')
export class BlogsController {
    constructor(private readonly blogsService: BlogsService) {}

    // Protected route — requires auth + permission
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.CONTENT_CREATE)
    @Post()
    create(@Body() dto: CreateBlogDto) {
        return this.blogsService.create(dto);
    }

    // Public route — no guards
    @Get('public/list')
    getPublished(@Query('page') page?: string) {
        return this.blogsService.findPublished(page ? parseInt(page) : 1);
    }
}
```

**Rules:**
- Always use `@UseGuards(JwtAuthGuard, PermissionsGuard)` together — never just one
- Always declare `@RequirePermissions(...)` when using `PermissionsGuard`
- Public routes go at the bottom of the controller — NestJS matches routes top-to-bottom, so `public/list` must come before `:id` or it will be swallowed by the param route
- Modules gated behind a CMS module use `@RequireModule('module-name')` at class level

### Service Pattern

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BlogsService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
    ) {}

    async create(dto: CreateBlogDto) {
        const blog = await this.prisma.blog.create({ data: dto });

        await this.notifications.create({
            type: 'SUCCESS',
            title: 'Blog Created',
            message: `"${blog.title}" was published.`,
            targetRole: 'Admin',
        });

        return blog;
    }

    async findById(id: string) {
        const blog = await this.prisma.blog.findUnique({ where: { id } });
        if (!blog) throw new NotFoundException('Blog not found');
        return blog;
    }
}
```

**Rules:**
- Inject `PrismaService` for all DB access — never instantiate `PrismaClient` directly
- Throw NestJS `NotFoundException`, `BadRequestException`, etc. — never raw `Error`
- Notify admins of important actions using `NotificationsService`
- Keep business logic in services, not controllers

### Module Registration

Every feature module must be registered in `app.module.ts`. When adding a new module:

```typescript
// app.module.ts
import { BlogsModule } from './blogs/blogs.module';

@Module({
    imports: [
        // ... existing modules
        BlogsModule,
    ],
})
export class AppModule {}
```

---

## Frontend — Next.js Admin

### Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── setup/                  # /setup — wizard pages
│   └── (admin)/
│       ├── layout.tsx          # Dashboard shell (sidebar, header)
│       └── dashboard/
│           ├── page.tsx        # /dashboard — home
│           ├── blogs/
│           │   ├── page.tsx    # List view
│           │   └── [id]/
│           │       └── page.tsx  # Edit view
│           └── ...
├── components/
│   ├── dashboard/              # Dashboard-specific components
│   └── ui/                     # Shared primitive components
├── lib/
│   ├── api.ts                  # apiRequest() utility
│   └── utils.ts                # Formatting helpers
└── context/
    ├── AuthContext.tsx          # Current user, login/logout
    └── NotificationContext.tsx  # Toast notifications
```

### API Calls

Always use the `apiRequest` utility — never use `fetch` directly:

```typescript
import { apiRequest } from '@/lib/api';

// GET
const blogs = await apiRequest('/blogs');

// POST
const newBlog = await apiRequest('/blogs', {
    method: 'POST',
    body: { title: 'Hello', content: '...' },
});

// PATCH
await apiRequest(`/blogs/${id}`, {
    method: 'PATCH',
    body: { title: 'Updated' },
});

// DELETE
await apiRequest(`/blogs/${id}`, { method: 'DELETE' });
```

`apiRequest` automatically:
- Prepends `NEXT_PUBLIC_API_URL`
- Attaches the JWT token from `localStorage`
- Parses JSON responses
- Throws on non-2xx responses with the server error message

### UI Patterns

```typescript
import { useNotification } from '@/context/NotificationContext';

export default function CreateBlogForm() {
    const { showToast } = useNotification();

    const handleSubmit = async (data: FormData) => {
        try {
            await apiRequest('/blogs', { method: 'POST', body: data });
            showToast('Blog created successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Something went wrong', 'error');
        }
    };
    // ...
}
```

**Rules:**
- Use `showToast` for all user feedback — never `alert()` or `console.log` for user-facing messages
- Use `@heroicons/react/24/outline` for all icons — keep the icon set consistent
- Use Tailwind CSS classes only — no custom CSS files except `globals.css` for base styles
- Gate UI elements by permission, but always rely on backend guards as the real security layer

---

## Theme Development

A theme is a standalone Next.js application in `themes/<slug>/`.

### Minimum Required Files

```
themes/my-theme/
├── theme.json          # Required — theme metadata and seed data
├── package.json
├── next.config.js
├── src/
│   └── app/
│       └── page.tsx    # Home page
└── .env.local.example  # Documents CMS_API_URL requirement
```

### theme.json Structure

```json
{
    "name": "My Theme",
    "slug": "my-theme",
    "version": "1.0.0",
    "description": "A beautiful theme for Mero CMS",
    "author": "Blendwit Tech",
    "requiredModules": ["pages", "menus", "blogs", "services"],
    "preview": "preview.svg",
    "defaultSettings": {
        "hero_title": "Welcome",
        "primary_color": "#4f46e5"
    },
    "seedData": {
        "pages": [
            { "title": "Home", "slug": "home", "content": "..." }
        ],
        "menus": [
            {
                "name": "Main Navigation",
                "slug": "main-nav",
                "items": [
                    { "label": "Home", "url": "/", "order": 1 }
                ]
            }
        ],
        "services": [],
        "blogs": [],
        "testimonials": [],
        "team": []
    }
}
```

### Fetching Data in a Theme

```typescript
// In your theme's Next.js page or component
const API_URL = process.env.CMS_API_URL || 'http://localhost:3001';

async function getSiteData() {
    const res = await fetch(`${API_URL}/public/site-data`, {
        next: { revalidate: 60 }, // ISR — revalidate every 60 seconds
    });
    return res.json();
}

export default async function HomePage() {
    const data = await getSiteData();
    const { site, menus, blogs, services, testimonials } = data;
    // ...
}
```

### Packaging a Theme for Upload

```bash
node scripts/zip-theme.js my-theme
# Creates: themes/my-theme.zip
# Then upload via: Admin → Appearance → Themes → Upload Theme
```

---

## Database & Prisma

### Schema Assembly

The `backend/prisma/schema.prisma` is assembled from module fragments in `backend/prisma/modules/`. When a user enables/disables modules through the setup wizard or Settings → Modules, `build-schema.js` reassembles the schema and `prisma db push` applies it.

**Do not edit `schema.prisma` directly.** Edit the module fragment in `prisma/modules/`.

### Running Migrations (Local Dev)

```bash
cd backend

# Apply all pending migrations
npx prisma migrate dev

# Create a new migration after editing a module schema fragment
npx prisma migrate dev --name add_blog_featured_flag

# Push schema without migrations (staging/CI)
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio
```

### Accessing Prisma in Services

```typescript
@Injectable()
export class BlogsService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.blog.findMany({
            orderBy: { createdAt: 'desc' },
            include: { category: true, tags: true },
        });
    }
}
```

---

## Authentication & Permissions

### How It Works

1. User logs in → backend returns a JWT
2. Frontend stores JWT in `localStorage`
3. Every protected request includes `Authorization: Bearer <token>`
4. `JwtAuthGuard` verifies the token and attaches `req.user`
5. `PermissionsGuard` checks `req.user.permissions` against `@RequirePermissions(...)`

### Permission Enum

All permissions are in `backend/src/auth/permissions.enum.ts`. Always use the enum — never hardcode permission strings:

```typescript
import { Permission } from '../auth/permissions.enum';

@RequirePermissions(Permission.CONTENT_CREATE)
@RequirePermissions(Permission.SETTINGS_MANAGE)
@RequirePermissions(Permission.USERS_MANAGE)
```

### Roles

- **Super Admin** — all permissions, cannot be deleted
- **Admin** — configurable permissions assigned by Super Admin
- Custom roles can be created in Dashboard → Settings → Roles

---

## Module System

The CMS uses a flag-based module system. Modules are stored as enabled/disabled in the database (`settings` table, key `ENABLED_MODULES`).

### Gating an Endpoint Behind a Module

```typescript
import { RequireModule } from '../setup/require-module.decorator';

@RequireModule('blogs')   // Returns 404 if 'blogs' module is not enabled
@Controller('blogs')
export class BlogsController { ... }
```

### Checking Module Status in a Service

```typescript
import { SettingsService } from '../settings/settings.service';

const enabledModules = await this.settingsService.getEnabledModules();
if (!enabledModules.includes('analytics')) {
    throw new ForbiddenException('Analytics module is not enabled');
}
```

---

## Public API (for Themes)

The public API requires no authentication. It is the sole data source for theme apps.

| Endpoint                  | Description                              |
|---------------------------|------------------------------------------|
| `GET /public/site-data`   | All site data in one response            |
| `GET /public/blogs`       | Published blog posts (paginated)         |
| `GET /public/blogs/:slug` | Single blog post by slug                 |
| `GET /public/pages/:slug` | Single page by slug                      |
| `GET /public/services`    | All published services                   |
| `GET /public/team`        | All team members                         |
| `GET /public/testimonials`| All testimonials                         |
| `GET /public/menus/:slug` | Navigation menu with items               |
| `GET /public/settings`    | Public site settings (name, logo, etc.)  |

---

## Adding a New Feature Module

Follow these steps to add a complete new module (example: `portfolio`):

### 1. Create the Prisma schema fragment

```
backend/prisma/modules/projects.prisma
```

```prisma
model Project {
    id          String   @id @default(cuid())
    title       String
    slug        String   @unique
    description String?
    published   Boolean  @default(false)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
}
```

### 2. Generate the NestJS module

```bash
cd backend
nest g module projects
nest g controller projects
nest g service projects
```

### 3. Create DTOs

```typescript
// dto/create-project.dto.ts
export class CreateProjectDto {
    title: string;
    slug: string;
    description?: string;
    published?: boolean;
}
```

### 4. Implement the service

Follow the [Service Pattern](#service-pattern) above.

### 5. Implement the controller

Follow the [Controller Pattern](#controller-pattern) above. Add `@RequireModule('projects')` if this is an optional module.

### 6. Register in `app.module.ts`

```typescript
import { ProjectsModule } from './projects/projects.module';
// add ProjectsModule to @Module({ imports: [...] })
```

### 7. Add to permissions enum

```typescript
// auth/permissions.enum.ts
export enum Permission {
    // ... existing
    PROJECTS_VIEW = 'projects:view',
    PROJECTS_CREATE = 'projects:create',
    PROJECTS_EDIT = 'projects:edit',
    PROJECTS_DELETE = 'projects:delete',
}
```

### 8. Add public endpoint (optional)

In `backend/src/public/public.controller.ts` and `public.service.ts`, add the public-facing read endpoint.

### 9. Add frontend pages

Create `frontend/src/app/(admin)/dashboard/projects/page.tsx` (list) and `[id]/page.tsx` (edit).

---

## Environment Variables

### Backend

| Variable              | Required | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| `DATABASE_URL`        | Yes      | PostgreSQL connection string                     |
| `JWT_SECRET`          | Yes      | Secret for signing JWTs (min 32 chars)           |
| `PORT`                | No       | Server port (default: 3001)                      |
| `NODE_ENV`            | No       | `development` or `production`                    |
| `CORS_ORIGINS`        | No       | Comma-separated allowed origins                  |
| `CORS_VERCEL_PROJECT` | No       | Vercel project name (allows all preview URLs)    |
| `THEMES_DIR`          | No       | Custom themes directory path                     |
| `UPLOAD_DIR`          | No       | Upload storage directory (default: `./uploads`)  |
| `MAX_FILE_SIZE`       | No       | Max upload size in bytes (default: 10485760)     |

See `backend/.env.development.example` for a complete local config template.

### Frontend

| Variable              | Required | Description                         |
|-----------------------|----------|-------------------------------------|
| `NEXT_PUBLIC_API_URL` | Yes      | Backend API base URL                |

---

## Git Workflow

### Branch Model

The repository uses a strictly gated promotion flow across these primary branches:

```
production    ← Stable release (sellable product, version controlled releases)
main          ← Backup stable version (includes demo, safety fallback)
testing       ← Staging/QA (pre-production verification, supports demo)
develop       ← Active development hub (new features stem from here)
marketing     ← Live environment for Mero CMS itself (supports demo)
```

- `marketing`: Custom branch for [demo.merocms.com](https://demo.merocms.com).
- `dependabot/*`: Automatic dependency updates, targeting the active default branch.

### Day-to-Day Flow

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/add-projects-module

# Work, commit often
git add backend/src/projects/
git commit -m "feat(projects): add CRUD endpoints"

# Push and open PR to develop
git push origin feature/add-projects-module
# Open PR on GitHub: feature/add-projects-module → develop
```

**Rules:**
- Never push directly to `production`, `main`, or `testing`.
- Every PR must pass CI (backend build + frontend build) before merging.
- PRs to `develop` require peer review.
- Merging to `main` and `production` requires documentation check and owner approval.

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type       | When to use                                          |
|------------|------------------------------------------------------|
| `feat`     | New feature or endpoint                              |
| `fix`      | Bug fix                                              |
| `chore`    | Build scripts, dependencies, config (no src changes) |
| `refactor` | Code restructure with no behavior change             |
| `docs`     | Documentation only                                   |
| `style`    | Formatting, no logic change                          |
| `test`     | Adding or fixing tests                               |

**Examples:**
```
feat(blogs): add featured flag to blog posts
fix(auth): prevent token reuse after logout
chore(docker): add themes/ to Dockerfile COPY step
docs(readme): update quick start instructions
```

---

## CI/CD Pipeline

| Workflow                          | Trigger             | Steps                                          |
|-----------------------------------|---------------------|------------------------------------------------|
| `ci.yml`                          | All pushes + PRs    | Backend build → verify dist/main.js → Frontend build |
| `deploy-testing.yml`              | Push to `testing`   | Same as CI → notify; Staging auto-deploy       |
| `deploy-production.yml`           | Push to `production` | CI → await manual approval → notify deploy     |

Railway and Vercel deploy automatically via their GitHub integrations once the connected branch is updated. The GitHub Actions workflows serve as the build validation gate.

### Required GitHub Secrets

| Secret               | Used by                     |
|----------------------|-----------------------------|
| `STAGING_API_URL`    | `deploy-staging.yml`        |
| `PRODUCTION_API_URL` | `deploy-production.yml`     |

For full deployment instructions, see [SETUP.md](SETUP.md).
