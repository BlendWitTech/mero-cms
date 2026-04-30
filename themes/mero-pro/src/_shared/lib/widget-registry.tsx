/**
 * Widget registry — type → component map.
 *
 * The visual editor lets users compose a page from a free-form list of
 * widget instances (`{type, data}`). At render time, the public theme
 * receives that array and dispatches each entry through this registry
 * to the right React component. Without this, adding a "Carousel"
 * widget in the editor would have nothing to render on the public site.
 *
 * To add a new widget:
 *   1. Add the section component to `components/sections/`.
 *   2. Register its type → component here.
 *   3. Add the widget to `theme.json` `widgetCatalog[]` so the editor
 *      palette can offer it.
 *   4. Optionally add a `moduleSchemas[<Type>]` entry so the inspector
 *      knows what fields to render.
 *
 * Backward compatibility: the renderer accepts both the new `widgets`
 * shape (`{type, data}`) and the legacy `sections` shape (`{id, data}`,
 * with `id` matching the type). This way existing pages saved before
 * the editor pivot keep rendering without a migration.
 */

import type { ComponentType } from 'react';
import { renderPluginWidget } from './plugin-widgets';

import Hero, { type HeroData } from '../components/sections/Hero';
import LogoStrip, { type LogoStripData } from '../components/sections/LogoStrip';
import FeatureBlocks, { type FeatureBlocksData } from '../components/sections/FeatureBlocks';
import UseCases, { type UseCasesData } from '../components/sections/UseCases';
import Stats, { type StatsData } from '../components/sections/Stats';
import PricingTeaser, { type PricingTeaserData } from '../components/sections/PricingTeaser';
import Testimonials, { type TestimonialsData } from '../components/sections/Testimonials';
import FAQ, { type FAQData } from '../components/sections/FAQ';
import FinalCTA, { type FinalCTAData } from '../components/sections/FinalCTA';
import PageHero, { type PageHeroData } from '../components/sections/PageHero';
import RichContent, { type RichContentData } from '../components/sections/RichContent';
import ListSection, { type ListSectionData } from '../components/sections/ListSection';
import ContactForm, { type ContactFormData } from '../components/sections/ContactForm';

// New section types declared in pageSchema for the 12 extra pages
// (contact, blog, customers, careers, docs, etc.). Each one is a
// thin wrapper that renders its `data` prop using the same visual
// language as the existing sections so the editor's add-button
// can drop them anywhere without breaking the layout.
//
// Implementations live in components/sections/ — if a referenced
// component doesn't exist yet, registry.get(type) falls back to a
// safe Unknown placeholder instead of crashing the page.
type AnyData = Record<string, unknown>;

type WidgetEntry = {
    component: ComponentType<{ data?: any }>;
};

const REGISTRY: Record<string, WidgetEntry> = {
    Hero:           { component: Hero as ComponentType<{ data?: HeroData }> },
    LogoStrip:      { component: LogoStrip as ComponentType<{ data?: LogoStripData }> },
    FeatureBlocks:  { component: FeatureBlocks as ComponentType<{ data?: FeatureBlocksData }> },
    UseCases:       { component: UseCases as ComponentType<{ data?: UseCasesData }> },
    Stats:          { component: Stats as ComponentType<{ data?: StatsData }> },
    PricingTeaser:  { component: PricingTeaser as ComponentType<{ data?: PricingTeaserData }> },
    Testimonials:   { component: Testimonials as ComponentType<{ data?: TestimonialsData }> },
    FAQ:            { component: FAQ as ComponentType<{ data?: FAQData }> },
    FinalCTA:       { component: FinalCTA as ComponentType<{ data?: FinalCTAData }> },
    // Generic content widgets — used by inner pages (about / contact /
    // careers / customers / docs / changelog / roadmap / themes / legal)
    // composed from the visual editor's palette.
    PageHero:       { component: PageHero as ComponentType<{ data?: PageHeroData }> },
    RichContent:    { component: RichContent as ComponentType<{ data?: RichContentData }> },
    ListSection:    { component: ListSection as ComponentType<{ data?: ListSectionData }> },
    ContactForm:    { component: ContactForm as ComponentType<{ data?: ContactFormData }> },
};

/**
 * Anything that looks like a widget — accepting both the new
 * `{type, data}` shape and the legacy `{id, data}` shape used by
 * pageSchema-era pages. Type discovery falls back to `id` (and then
 * through the legacy id→type map below) so a section saved as
 * `{id: 'hero', data: {...}}` still routes to the Hero component.
 */
export interface WidgetLike {
    id?: string;
    type?: string;
    enabled?: boolean;
    data?: AnyData;
    /** When set, the widget was contributed by an installed plugin
        (Phase 6.1, #88). The renderer routes such widgets through
        `renderPluginWidget` instead of the static REGISTRY so themes
        can plug in a real component (or fall back to the placeholder)
        without needing to regenerate widget-registry.tsx every install. */
    pluginSlug?: string | null;
}

