# Mero CMS — Dashboard Developer Guide

Last revision: April 2026 · v1.4.0

This guide is for engineers extending or customizing the Mero CMS admin dashboard at `frontend/`. It covers how the admin is structured, the design system, how to add new pages and settings tabs, how to wire to the backend, and how to respect the tier and module gates.

**Audience.** Anyone touching code under `frontend/src/`. Familiarity with Next.js 15 App Router, React 19, TypeScript, and Tailwind v4 is assumed.

---

## 1. The three services and how the admin fits

```
+----------------+        +----------------+        +----------------+
|   Admin (UI)   |  ←——→  |  Backend API   |  ←——→  |  Theme (SSR)   |
|   :3000        |        |  :3001         |        |  :3002         |
|   frontend/    |        |  backend/      |        |  themes/<slug>/|
+----------------+        +----------------+        +----------------+
```

- **Admin** (`frontend/`) is a Next.js 15 App Router app. It's the only frontend customers interact with for managing their site.
- **Backend** (`backend/`) is a NestJS service exposing REST endpoints. Auth is JWT.
- **Theme** (`themes/<slug>/`) is the customer's public site. The admin and theme don't talk to each other directly.

The admin **does not** render its own copy of the customer's site. To preview, it embeds the theme in an iframe with `?editMode=1`.

---

## 2. Project layout

```
frontend/
├── next.config.ts                  ← image config, /api/* rewrite to backend
├── package.json                    ← Next 15, React 19, Tailwind v4
├── public/                         ← static assets
└── src/
    ├── app/
    │   ├── layout.tsx              ← root layout, theme provider, settings provider
    │   ├── globals.css             ← design tokens, Tailwind v4 directives
    │   ├── (auth)/                 ← login, signup, 2FA — no admin chrome
    │   ├── (admin)/                ← everything inside the dashboard
    │   │   ├── layout.tsx          ← sidebar + topbar + content area
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx        ← /dashboard (home)
    │   │   │   ├── pages/page.tsx  ← /dashboard/pages
    │   │   │   ├── blog/page.tsx
    │   │   │   ├── settings/page.tsx
    │   │   │   ├── plugins/page.tsx
    │   │   │   └── … one route per admin section
    │   │   └── setup/              ← first-run setup wizard (gated)
    │   └── (site)/                 ← the marketing/landing layer (rare)
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx         ← left nav with permission + capability gating
    │   │   └── Topbar.tsx
    │   ├── ui/                     ← reusable design-system components
    │   │   ├── PageHeader.tsx
    │   │   ├── Alert.tsx
    │   │   ├── ConfirmationModal.tsx
    │   │   ├── MediaPickerModal.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── UpgradePrompt.tsx
    │   │   └── … 40+ components
    │   ├── admin/                  ← admin-section-specific components
    │   │   ├── ContractBrandingTab.tsx
    │   │   ├── AdminBrandingTab.tsx
    │   │   ├── LicenseSettingsTab.tsx
    │   │   ├── WhiteLabelTab.tsx
    │   │   └── …
    │   └── dashboard/
    │       ├── DashboardAnalytics.tsx
    │       ├── CreateContentModal.tsx
    │       └── …
    ├── context/
    │   ├── CapabilitiesContext.tsx ← tier + capability flags
    │   ├── PermissionsContext.tsx  ← per-user permissions
    │   ├── SettingsContext.tsx     ← global settings cache
    │   ├── ModulesContext.tsx      ← which CMS modules are enabled
    │   └── NotificationContext.tsx ← toasts
    └── lib/
        ├── api.ts                  ← apiRequest, getApiBaseUrl, refresh-token plumbing
        ├── permissions.ts          ← checkPermission helper, getVisibleStats
        └── …
```

The pattern: **per-section route under `(admin)/dashboard/`, plus reusable components under `ui/` and section-specific components under `admin/`**.

---

## 3. Design system

Three things define the admin's visual language: **Tailwind v4 utilities**, **the `globals.css` token layer**, and **a small set of reusable components in `components/ui/`**.

### 3.1 Token layer (`frontend/src/app/globals.css`)

Light/dark theme variables, font families, accent colors. Notable tokens:

