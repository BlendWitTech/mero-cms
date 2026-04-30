import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Features',
        title: 'Everything a content team needs.',
        subtitle: 'Six core capabilities, each one designed to feel inevitable once you\u2019ve used it.',
    } },
    { id: 'features',  type: 'FeatureBlocks', enabled: true, data: {} },
    { id: 'use-cases', type: 'UseCases',      enabled: true, data: {} },
    { id: 'stats',     type: 'Stats',         enabled: true, data: {} },
    { id: 'cta',       type: 'FinalCTA',      enabled: true, data: {} },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('features', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
