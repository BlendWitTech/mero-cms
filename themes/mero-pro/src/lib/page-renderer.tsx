/**
 * Shared CMS-page renderer for inner marketing pages.
 *
 * Every "pure widget" route (about, contact, customers, careers, etc.)
 * follows the same shape:
 *   1. Fetch the page record by slug
 *   2. Pull `data.widgets` (canonical) or `data.sections` (legacy)
 *   3. Fall back to a per-page DEFAULT_LAYOUT when nothing is saved
 *   4. Render via the widget-registry
 *
 * Centralizing it here keeps each page.tsx down to ~10 lines: import,
 * declare DEFAULT_LAYOUT, call `renderCmsPage(slug, layout)`. New
 * routes can be added in minutes without copy-pasting fetch logic.
 *
 * Note: this is intentionally NOT used for pages that need specialized
 * data (pricing's tier matrix from PACKAGES, blog's post listing,
 * docs's nav tree, the home page's siteData enrichment). Those keep
 * their bespoke renderers.
 */

import { unstable_noStore as noStore } from 'next/cache';
import Reveal from '@/components/ui/Reveal';
import { getPage } from '@/lib/api';
import { renderWidgets, type WidgetLike } from '@/lib/widget-registry';

export async function renderCmsPage(
    slug: string,
    defaultLayout: WidgetLike[],
    options?: { editMode?: boolean },
) {
    // Bypass the ISR cache when the visual editor is iframing us so
    // saves render immediately. See app/page.tsx for the full reasoning.
    if (options?.editMode) noStore();
    const page = await getPage(slug);
    const saved =
        (page?.data as any)?.widgets ??
        (page?.data as any)?.sections ??
        null;
    const widgets: WidgetLike[] =
        Array.isArray(saved) && saved.length ? saved : defaultLayout;

    return (
        <Reveal>
            <main>{renderWidgets(widgets)}</main>
        </Reveal>
    );
}

/** Convenience helper for the common case of "single PageHero +
    rich body" layouts (legal pages, simple about pages). */
export function simpleLayout(
    hero: { eyebrow?: string; title?: string; subtitle?: string } = {},
    body?: { title?: string; body?: string },
): WidgetLike[] {
    const out: WidgetLike[] = [
        { id: 'hero', type: 'PageHero', enabled: true, data: hero },
    ];
    if (body) {
        out.push({ id: 'body', type: 'RichContent', enabled: true, data: body });
    }
    return out;
}