```css
:root {
  --background: #ffffff;
  --foreground: #020617;
}
.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --accent: #3b82f6;
}
```

The dark class is set by `next-themes` on `<html>`. Tailwind v4's `@variant dark (&:where(.dark, .dark *))` directive lets every utility have a `dark:` variant.

The chrome rule we added earlier:

```css
nav, aside, button, [role="tab"], [role="button"], [role="menuitem"] {
    user-select: none;
    cursor: default;
}
button, [role="tab"], [role="button"], [role="menuitem"], a[href], label[for] {
    cursor: pointer;
}
```

This makes the admin feel like an app — UI labels don't show the I-beam cursor or get text-selected when the user clicks.

### 3.2 Component vocabulary

- **Cards.** Rounded-2xl, white in light mode, `bg-slate-900/70` in dark, hover-lift with shadow-xl, decorative gradient orb in the bottom-right corner. See `KpiCard` in `components/dashboard/DashboardAnalytics.tsx` for the canonical example.
- **Headers.** Use `<PageHeader title accent subtitle actions />` from `components/ui/PageHeader.tsx`. The `accent` prop is the colored portion of the title; `actions` is right-side button group.
- **Buttons.** `btn-primary` (filled), `btn-outline` (border + transparent), `btn-destructive` (red). Defined as utility classes in globals.css. Same shape — pill (rounded-xl), 14px font, gradient hover.
- **Empty states.** Use `<EmptyState icon title description />` from `components/ui/EmptyState.tsx`. Always render directly (not nested in a card) so the page feels open instead of cramped.
- **Modals.** `<ConfirmationModal />`, `<AlertDialog />`, `<MediaPickerModal />`. Don't roll your own.
- **Alerts / toasts.** Triggered via `useNotification().showToast()`. Inline alerts use `<Alert kind="success|warning|error|info" />`.
- **Loading states.** `animate-pulse` skeletons that match the eventual layout. No spinners — they read as "stuck" to users.

### 3.3 Color accents

Each KPI / status uses a named accent — `blue`, `indigo`, `emerald`, `amber`, `rose`, `violet`, `cyan`. The pattern: gradient icon box (`from-{color}-500 to-{color}-700`), matching shadow ring, soft-tinted background card. Look at `ACCENT_STYLES` in `DashboardAnalytics.tsx`.

### 3.4 Typography

- Display / headers: `font-display` (Plus Jakarta Sans by default; admin-branding tier can override).
- Body: `font-sans` (Inter).
- Numbers in KPI cards: `font-black tracking-tighter leading-none` for the dramatic look.
- Labels above values: `text-[11px] font-black uppercase tracking-[0.18em]`.

---

## 4. Adding a new admin page

The pattern from start to finish.

### 4.1 Create the route

`frontend/src/app/(admin)/dashboard/my-feature/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { useNotification } from '@/context/NotificationContext';

interface Item {
    id: string;
    name: string;
}

export default function MyFeaturePage() {
    const { showToast } = useNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest<Item[]>('/my-feature')
            .then(setItems)
            .catch((err) => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    return (
        <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="px-5 sm:px-10">
                <PageHeader
                    title="My"
                    accent="Feature"
                    subtitle="What this section is for, in one sentence."
                />
            </div>

            <div className="px-5 sm:px-10">
                {loading ? (
                    <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={Sparkles}
                        title="Nothing here yet"
                        description="Add your first item to see it appear."
                    />
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((it) => (
                            <li key={it.id} className="rounded-2xl bg-white p-6 shadow-sm border">
                                {it.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
```

### 4.2 Add a sidebar entry

`frontend/src/components/layout/Sidebar.tsx` — find the `navigationGroups` (or the equivalent flat list) and add:

```tsx
{
    name: 'My Feature',
    href: '/dashboard/my-feature',
    icon: Sparkles,
    requiredPermission: 'my_feature_view',     // optional
    requiresCapability: 'collections',         // optional, gates by tier
    requiresModule: 'my-feature',              // optional, hides if module disabled
    id: 'my-feature',
},
```

