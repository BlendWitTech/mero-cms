import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'About Mero',
        title: 'Built by people who actually have to use it.',
        subtitle: 'A small team obsessed with making content management feel like the rest of your stack — fast, opinionated, and out of your way.',
    } },
    { id: 'stats', type: 'Stats', enabled: true, data: {} },
    { id: 'cta', type: 'FinalCTA', enabled: true, data: {} },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('about', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
