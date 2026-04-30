import { unstable_noStore as noStore } from 'next/cache';
import Reveal from '@/components/ui/Reveal';
import { getSiteData, getPage, getActiveThemeConfig, mediaUrl } from '@/lib/api';
import { renderWidgets, type WidgetLike } from '@/lib/widget-registry';
import { renderWidgetsForDesign } from '@/lib/design-renderer';

// Bundle-aware: the home page picks its components based on
// `bundle.activeDesign`. ISR caches the BUILT HTML for whichever
// design was active at build time, so a design switch via the admin
// picker would leave stale HTML in cache for `revalidate` seconds.
// Set to 0 to opt out of ISR entirely — every request resolves the
// current active design and renders fresh. Public traffic still gets
// CDN edge caching from the upstream proxy if one is configured;
// what we lose is Next.js's in-process build cache, which costs a
// single round-trip to /themes/active/config per request.
export const revalidate = 0;

/**
 * Default home-page layout used when no widgets have been saved yet
 * (fresh install, backend offline). Each entry references a registered
 * widget type — the widget-registry routes them to their components,
 * which fall through to their own DEFAULTS when `data` is empty.
 *
 * Once the user touches the page in the visual editor, this list is
 * superseded by `page.data.widgets` (or the legacy `page.data.sections`
 * if the page was saved before the registry pivot).
 */
const DEFAULT_HOME_LAYOUT: WidgetLike[] = [
    { id: 'hero',         type: 'Hero',          enabled: true, data: {} },
    { id: 'logos',        type: 'LogoStrip',     enabled: true, data: {} },
    { id: 'features',     type: 'FeatureBlocks', enabled: true, data: {} },
    { id: 'use-cases',    type: 'UseCases',      enabled: true, data: {} },
    { id: 'stats',        type: 'Stats',         enabled: true, data: {} },
    { id: 'pricing',      type: 'PricingTeaser', enabled: true, data: {} },
    { id: 'testimonials', type: 'Testimonials',  enabled: true, data: {} },
    { id: 'faq',          type: 'FAQ',           enabled: true, data: {} },
    { id: 'cta',          type: 'FinalCTA',      enabled: true, data: {} },
];

/**
 * Home page — data-driven via the widget-registry.
 *
 * The page composition is now stored as a list of widget instances on
 * `page.data.widgets` (canonical) or `page.data.sections` (legacy back-
 * compat). Each entry has `{id, type, data}` — the registry's
 * `renderWidgets()` looks up the component by `type` and hands it the
 * `data`. This is what makes the visual editor's "drop a Hero, save,
 * see it on the page" loop actually close.
 *
 * Three siteData fallbacks are merged in before render so legacy
 * settings (heroTitle, ctaText, etc.) still bleed into the right
 * widgets when the user hasn't customized them in the editor:
 *   - Hero / FinalCTA: settings.heroTitle / heroSubtitle / ctaText / ctaUrl
 *   - Testimonials: site.testimonials list
 *
 * When the backend is offline `siteData` and `page` are null. We fall
 * back to `DEFAULT_HOME_LAYOUT` so the page still renders edge-to-edge
 * from component DEFAULTS — no broken page even with no API.
 */
export default async function HomePage({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    // When the visual editor iframes us with ?editMode=<secret>, bypass
    // the ISR cache so every save instantly reflects in the preview.
    // Without this, Next.js's 120s revalidate window means edits
    // disappear into the void for two minutes — making the editor feel
    // broken even though saves are persisting fine. Production traffic
    // (no editMode) keeps the cache and the perf benefits.
    const sp = searchParams ? await searchParams : undefined;
    if (sp?.editMode) noStore();

    const [site, page, themeConfig] = await Promise.all([
        getSiteData(),
        getPage('home'),
        getActiveThemeConfig(),
    ]);
    const activeDesign =
        themeConfig?.activeDesign ||
        themeConfig?.bundle?.activeDesign ||
        'marketing';
    const s = site?.settings;

    // Pull the widget array. Prefer the new `widgets` shape; fall back
    // to the legacy `sections` shape so pages saved before the editor
    // pivot keep rendering. If neither exists, use the default layout.
    const saved =
        (page?.data as any)?.widgets ??
        (page?.data as any)?.sections ??
        null;
    const widgets: WidgetLike[] =
        Array.isArray(saved) && saved.length ? saved : DEFAULT_HOME_LAYOUT;

    // Legacy siteData fallbacks. We mutate widget instances by id/type
    // so the FIRST Hero on the page picks up settings.heroTitle, the
    // FIRST FinalCTA picks up settings.ctaText, and the FIRST
    // Testimonials picks up site.testimonials. Anything the user
    // explicitly authored on the widget itself wins (spread last).
    const heroOverrides = {
        ...(s?.heroTitle && { title: s.heroTitle }),
        ...(s?.heroSubtitle && { subtitle: s.heroSubtitle }),
        ...(s?.ctaText && { primaryCta: s.ctaText }),
        ...(s?.ctaUrl && { primaryHref: s.ctaUrl }),
    };
    const ctaOverrides = {
        ...(s?.ctaText && { primaryCta: s.ctaText }),
        ...(s?.ctaUrl && { primaryHref: s.ctaUrl }),
    };
    const testimonialsOverrides = site?.testimonials?.length
        ? {
              testimonials: site.testimonials.map((t) => ({
                  quote: t.content,
                  name: t.name,
                  role: [t.role, t.clientCompany].filter(Boolean).join(' · '),
              })),
          }
        : {};

    let firstHero = true;
    let firstCta = true;
    let firstTestimonials = true;
    const enriched: WidgetLike[] = widgets.map((w) => {
        const type = (w.type || w.id || '').toString();
        if (firstHero && (type === 'Hero' || type === 'hero')) {
            firstHero = false;
            return { ...w, data: { ...heroOverrides, ...(w.data || {}) } };
        }
        if (firstCta && (type === 'FinalCTA' || type === 'cta')) {
            firstCta = false;
            return { ...w, data: { ...ctaOverrides, ...(w.data || {}) } };
        }
        if (firstTestimonials && (type === 'Testimonials' || type === 'testimonials')) {
            firstTestimonials = false;
            return { ...w, data: { ...testimonialsOverrides, ...(w.data || {}) } };
        }
        return w;
    });

    return (
        <Reveal>
            <main>{renderWidgetsForDesign(activeDesign, enriched)}</main>
        </Reveal>
    );
}

// Keep the unused-import lint quiet for the helper we re-export through
// lib for use in components that do per-page media resolution.
export const _mediaUrl = mediaUrl;