The Sidebar component reads `useCapabilities()`, `usePermissions()`, and `useModules()` to filter the visible entries. If a customer's tier doesn't support a feature OR they've disabled the module, the entry is hidden.

### 4.3 Add the backend endpoint

In NestJS, create `backend/src/my-feature/`:

```
backend/src/my-feature/
├── my-feature.module.ts
├── my-feature.controller.ts
├── my-feature.service.ts
└── dto/
    └── create-item.dto.ts
```

A minimal controller:

```ts
@Controller('my-feature')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireModule('my-feature')           // if it's a tier-gated optional module
export class MyFeatureController {
    constructor(private readonly service: MyFeatureService) {}

    @Get()
    @RequirePermissions(Permission.MY_FEATURE_VIEW)
    async findAll() {
        return this.service.findAll();
    }
}
```

Register the module in `backend/src/app.module.ts`. If the feature is optional (tier-gated), use the `when()` helper:

```ts
...when('my-feature')(MyFeatureModule),
```

If it's always-on (core), add to the `imports` array directly.

### 4.4 Permission and capability gating

Permissions live in `backend/src/auth/permissions.enum.ts`. Add a new value:

```ts
export enum Permission {
    // …
    MY_FEATURE_VIEW = 'my_feature_view',
    MY_FEATURE_MANAGE = 'my_feature_manage',
}
```

Capabilities live in `backend/src/config/packages.ts` in the `PackageCapabilities` interface. Add a new flag if your feature is tier-gated.

The frontend's `Sidebar.tsx` reads both `requiresCapability` (capabilities map) and `requiredPermission` (per-role permissions) to decide what to show. Use both for sensitive features.

---

## 5. Settings tabs

The admin's `/dashboard/settings` page used to have an in-page tab strip; we replaced it with sidebar children that route via `?tab=branding`, `?tab=license`, etc. To add a new tab:

### 5.1 Add the tab handler in settings/page.tsx

```tsx
{activeTab === 'my-tab' && <MyTabComponent />}
```

### 5.2 Add the sidebar entry

In `Sidebar.tsx`, under the Settings group:

```tsx
{ id: 'my-tab', name: 'My Tab', icon: Cog, href: '/dashboard/settings?tab=my-tab' },
```

### 5.3 Build the tab component

If it's a settings-form tab, two patterns:

**Hand-rolled tab** — for one-off forms with custom layout. Pattern: read settings via `useSettings()`, edit local state, on save `apiRequest('/settings', { method: 'PATCH', body: ... })`.

**Contract-driven tab** — for any tab whose fields can be expressed as a list of `{ key, label, type, fallback, options }` records. Use `<ContractBrandingTab>`:

```tsx
<ContractBrandingTab
    settings={settings}
    setSettings={setSettings}
    contract={MY_CONTRACT}
    activeThemeName={null}
    usage={null}
    saveEndpoint="/settings"
    bannerTitle="My settings"
    bannerSubtitle="What this section configures."
/>
```

