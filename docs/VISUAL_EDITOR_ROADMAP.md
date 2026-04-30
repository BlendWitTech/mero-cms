# Visual Builder — v2.0 Roadmap

Our answer to Elementor / Divi / Beaver, scoped for Mero CMS and tiered by package.

We are NOT trying to beat Elementor at its own game. Those products have hundreds of engineers. We're building a focused, theme-aware editor that gives premium customers the 20% of page-builder features that cover 80% of the use cases, gated by package tier.

---

## The four features, by priority

### 1. Inline click-to-edit preview  *(Pro+)*

Split-pane UI: iframe of the theme on the left, section editor on the right. Click any section in the preview → that section's editor card scrolls into view and highlights. Save repaints the iframe.

Mechanism:
- Theme opts in by rendering `<EditorBridge>` (client component) when `?editMode=<secret>` is present in the URL.
- Bridge adds hover outline + click handlers to every `[data-section-id]` element.
- Communication via `window.postMessage` — admin and theme can be on different origins.
- Protocol:
  - Theme → admin: `{ type: 'section-click', sectionId }`, `{ type: 'section-hover', sectionId }`, `{ type: 'ready' }`
  - Admin → theme: `{ type: 'scroll-to-section', sectionId }`, `{ type: 'reload' }`

Already has backend support: `visualThemeEditor` capability, section schema, `PUT /pages/by-slug/:slug`. **Only UI + theme wiring to build.**

**Ships this session.**

### 2. Global design tokens + section overrides  *(Premium for tokens, Pro+ for overrides)*

Today: site-wide brand tokens live in Settings (primary, secondary, accent, fonts, logo) and the `ThemeCustomize` page edits them.

What to add:
- A **typography scale** (sm/base/lg/xl/2xl) and **spacing scale** (4/8/16/32/64) in Settings.
- Themes read the scale via CSS vars; they already read `--indigo`, extend to `--space-*` and `--text-*`.
- Per-section overrides stored in `page.data.sections[].data._style`:
  ```json
  { "_style": { "paddingTop": 128, "backgroundColor": "#0d0e18" } }
  ```
- Admin right-pane gets a **Design** tab per section (sliders for spacing, picker for colour).
- Theme's section root reads `_style` and applies as inline style.

Time: ~3 days after Priority 1.

### 3. Widget library  *(Enterprise)*

Generic, theme-agnostic blocks that editors can drop onto any page: Heading, Image, Rich Text, Columns, Spacer, Button, Video, Embed, Divider.

Mechanism:
- New `widgets` module in the backend: widget definition, schema, render function.
- Stored as an extra section type `'widget:<kind>'` inside `page.data.sections[]`.
- Themes render widgets with a default-themed component; advanced themes can override specific widget kinds.
- Drag from a left-rail palette onto the canvas (the iframe from Priority 1).

Time: ~1–2 weeks. Biggest single build.

### 4. Component variants picker  *(Pro+)*

Already shipped! Declared in `theme.json` per section as `variants: [...]`, rendered as a dropdown in each section card. Nimble's hero has `dashboard | minimal`. Northwind's has `dark | light | centered`.

No further work — future themes just declare more variants.

---

## Package tier matrix

| Feature | Basic | Premium | Professional | Enterprise |
| --- | --- | --- | --- | --- |
| Site Pages editor (field edits) | ✓ | ✓ | ✓ | ✓ |
| Drag-reorder sections | ✓ | ✓ | ✓ | ✓ |
| Theme variants dropdown | — | — | ✓ | ✓ |
| Global design tokens | — | ✓ | ✓ | ✓ |
| Per-section style overrides | — | — | ✓ | ✓ |
| **Visual Editor (inline click-to-edit)** | — | — | **✓** | **✓** |
| Widget library (drop any widget onto a page) | — | — | — | ✓ |
| Code-level theme editor | — | — | ✓ | ✓ |
| Dashboard branding | — | — | — | ✓ (org only) |

Capability keys (already in `backend/src/config/packages.ts`):
- `visualThemeEditor` — controls Visual Editor + style overrides + variants dropdown
- `themeCodeEdit` — controls code editor
- `pluginMarketplace` — already shipped
- `dashboardBranding` — org enterprise only

For the design-tokens split (Premium gets tokens but not per-section overrides), add:
- `designTokens` — Premium+
- `sectionStyleOverrides` — Pro+ (alias of visualThemeEditor for now, split later if needed)

---

## Architecture for the Visual Editor (Priority 1 detail)

### Admin side — `/dashboard/themes/visual-editor`

```
┌─────────────────────────────────┬─────────────────────────┐
│                                 │  ← section list          │
│                                 │                          │
│   <iframe                       │  [▼] Hero                │
│     src={theme + ?editMode}     │     • Click to edit      │
│   />                            │                          │
│                                 │  [▼] Features            │
│                                 │     • Click to edit      │
│                                 │                          │
│                                 │  [▼] Platform            │
│                                 │                          │
│                                 │  [Save page]             │
└─────────────────────────────────┴─────────────────────────┘
```

- Left pane is the iframe, resizable.
- Right pane is a scrollable list of section editor cards (same component as site-pages editor).
- When iframe posts `section-click`, admin scrolls the matching card into view and applies a `highlighted` class for 2s.
- When user edits and saves, admin posts `reload` back to the iframe with a cache-bust.

### Theme side — `EditorBridge.tsx`

Client component. Loaded unconditionally in the layout; short-circuits if `?editMode` isn't present.

```tsx
'use client';
import { useEffect } from 'react';

export default function EditorBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editMode = params.get('editMode');
    if (!editMode) return;

    // Announce readiness.
    window.parent.postMessage({ type: 'ready', mode: editMode }, '*');

    // Outline on hover, click to edit.
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-section-id]');
      if (!el) return;
      el.classList.add('__editor-hover');
      window.parent.postMessage({ type: 'section-hover', sectionId: el.getAttribute('data-section-id') }, '*');
    };
    const onOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-section-id]');
      el?.classList.remove('__editor-hover');
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-section-id]');
      if (!el) return;
      e.preventDefault();
      window.parent.postMessage({ type: 'section-click', sectionId: el.getAttribute('data-section-id') }, '*');
    };

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('click', onClick, true);

    // Parent asks for a reload or scroll.
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'scroll-to-section') {
        const target = document.querySelector(`[data-section-id="${e.data.sectionId}"]`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (e.data?.type === 'reload') {
        window.location.reload();
      }
    };
    window.addEventListener('message', onMessage);

    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return null;
}
```

Plus a small CSS block for the `__editor-hover` outline.

### Security

The `editMode=<secret>` query enables edit helpers. In dev it's hard-coded; in prod it should be the `REVALIDATE_SECRET` so only people who know the secret can activate the overlay.

---

## What ships this session

1. `/dashboard/themes/visual-editor` page.
2. `EditorBridge` + `data-section-id` attributes on every section in the **Nimble** theme.
3. Sidebar entry for the Visual Editor (gated by `visualThemeEditor`).
4. Northwind integration in a follow-up — same mechanism, ~1 hour of work.

Everything else (tokens, style overrides, widget library) lands in future sessions.
