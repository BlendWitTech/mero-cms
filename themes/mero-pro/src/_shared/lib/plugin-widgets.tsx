/**
 * Plugin widget runtime — Phase 6.2 (#89).
 *
 * Plugins contribute widgets to the visual editor's palette via their
 * manifest (Phase 6.1, #88). When an author drops a plugin widget onto
 * a page, the public site needs a component to render it. There are
 * two delivery paths:
 *
 *   1. **Code-shipped (preferred)** — the plugin ships a real React
 *      component as part of an npm package the theme installs. The
 *      theme registers it via `registerPluginWidget(pluginSlug, type,
 *      Component)` at module-init time. The widget then renders just
 *      like a built-in.
 *
 *   2. **Placeholder** — when a plugin is enabled but its component
 *      package isn't installed (or the theme hasn't registered it yet)
 *      the public site renders a small `<PluginWidgetPlaceholder>` so
 *      the page doesn't blow up and the editor can still place the
 *      widget.
 *
 * Theme authors wire this up once in their root layout (or any module
 * that runs at startup):
 *
 *   import { registerPluginWidget } from '@mero/theme-base/lib/plugin-widgets';
 *   import CarouselWidget from '@mero-plugin/carousel-pro';
 *
 *   registerPluginWidget('carousel-pro', 'carousel-pro:Carousel', CarouselWidget);
 *
 * The widget-registry's renderWidgets falls back to renderPluginWidget
 * for any widget shape that has a `pluginSlug`.
 */

import type { ComponentType } from 'react';

// ── Registry ────────────────────────────────────────────────────────

/** key = `${pluginSlug}:${type}` so two plugins can both ship a
    "Carousel" without colliding. */
const REGISTRY = new Map<string, ComponentType<{ data?: any }>>();

function k(pluginSlug: string, type: string) {
    return `${pluginSlug}:${type}`;
}

/**
 * Register a real plugin-widget component. Idempotent — calling twice
 * with the same key replaces the previous registration (handy for HMR).
 */
export function registerPluginWidget(
    pluginSlug: string,
    type: string,
    component: ComponentType<{ data?: any }>,
) {
    REGISTRY.set(k(pluginSlug, type), component);
}

/**
 * Look up a registered plugin widget. Returns undefined when no theme
 * code has registered a real component yet.
 */
export function getPluginWidget(
    pluginSlug: string,
    type: string,
): ComponentType<{ data?: any }> | undefined {
    return REGISTRY.get(k(pluginSlug, type));
}

/** Diagnostics — list every registered plugin widget. */
export function listPluginWidgets(): { pluginSlug: string; type: string }[] {
    const out: { pluginSlug: string; type: string }[] = [];
    for (const key of REGISTRY.keys()) {
        const idx = key.indexOf(':');
        out.push({ pluginSlug: key.slice(0, idx), type: key.slice(idx + 1) });
    }
    return out;
}

// ── Placeholder component ───────────────────────────────────────────

/**
 * Rendered when a plugin widget is on the page but no real component
 * has been registered for it. Visible in editor mode, hidden on public
 * traffic so a half-configured plugin doesn't leak a "broken" badge to
 * end-users. The editor can still click and remove the widget.
 */
export function PluginWidgetPlaceholder({
    pluginSlug,
    type,
}: {
    pluginSlug: string;
    type: string;
}) {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const editMode = !!params.get('editMode');
        if (!editMode) return null;
    } else {
        // SSR: render nothing — the editor will SSR-hydrate then this
        // component mounts client-side and the editMode check kicks in.
        return null;
    }

    return (
        <div
            data-section-id={`plugin:${pluginSlug}:${type}`}
            data-section-type={type}
            style={{
                padding: '24px',
                margin: '12px 0',
                border: '1px dashed rgba(0,0,0,0.18)',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.02)',
                color: 'var(--ink-3, #6b7280)',
                fontSize: '13px',
                lineHeight: 1.5,
            }}
        >
            <strong style={{ display: 'block', color: 'var(--ink-1, #111)', marginBottom: 4 }}>
                {type}
            </strong>
            Provided by the <code>{pluginSlug}</code> plugin. Install the
            plugin's component package and call{' '}
            <code>registerPluginWidget(&apos;{pluginSlug}&apos;, &apos;{type}&apos;, …)</code>{' '}
            in your theme to render it on the public site.
        </div>
    );
}

// ── Renderer ────────────────────────────────────────────────────────

/**
 * Render a plugin widget. Falls back to the placeholder when no
 * component is registered. Designed to be called from the widget-
 * registry's `renderWidgets` for any widget that has a `pluginSlug`.
 */
export function renderPluginWidget(
    pluginSlug: string,
    type: string,
    data: any,
    key: string | number,
) {
    const Component = getPluginWidget(pluginSlug, type);
    if (Component) {
        return <Component key={key} data={data} />;
    }
    return <PluginWidgetPlaceholder key={key} pluginSlug={pluginSlug} type={type} />;
}
