# Mero CMS — Admin UI

Next.js 15 admin dashboard for Mero CMS. Runs on port **3000**.

## Tech

- **Next.js 15** — App Router
- **React 19**
- **Tailwind CSS**
- **Heroicons** — icon set
- **JWT** — stored in localStorage, sent as Bearer token

## Local Setup

```bash
cd frontend
cp .env.development.example .env.local
# .env.local already has: NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev
```

Admin UI: http://localhost:3000

## Scripts

```bash
npm run dev       # Development server (port 3000)
npm run build     # Production build
npm run start     # Start production build
npm run lint      # ESLint
```

## Key Pages

| Route                              | Description                      |
|------------------------------------|----------------------------------|
| `/setup`                           | First-run setup wizard           |
| `/login`                           | Login page                       |
| `/dashboard`                       | Overview / home                  |
| `/dashboard/blogs`                 | Blog post list                   |
| `/dashboard/blogs/[id]`            | Blog post editor                 |
| `/dashboard/pages`                 | Static pages                     |
| `/dashboard/menus`                 | Navigation menus                 |
| `/dashboard/services`              | Services                         |
| `/dashboard/team`                  | Team members                     |
| `/dashboard/testimonials`          | Testimonials                     |
| `/dashboard/leads`                 | Contact form leads               |
| `/dashboard/media`                 | Media library                    |
| `/dashboard/themes`                | Theme management                 |
| `/dashboard/analytics`             | GA4 analytics dashboard          |
| `/dashboard/seo`                   | SEO meta, sitemap, redirects     |
| `/dashboard/users`                 | User management                  |
| `/dashboard/roles`                 | Roles & permissions              |
| `/dashboard/settings`              | Site settings & modules          |
| `/dashboard/notifications`         | Admin notifications              |
| `/dashboard/audit-log`             | Activity audit trail             |

## Environment Variables

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (required)      |

For staging (Vercel preview): set to Railway staging URL.
For production: set to Railway production URL.

## API Integration

All API calls go through `src/lib/api.ts`:

```typescript
import { apiRequest } from '@/lib/api';

// Handles auth headers, base URL, error parsing automatically
const data = await apiRequest('/blogs');
const post = await apiRequest('/blogs', { method: 'POST', body: { title: '...' } });
```

## State & Notifications

```typescript
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

const { user, logout } = useAuth();
const { showToast } = useNotification();

showToast('Saved successfully', 'success');
showToast('Something went wrong', 'error');
```

For detailed architecture and patterns, see [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md).