`MY_CONTRACT` is an array of `{ group, fields[] }` shaped like the brandingFields contract in [THEME_DEVELOPMENT.md section 4.3](./THEME_DEVELOPMENT.md#43-branding-contract--brandingfields). The component handles the form rendering, save, and edit-mode toggle; you just declare the fields.

This pattern is used by both site-branding (theme.json contract) and admin-branding (inline contract). When in doubt, prefer the contract-driven tab — less custom code, consistent UX.

---

## 6. Talking to the backend

Every admin call goes through `frontend/src/lib/api.ts`'s `apiRequest`:

```ts
const result = await apiRequest('/path', {
    method: 'POST',
    body: { foo: 'bar' },
    skipNotification: true,  // suppress toasts on error
});
```

It handles:

- JWT bearer token from `localStorage.access_token`.
- Refresh-token rotation when access token expires (one-shot retry).
- Auto-logout on revoked sessions.
- Error toasts via the notification dispatcher (suppressible).

`getApiBaseUrl()` resolves the backend URL — relative `/api` in the browser (forwarded by `next.config.ts` rewrite), absolute `http://localhost:3001` in Server Components.

**Don't fetch directly from a Server Component using a relative URL.** Use `apiRequest` (which calls `getApiBaseUrl()` internally) so you get the right URL for the execution context.

---

## 7. Contexts and global state

Five providers wrap the admin tree, each exposing one slice of state:

| Context | What it gives you | Where mounted |
|---|---|---|
| `CapabilitiesContext` | `capabilities`, `usage`, `limits`, `activePackage`, `has(cap)`, `refresh()` | admin layout |
| `PermissionsContext` | `permissions`, `isLoading` | admin layout |
| `SettingsContext` | `settings`, `refreshSettings()` | admin layout |
| `ModulesContext` | `enabledModules`, `refresh()` | admin layout |
| `NotificationContext` | `showToast(msg, kind)` | root layout |

All are client contexts. Use them via hooks:

```tsx
const { has } = useCapabilities();
const { permissions } = usePermissions();
const { settings, refreshSettings } = useSettings();
const { enabledModules } = useModules();
const { showToast } = useNotification();
```

**Don't fetch the same data your components already have via context.** Common bug: a settings page making its own `apiRequest('/settings')` call when `useSettings()` already has the cached value.

---

## 8. Common UI flows

### 8.1 Edit-mode toggle

A settings card that's read-only by default, edit-on-click. Pattern in legacy code:

```tsx
const [editing, setEditing] = useState(false);
return (
    <Card>
        {!editing && <button onClick={() => setEditing(true)}>Edit</button>}
        <input disabled={!editing} />
        {editing && (
            <>
                <button onClick={save}>Save</button>
                <button onClick={() => setEditing(false)}>Cancel</button>
            </>
        )}
    </Card>
);
```

The contract-driven tab does this internally. New code should prefer it.

### 8.2 Auto-enter edit mode if all fields empty

For first-run UX. Pattern:

```tsx
const allEmpty = settings ? keys.every(k => !settings[k]) : false;
const isEditing = editing || allEmpty;
```

### 8.3 Confirmation modals

For destructive actions:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
return (
    <>
        <button onClick={() => setConfirmOpen(true)}>Delete</button>
        <ConfirmationModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={async () => { await doDelete(); setConfirmOpen(false); }}
            title="Delete this item?"
            description="This can't be undone."
            confirmLabel="Delete"
            destructive
        />
    </>
);
```

### 8.4 Media picker

Files are uploaded via `MediaPickerModal`:

```tsx
const [pickerOpen, setPickerOpen] = useState(false);
return (
    <>
        <button onClick={() => setPickerOpen(true)}>Pick image</button>
        {pickerOpen && (
            <MediaPickerModal
                isOpen
                onClose={() => setPickerOpen(false)}
                onSelect={(url) => { setLogoUrl(url); setPickerOpen(false); }}
            />
        )}
    </>
);
```

The modal handles upload, search, folder navigation, and selection. Returns the URL of the chosen file.

---

## 9. Permission and capability gating in detail

Three layers:

**Module enabled.** Is the CMS module installed? Read from `useModules().enabledModules`. If the customer disabled blogs in Settings → Modules, hide blog entries everywhere.

**Capability supported.** Does the customer's tier include this feature? Read from `useCapabilities().has('analytics')`. Capabilities are tier-derived (Basic = no forms-builder, Premium = yes, etc.).

**Permission granted.** Does this user's role allow it? Read via `checkPermission(permissions, 'analytics_view')` from `lib/permissions.ts`. Permissions are role-derived (an Admin has everything; a Contributor has blog-edit-own).

A feature should pass all three to be rendered:

```tsx
const { enabledModules } = useModules();
const { has } = useCapabilities();
const { permissions } = usePermissions();

const canSee =
    enabledModules.includes('analytics') &&
    has('analytics') &&
    checkPermission(permissions, 'analytics_view');

if (!canSee) return null;
```

The Sidebar's `navigationGroups` declarative format already does this filtering — use it instead of `null`-returning components when possible.

For "you can't, but here's why" UX, use `<UpgradePrompt feature="analytics" minTier="Premium" title="..." description="..." />`. Don't just hide; tell the customer what they're missing.

---

## 10. The visual editor and EditorBridge

The admin's visual editor at `/dashboard/themes/visual-editor` loads the active theme in an iframe with `?editMode=1`. It listens for `mero-section-click`, `mero-field-click`, and `mero-editor-ready` messages from the theme's `EditorBridge` component.

Two-way protocol:

**Theme → Admin** — section/field clicked, dimensions, scroll position.

**Admin → Theme** — `mero-content-update` (live-update DOM with new field value), `mero-navigate` (drive iframe to a new page), `mero-highlight-section` (scroll + outline), `mero-clear-highlights`.

If you're extending the visual editor, add new message types both ends understand. Don't break backward compat — older themes need to still work.

---

## 11. Build, dev, deploy

```bash
cd frontend
npm install
npm run dev       # starts on :3000
npm run build     # production build
npm start         # production server
```

In dev, the rewrite in `next.config.ts` forwards `/api/*` to `http://localhost:3001`. In production, the same rewrite forwards to `BACKEND_URL` (env var). For self-hosted customers running everything on one box, it stays `http://localhost:3001`. For split-domain deployments (admin on a separate domain from backend), set `NEXT_PUBLIC_API_URL` to the backend's full URL.

**JWT secret rotation invalidates existing sessions.** If `JWT_SECRET` is regenerated (e.g. `secrets.json` was deleted), every customer is logged out and needs to sign in again. This is a feature — it's how we handle suspected compromise.

---

## 12. Testing

There's no comprehensive E2E suite yet (planned for v1.5). For now:

- **Type safety** is the first-line defence. Run `npx tsc --noEmit` before committing.
- **Eyeball test** every change in dev — switch between light and dark mode, hit at least three tier states (Basic, Premium, Pro), check empty/loading/error states.
- **Module-disabled test** — try the page with the relevant CMS module disabled in Settings → Modules; the page should hide gracefully or show an UpgradePrompt, not 500.
- **Permission test** — try the page as a Contributor (or whatever the lowest role with potential access is); the page should hide entries the role can't manage.

When v1.5 testing infrastructure lands (Playwright + Storybook), this section gets a major update.

---

## 13. Common pitfalls

**Server Components calling apiRequest directly.** They should — `apiRequest` works server-side too — but be aware that errors there (e.g. backend offline) crash the SSR. Wrap in try/catch and render fallback UI.

**Forgetting permission gates.** Adding a sidebar entry without `requiredPermission` means every role sees it. If the role can't access the underlying API, the page 403s on load. Always add the gate.

**Over-using contexts.** If a page only needs settings, fetch them locally with `useEffect`. Don't subscribe to `useSettings()` if you don't need cross-page consistency.

**Hardcoding NEXT_PUBLIC_API_URL.** Don't. Use `getApiBaseUrl()` from `lib/api.ts`. The function does the server vs. client detection that Vercel-style relative URLs need.

**Dark mode forgotten.** Every Tailwind utility should have a `dark:` variant where it matters. Check both modes before merging.

**Hydration warnings from `<head>`.** Don't put JSX whitespace inside `<head>` in App Router — use the `metadata` export. For runtime-injected `<style>`, put it in `<body>` (Next.js hoists it).

---

## 14. Quick reference

| Need | Use |
|---|---|
| Page header | `<PageHeader title accent subtitle actions />` |
| Empty state | `<EmptyState icon title description />` |
| Confirm a destructive action | `<ConfirmationModal />` |
| Pick a media file | `<MediaPickerModal />` |
| Upgrade-prompt for tier-gated features | `<UpgradePrompt feature minTier title description />` |
| Toast | `useNotification().showToast(msg, 'success')` |
| Read settings | `useSettings()` |
| Read capabilities | `useCapabilities()` |
| Read permissions | `usePermissions()` then `checkPermission(...)` |
| Talk to backend | `apiRequest('/path', { method, body })` |
| Inject branding fields contract | `<ContractBrandingTab contract={...} />` |

---

## 15. Changelog

- **v1.4.0** (2026-04) — Initial dashboard developer guide. Covers Next 15 + React 19 + Tailwind v4 stack, design system, page/tab/route patterns, contract-driven settings tabs, capability + permission + module gating, contexts, visual editor protocol.
