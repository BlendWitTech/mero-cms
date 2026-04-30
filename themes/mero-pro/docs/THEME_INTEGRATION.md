# Theme ↔ CMS integration map

Quick reference for which CMS setting / endpoint drives which theme element.
Read alongside `INTEGRATION_NOTES.md` for the underlying API surface.

## What drives what

| Theme element | Source | Falls back to |
|---|---|---|
| Nav logo | `siteData.settings.logoUrl` | `/logo.svg` (theme-bundled) |
| Site title | `siteData.settings.siteTitle` | `'Mero CMS'` |
| Nav links | `getMenu('main-nav')` | Hardcoded list in `Navigation.tsx` |
| Footer link columns | `getMenu('footer-product' / 'footer-resources' / 'footer-company' / 'footer-legal')` | Hardcoded lists in `Footer.tsx` |
| Footer tagline | `siteData.settings.footerText` | Hardcoded copy |
| Copyright | `siteData.settings.copyrightText` | `© ${year} Mero CMS · Built by Blendwit` |
| Hero headline | `siteData.settings.heroTitle` | Component DEFAULTS |
| Hero subhead | `siteData.settings.heroSubtitle` | Component DEFAULTS |
| Hero / FinalCTA primary CTA text | `siteData.settings.ctaText` | `'Start free →'` |
| Hero / FinalCTA primary CTA URL | `siteData.settings.ctaUrl` | `/signup` |
| About title + content | `siteData.settings.aboutTitle / aboutContent` | Hardcoded copy |
| Testimonials | `siteData.testimonials` | Component DEFAULTS |
| Page-specific sections (FeatureBlocks, UseCases, etc.) | `getPage(slug).data.sections[]` via `pickSection()` | Component DEFAULTS |
| Blog posts | `getPosts()` and `getPost(slug)` | Placeholder posts when offline |
| Categories | `getCategories()` | None — empty list |
| SEO override per page | `getSeoMeta(pageType, pageId)` | Defaults from `app/layout.tsx` metadata |
| Redirects | `checkRedirect(path)` via `middleware.ts` | No redirect |
| Sitemap entries | `app/sitemap.ts` (static + getPosts + siteData.pages) | Static-only |
| Robots policy | `app/robots.ts` (hardcoded) | — |
| Capability gates (TierGate, CapabilityGate) | `getCapabilities()` via `CapabilitiesProvider` | All flags false |

## Form submissions

- **`/contact`** uses `<ContactForm />` which posts to `/public/leads` by default.
- Pass `<ContactForm formId="..." />` to instead submit through `/public/forms/:formId/submit` for form-builder forms.
- Backend rate-limits to 10 requests/min per IP.

## Auth flow

- `/login` and `/signup` use `<AuthForm mode />`.
- Login: `POST /auth/login` → response carries `access_token` + `refresh_token` + `user`. Tokens stored in `localStorage` as `mero_access_token` and `mero_refresh_token`.
- Signup: `POST /auth/register`, then auto-login.
- After auth, redirect to `/admin`.

## Visual editor

- `EditorBridge.tsx` mounts in `app/layout.tsx`, no-op unless `?editMode=1` is in the URL.
- When edit mode is active, every element with `data-section-id` gets a hover outline + click handler. Clicking sends `mero-section-click` to the parent (admin iframe).
- Inbound messages: `mero-content-update` (live-update DOM), `mero-navigate` (drive iframe to a different page), `mero-highlight-section` (scroll + outline).

## Missing / TODO for full editor parity

- `data-editable` attributes on inline text fragments (currently only section-level click works).
- HMAC verification on `mero-content-update` messages (currently trusted).
- Integration tests against the running admin.

## Environment variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001     # backend base URL
NEXT_PUBLIC_MEDIA_HOST=localhost              # next/image remote pattern
NEXT_PUBLIC_SITE_URL=http://localhost:3002    # used by sitemap.ts/robots.ts (set to prod domain on deploy)
```
