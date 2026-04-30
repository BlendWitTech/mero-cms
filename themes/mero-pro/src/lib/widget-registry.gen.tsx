/**
 * AUTO-GENERATED - do not edit by hand.
 * Generated from theme.json widgetCatalog by
 *   node scripts/theme-build-registry.js mero-marketing
 *
 * Theme:    Mero Marketing (mero-marketing)
 * Version:  1.0.0
 * Widgets:  21
 */

import type { ComponentType } from 'react';
import { renderPluginWidget } from '@/_shared';

import { Accordion, Carousel, ComparisonTable, ContactForm, Countdown, FAQ, FeatureBlocks, FinalCTA, Gallery, Hero, ListSection, LogoStrip, PageHero, PricingTable, PricingTeaser, RichContent, Stats, Tabs, Testimonials, UseCases, VideoEmbed } from '@/_shared';

type AnyData = Record<string, unknown>;

type WidgetEntry = {
    component: ComponentType<{ data?: any }>;
};

const REGISTRY: Record<string, WidgetEntry> = {
    Hero: { component: Hero as ComponentType<{ data?: any }> },
    PageHero: { component: PageHero as ComponentType<{ data?: any }> },
    RichContent: { component: RichContent as ComponentType<{ data?: any }> },
    ListSection: { component: ListSection as ComponentType<{ data?: any }> },
    LogoStrip: { component: LogoStrip as ComponentType<{ data?: any }> },
    Stats: { component: Stats as ComponentType<{ data?: any }> },
    FinalCTA: { component: FinalCTA as ComponentType<{ data?: any }> },
    FeatureBlocks: { component: FeatureBlocks as ComponentType<{ data?: any }> },
    UseCases: { component: UseCases as ComponentType<{ data?: any }> },
    PricingTeaser: { component: PricingTeaser as ComponentType<{ data?: any }> },
    Testimonials: { component: Testimonials as ComponentType<{ data?: any }> },
    FAQ: { component: FAQ as ComponentType<{ data?: any }> },
    ContactForm: { component: ContactForm as ComponentType<{ data?: any }> },
    Carousel: { component: Carousel as ComponentType<{ data?: any }> },
    VideoEmbed: { component: VideoEmbed as ComponentType<{ data?: any }> },
    Gallery: { component: Gallery as ComponentType<{ data?: any }> },
    Accordion: { component: Accordion as ComponentType<{ data?: any }> },
    Tabs: { component: Tabs as ComponentType<{ data?: any }> },
    Countdown: { component: Countdown as ComponentType<{ data?: any }> },
    PricingTable: { component: PricingTable as ComponentType<{ data?: any }> },
    ComparisonTable: { component: ComparisonTable as ComponentType<{ data?: any }> },
};

const ID_TO_TYPE: Record<string, string> = {
    'body': 'RichContent',
    'cases': 'ListSection',
    'contact-form': 'ContactForm',
    'cta': 'FinalCTA',
    'faq': 'FAQ',
    'featured': 'ListSection',
    'features': 'FeatureBlocks',
    'final-cta': 'FinalCTA',
    'form': 'ContactForm',
    'hero': 'Hero',
    'later': 'ListSection',
    'list': 'ListSection',
    'list-section': 'ListSection',
    'logos': 'LogoStrip',
    'next': 'ListSection',
    'now': 'ListSection',
    'options': 'ListSection',
    'page-hero': 'PageHero',
    'pagehero': 'PageHero',
    'practices': 'ListSection',
    'pricing': 'PricingTeaser',
    'quotes': 'Testimonials',
    'releases': 'ListSection',
    'rich-content': 'RichContent',
    'richcontent': 'RichContent',
    'roles': 'ListSection',
    'stats': 'Stats',
    'testimonials': 'Testimonials',
    'themes': 'ListSection',
    'topics': 'ListSection',
    'use-cases': 'UseCases',
    'usecases': 'UseCases',
    'values': 'ListSection',
};

export interface WidgetLike {
    id?: string;
    type?: string;
    enabled?: boolean;
    data?: AnyData;
    pluginSlug?: string | null;
}

function widgetKey(w: WidgetLike): string {
    const explicit = (w.type || '').trim();
    if (explicit) return explicit;
    const rawId = (w.id || '').trim();
    if (!rawId) return '';
    if (rawId in REGISTRY) return rawId;
    const mapped = ID_TO_TYPE[rawId.toLowerCase()];
    return mapped || rawId;
}

export function renderWidgets(widgets: WidgetLike[] | null | undefined) {
    if (!Array.isArray(widgets)) return null;
    return widgets
        .filter((w) => w?.enabled !== false)
        .map((w, i) => {
            const type = widgetKey(w);
            const key = w.id || `${type}-${i}`;
            // Plugin-contributed widget (Phase 6.2) — route through the
            // runtime plugin-widget renderer rather than the static map.
            if (w.pluginSlug) {
                return renderPluginWidget(w.pluginSlug, type, w.data, key);
            }
            const entry = REGISTRY[type];
            if (!entry) {
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn(`[widget-registry] unknown widget type: "${type}"`);
                }
                return null;
            }
            const Component = entry.component;
            return <Component key={key} data={w.data as any} />;
        });
}

export function isKnownWidgetType(type: string): boolean {
    return type in REGISTRY;
}

export function knownWidgetTypes(): string[] {
    return Object.keys(REGISTRY);
}
