import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Themes',
        title: 'Beautiful starts. No design debt.',
        subtitle: 'Hand-built themes for marketing sites, blogs, docs, and storefronts. Install in one click.',
    } },
    { id: 'themes', type: 'ListSection', enabled: true, data: {
        eyebrow: 'Browse the gallery',
        title: 'Pick your starting point.',
        items: [
            { title: 'Mero Pro',  body: 'The flagship marketing theme.',  href: '/themes/mero-pro' },
            { title: 'Mero Docs',       body: 'Documentation theme with side-nav.', href: '/themes/mero-docs' },
            { title: 'Mero Storefront', body: 'Commerce-ready with checkout.',   href: '/themes/mero-storefront' },
            { title: 'Mero Journal',    body: 'Minimal blog \u2014 typography first.', href: '/themes/mero-journal' },
        ],
    } },
    { id: 'cta', type: 'FinalCTA', enabled: true, data: {
        title: 'Need something custom?',
        subtitle: 'Our partner agencies build bespoke themes.',
        primaryCta: 'Find a partner', primaryHref: '/contact?topic=partners',
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('themes', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
