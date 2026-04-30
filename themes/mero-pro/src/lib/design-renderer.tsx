/**
 * Design dispatcher — Phase 7 (#117).
 *
 * Picks the right widget-registry based on `bundle.activeDesign` and
 * renders the page's widget list through it. Falls back to the
 * marketing registry when:
 *   - the design key is unknown (theme.json edited mid-deploy),
 *   - the active design key is 'marketing' (the inherited default),
 *   - or `activeDesign` is empty (legacy non-bundle setup).
 *
 * Each design's registry exports a `REGISTRY` map keyed by widget
 * `type`. We dispatch entries that share the type (Hero, FeatureBlocks,
 * etc.) to the design-local component while preserving the same data
 * shape — switching designs never destroys content, just re-renders it
 * through different components.
 */

import type { ComponentType } from 'react';
import { renderWidgets, type WidgetLike } from './widget-registry';
import { REGISTRY as BLENDWIT } from '@/designs/blendwit-tech/widget-registry';
import { REGISTRY as VIVID }    from '@/designs/vivid/widget-registry';

type WidgetEntry = { component: ComponentType<{ data?: any }> };

/** Map design key → registry. Add new bundles here when they ship. */
const DESIGN_REGISTRIES: Record<string, Record<string, WidgetEntry>> = {
    'blendwit-tech': BLENDWIT as any,
    'vivid':         VIVID    as any,
};

/**
 * Render a list of widgets through the registry that matches the
 * given design key. The `marketing` design uses the bundle-level
 * registry exported from `@/lib/widget-registry` (which is what the
 * theme has always shipped with — no behaviour change for that path).
 */
export function renderWidgetsForDesign(
    design: string | null | undefined,
    widgets: WidgetLike[] | null | undefined,
) {
    if (!Array.isArray(widgets)) return null;
    const key = (design || 'marketing').trim();

    // Marketing falls through to the original registry — preserves
    // every existing render path with zero diff.
    if (key === 'marketing' || !DESIGN_REGISTRIES[key]) {
        return renderWidgets(widgets);
    }

    const registry = DESIGN_REGISTRIES[key];
    return widgets
        .filter((w) => w?.enabled !== false)
        .map((w, i) => {
            const type = (w.type || w.id || '').toString();
            const instanceId = (w.id || `${type}-${i}`).toString();
            const entry = registry[type];
            if (!entry) {
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn(`[design-renderer] design "${key}" has no component for "${type}"`);
                }
                return null;
            }
            const Component = entry.component;
            // Same instance-wrapper trick as the bundle-level renderer
            // so the visual editor's bridge can target each section by
            // its real ID even when multiple of the same type exist on
            // the page.
            return (
                <div
                    key={instanceId}
                    data-section-id={instanceId}
                    data-section-type={type}
                    style={{ display: 'contents' }}
                >
                    <Component data={w.data as any} />
                </div>
            );
        });
}