/**
 * Legacy section-id → registered type map. Pages saved before the
 * widget pivot stored `{id: 'hero', data: {...}}` with no `type`
 * field. The registry is keyed by the PascalCase type (Hero, LogoStrip,
 * etc.), so the lowercase id misses every lookup and the page renders
 * blank. This table bridges the old and new data shapes for the
 * canonical Mero Marketing section ids.
 *
 * When you add a new built-in section to the theme, also add its
 * common id aliases here. Casing is normalised to lowercase before
 * lookup, so 'Hero' / 'hero' / 'HERO' all resolve.
 */
const ID_TO_TYPE: Record<string, string> = {
    // Home page legacy ids
    'hero':         'Hero',
    'logos':        'LogoStrip',
    'features':     'FeatureBlocks',
    'use-cases':    'UseCases',
    'usecases':     'UseCases',
    'stats':        'Stats',
    'pricing':      'PricingTeaser',
    'testimonials': 'Testimonials',
    'faq':          'FAQ',
    'cta':          'FinalCTA',
    'final-cta':    'FinalCTA',

    // Inner-page legacy ids
    'page-hero':    'PageHero',
    'pagehero':     'PageHero',
    'rich-content': 'RichContent',
    'richcontent':  'RichContent',
    'list-section': 'ListSection',
    'list':         'ListSection',
    'contact-form': 'ContactForm',
    'form':         'ContactForm',
    'body':         'RichContent',
    'topics':       'ListSection',
    'releases':     'ListSection',
    'now':          'ListSection',
    'next':         'ListSection',
    'later':        'ListSection',
    'roles':        'ListSection',
    'values':       'ListSection',
    'cases':        'ListSection',
    'quotes':       'Testimonials',
    'options':      'ListSection',
    'practices':    'ListSection',
    'themes':       'ListSection',
    'featured':     'ListSection',
};

/**
 * Resolve a widget entry to a registered type name. Order:
 *   1. `type` — canonical, set by new code paths
 *   2. `id` — exact match (e.g. saved as type-name 'Hero')
 *   3. `id` lowercased through ID_TO_TYPE (e.g. 'hero' → 'Hero')
 *   4. '' — caller renders nothing and logs once
 */
function widgetKey(w: WidgetLike): string {
    const explicit = (w.type || '').trim();
    if (explicit) return explicit;
    const rawId = (w.id || '').trim();
    if (!rawId) return '';
    if (rawId in REGISTRY) return rawId; // direct PascalCase match
    const mapped = ID_TO_TYPE[rawId.toLowerCase()];
    return mapped || rawId;
}

/**
 * Render a list of widgets. Skips entries that are explicitly
 * disabled (`enabled === false`) or reference an unknown type.
 *
 * This is the canonical way for a theme route to render its content:
 *
 *   const page = await getPage('about');
 *   const widgets = page?.data?.widgets ?? page?.data?.sections ?? [];
 *   return <main>{renderWidgets(widgets)}</main>;
 */
export function renderWidgets(widgets: WidgetLike[] | null | undefined) {
    if (!Array.isArray(widgets)) return null;
    return widgets
        .filter((w) => w?.enabled !== false)
        .map((w, i) => {
            const type = widgetKey(w);
            const key = w.id || `${type}-${i}`;
            // The wrapper carries the section's *instance* identity so
            // the visual editor's bridge can target THIS specific
            // section — even when the page contains multiple sections
            // of the same type (two Heroes, three CTAs, etc.). Without
            // a unique wrapper id, all the inner section components
            // would share the same hardcoded `data-section-id="hero"`,
            // and the bridge's `querySelector('[data-section-id="X"]')`
            // would always match the FIRST instance — making added or
            // duplicated sections invisible to highlight, click-to-
            // edit, and live field updates.
            //
            // `display: contents` removes the wrapper from the layout
            // tree, so the inner section's CSS (margins, grid, full-
            // width treatments) keeps working as if there were no
            // wrapper at all. From the bridge's perspective the
            // wrapper is the section; from CSS's perspective it isn't
            // there.
            const instanceId = (w.id || `${type}-${i}`).toString();

            // Plugin-contributed widget — route through the runtime
            // plugin-widget renderer instead of the static REGISTRY.
            if (w.pluginSlug) {
                return (
                    <div
                        key={key}
                        data-section-id={instanceId}
                        data-section-type={type}
                        style={{ display: 'contents' }}
                    >
                        {renderPluginWidget(w.pluginSlug, type, w.data, key)}
                    </div>
                );
            }

            const entry = REGISTRY[type];
            if (!entry) {
                // Unknown widget — render nothing on the public site so a
                // half-configured page doesn't blow up. The editor still
                // shows it in the section list with a "Component missing"
                // warning so authors know to remove or fix it.
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn(`[widget-registry] unknown widget type: "${type}"`);
                }
                return null;
            }
            const Component = entry.component;
            return (
                <div
                    key={key}
                    data-section-id={instanceId}
                    data-section-type={type}
                    style={{ display: 'contents' }}
                >
                    <Component data={w.data as any} />
                </div>
            );
        });
}

/**
 * Whether a given type is renderable. Useful for the editor when it
 * wants to badge unknown widgets without crashing.
 */
export function isKnownWidgetType(type: string): boolean {
    return type in REGISTRY;
}

/**
 * Expose the list of registered types — handy for diagnostics and the
 * placeholder-when-empty experience on a freshly created page.
 */
export function knownWidgetTypes(): string[] {
    return Object.keys(REGISTRY);
}
