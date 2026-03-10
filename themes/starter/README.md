# Mero CMS — Starter Theme

A minimal Next.js 15 theme starter that connects to your Mero CMS backend.

## Quick Start

```bash
# 1. Clone this directory into your project
cp -r themes/starter my-theme
cd my-theme

# 2. Install dependencies
npm install

# 3. Configure the CMS backend URL
cp .env.local.example .env.local
# Edit .env.local → set CMS_API_URL=http://localhost:3001 (or your backend URL)

# 4. Start development server (runs on port 3002)
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) — your theme is now running and pulling live data from the CMS.

---

## Project Structure

```
my-theme/
├── theme.json              ← Theme manifest (name, modules, seed data)
├── package.json
├── next.config.js
├── .env.local.example
└── src/
    ├── app/
    │   ├── layout.tsx       ← Root layout (fetches settings for metadata)
    │   ├── globals.css
    │   ├── page.tsx         ← Homepage
    │   ├── blog/
    │   │   ├── page.tsx     ← Blog list
    │   │   └── [slug]/
    │   │       └── page.tsx ← Blog post
    │   └── projects/
    │       └── page.tsx     ← Portfolio
    ├── components/
    │   ├── Header.tsx       ← Navigation header (uses CMS menus)
    │   └── Footer.tsx       ← Footer (uses CMS menus + settings)
    └── lib/
        └── cms.ts           ← Full typed CMS client library
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CMS_API_URL` | `http://localhost:3001` | URL of the Mero CMS backend |

---

## CMS Client Library (`src/lib/cms.ts`)

All functions are async, typed, and support Next.js ISR via the `revalidate` parameter.

### Aggregated data

```ts
import { getSiteData } from '@/lib/cms';

const { settings, menus, pages, projects, team, testimonials, services, recentPosts } =
  await getSiteData(60); // revalidate every 60s
```

### Individual fetchers

```ts
import {
  getPublishedPosts, getPostBySlug,
  getProjects, getProjectBySlug, getProjectCategories,
  getTeam, getTestimonials, getServices,
  getPageBySlug, getMenu, getSeoMeta, cmsImageUrl
} from '@/lib/cms';

// Blog
const { data: posts, total } = await getPublishedPosts({ page: 1, limit: 10 });
const post = await getPostBySlug('my-post-slug');

// Projects
const projects = await getProjects({ category: 'web' });
const project = await getProjectBySlug('my-project-slug');

// Pages
const page = await getPageBySlug('about');

// Navigation
const menu = await getMenu('main-nav');

// SEO (use in generateMetadata)
const seo = await getSeoMeta('/blog');

// Images
const fullUrl = cmsImageUrl('/uploads/photo.jpg'); // → http://localhost:3001/uploads/photo.jpg
```

---

## theme.json Reference

```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "version": "1.0.0",
  "description": "Theme description",
  "author": "Author Name",
  "preview": "preview.png",
  "requiredModules": ["pages", "menus", "blogs"],
  "deployedUrl": "",
  "seed": {
    "pages": [
      { "title": "Home", "slug": "home", "content": "<h1>Welcome</h1>", "status": "published" }
    ],
    "menus": [
      {
        "name": "Main Nav", "slug": "main-nav",
        "items": [{ "label": "Home", "url": "/", "order": 1 }]
      }
    ],
    "projects": [],
    "projectCategories": [],
    "team": [],
    "testimonials": [],
    "services": [],
    "milestones": []
  }
}
```

**`requiredModules`** — list of CMS modules the theme needs. The CMS admin will warn if any are disabled.

**`seed`** — initial content created when you click **Setup** in the CMS admin Themes page. Safe to run multiple times (uses upsert logic).

---

## Development Workflow

1. **Build your theme** — customize pages, components, and styles in `src/`
2. **Add `preview.png`** — a screenshot of your theme (shown in CMS admin)
3. **Update `theme.json`** — set your `requiredModules` and seed data
4. **Package** — zip the theme directory:
   ```bash
   # From the parent directory
   zip -r my-theme.zip my-theme/
   ```
5. **Upload** — go to CMS Admin → Themes → Upload Theme → select your `.zip`
6. **Setup** — click **Setup** to seed initial content
7. **Activate** — click **Activate** to set as the active theme
8. **Deploy URL** — enter your deployed URL (e.g. `https://myclient.com`) so the CMS knows where the frontend lives

---

## Production Deployment

The theme is a standard Next.js app — deploy anywhere:

### Vercel / Netlify
1. Push your theme directory to a separate Git repo
2. Import in Vercel/Netlify
3. Set environment variable: `CMS_API_URL=https://your-cms-backend.com`
4. Deploy

### Self-hosted (PM2 / Docker)
```bash
npm run build
npm start  # runs on port 3002
```
Then set up a reverse proxy (nginx/Caddy) to route your client's domain to port 3002.

### Important
- Make sure your CMS backend is publicly accessible if the theme is deployed externally
- Enable CORS on the backend for your theme's domain if needed
- Set `CMS_API_URL` to the **public** backend URL (not `localhost`) in production
