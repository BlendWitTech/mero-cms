# Connecting Plugins to a Theme — Internal Developer Guide

How to surface marketplace-plugin features in a theme so the customer's site picks up extra functionality automatically when they install the plugin. For Blendwit / Mero engineers — assumes you've read [BUILDING_A_THEME.md](BUILDING_A_THEME.md) first.

---

## 1. The integration surfaces

A plugin can affect a theme in three ways:

1. **Capability flag** — the plugin enables a tier-locked feature (e.g. `forms`, `analytics`). The theme reads `useCapabilities()` and renders or hides UI based on which flags are true.
2. **Plugin-contributed widget** — the plugin's manifest declares widgets that show up in the editor's palette and can be rendered on the public site.
3. **Custom data source** — the plugin exposes a new `/public/<thing>` endpoint and the theme calls it.

This guide covers all three.

## 2. Capability gating in a theme

Every plugin install can flip a capability to `true` for the duration of the install. The theme reads the resulting capability map at request time:

```tsx
// Server-side
import { getCapabilities } from '@mero/theme-base';

const caps = await getCapabilities();
if (caps?.forms) {
    // Render the contact form section
}
```

```tsx
// Client-side via the provider mounted in layout.tsx
import { useCapabilities } from '@mero/theme-base';

function MaybeNewsletter() {
    const { has } = useCapabilities();
    if (!has('forms')) return null;
    return <NewsletterForm />;
}
```

There's a `<CapabilityGate>` helper that wraps both:

```tsx
import { CapabilityGate } from '@mero/theme-base';

<CapabilityGate capability="analytics" fallback={null}>
    <AnalyticsSummary />
</CapabilityGate>
```

The capability map is the single source of truth. Don't read installed-plugin lists directly from the backend — capabilities are the abstraction the theme layer is supposed to use, and they handle the "tier OR plugin can flip this on" logic for free.

## 3. Plugin-contributed widgets

When a plugin declares widgets in its manifest (`PluginManifest.widgets`), those widgets:

1. Show up in the visual editor's palette automatically.
2. Get stamped with `pluginSlug` in the catalog response so the theme renderer knows where they came from.
3. Need a real React component to render on the public site.

### 3.1 The runtime contract

`@mero/theme-base/lib/plugin-widgets` exports:

- `registerPluginWidget(pluginSlug, type, Component)` — call this at module-init time to plug a real component in for a plugin widget.
- `renderPluginWidget(pluginSlug, type, data, key)` — used by the widget-registry's `renderWidgets` for any widget with `pluginSlug` set. Falls back to a placeholder visible only in edit mode if no real component is registered.

### 3.2 Registering a plugin's component in your theme

If the plugin ships a React component as part of an npm package, the theme imports and registers it:

```tsx
// themes/<your-theme>/src/lib/plugin-bindings.tsx
import { registerPluginWidget } from '@mero/theme-base';
import CarouselPro from '@mero-plugin/carousel-pro';

// One-time registration. Idempotent — calling again with the same key
// replaces the registered component (handy for HMR during dev).
registerPluginWidget('carousel-pro', 'carousel-pro:Carousel', CarouselPro);
```

Import this binding file once at the top of your `app/layout.tsx`:

```tsx
import '@/lib/plugin-bindings';
```

That's it. When the customer installs the `carousel-pro` plugin AND has a Carousel widget on a page, the public site renders the real component. When they uninstall, the placeholder shows in the editor and the public site renders nothing.

### 3.3 The placeholder contract

Plugin widgets that haven't been registered render `<PluginWidgetPlaceholder />` — a small dashed box visible only in edit mode (the URL has `?editMode=`). On public traffic the placeholder renders nothing, so an uninstalled plugin doesn't break the page.

If you want a friendlier fallback (e.g. a "This carousel is loading…" skeleton on public traffic), pass a custom component:

```tsx
import { PluginWidgetPlaceholder } from '@mero/theme-base';

// Custom — registered the same way, with a "renderer pending" marker.
function CarouselSkeleton() { return <div className="h-64 bg-slate-100 rounded-xl" />; }
registerPluginWidget('carousel-pro', 'carousel-pro:Carousel', CarouselSkeleton);
```

## 4. Custom data sources

Plugins that ship new content models (e.g. `events`, `bookings`) typically expose a `/public/<thing>` endpoint. The theme calls it from a server component:

```tsx
// themes/<your-theme>/src/lib/api.ts — extend with the plugin's client
export interface EventRecord { id: string; title: string; startsAt: string; }

export function getUpcomingEvents(limit = 10): Promise<EventRecord[]> {
    return apiFetch<EventRecord[]>(`/public/events?limit=${limit}`, []);
}
```

Then guard the call so a missing plugin doesn't throw:

```tsx
import { getCapabilities, getUpcomingEvents } from '@/lib/api';

export async function EventsPanel() {
    const caps = await getCapabilities();
    if (!caps?.events) return null;        // plugin not installed or tier-gated
    const events = await getUpcomingEvents(5);
    if (!events.length) return null;
    return <ul>{events.map(e => <li key={e.id}>{e.title}</li>)}</ul>;
}
```

## 5. Tier × plugin matrix

Some capabilities are tier-only, some plugin-only, some either. The matrix you'll deal with most:

| Capability | Tier base | Plugin override | Where it gates |
| --- | --- | --- | --- |
| `forms` | Premium+ | — | Form submissions endpoint accepts. |
| `analytics` | Premium+ | `advanced-analytics` plugin extends with funnels/cohorts | Analytics section visibility + dashboard widgets. |
| `proWidgets` | Professional+ | `pro-widgets` plugin (future) unlocks for Premium | Editor palette `locked` flags. |
| `visualThemeEditor` | Professional+ | `visual-editor` plugin unlocks for Premium | The editor route 403s without it. |
| `seoFull` | Premium+ | `seo-boost` plugin extends with schema.org | OG tag richness in the layout. |

When integrating a plugin, identify which capability it flips, write the gate, and test on a fresh dummy license before/after install.

## 6. Common pitfalls

- **Reading installed-plugin lists directly.** Don't do that — go through `useCapabilities()`. The capability map already accounts for both tier and plugin sources.
- **Forgetting to register the plugin component.** The widget shows in the editor's palette (because the catalog merge in the backend includes it) but the public site renders the placeholder. Symptom: editor looks fine, customers see a dashed box.
- **Importing the plugin package unconditionally.** If the plugin isn't installed in the customer's `node_modules`, the import throws at build time. Use dynamic `import()` or guard the require with a `try/catch`. Better: lazy-register only when `caps.<plugin>` is true.
- **Adding plugin-specific logic to a section component.** Section components should be plugin-agnostic — they receive `data` and render. Plugin integration belongs in `lib/plugin-bindings.tsx`, not inside `Hero.tsx`.

## 7. Where to go next

- [BUILDING_A_PLUGIN.md](BUILDING_A_PLUGIN.md) — write a new plugin from scratch.
- [BUILDING_A_THEME.md](BUILDING_A_THEME.md) — the theme side of the contract.
- [../PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) — long-form plugin spec including the manifest schema.
