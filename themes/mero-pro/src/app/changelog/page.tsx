import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Changelog',
        title: 'What\u2019s new in Mero CMS.',
        subtitle: 'We ship every Tuesday. Here\u2019s the trail.',
    } },
    { id: 'releases', type: 'ListSection', enabled: true, data: {
        eyebrow: 'Recent releases',
        title: 'v1.5 \u2192 today',
        layout: 'list',
        items: [
            { title: 'v1.5.0 \u2014 Visual editor (beta)', body: 'Inline editing on the public site. Section toolbar. Drag-to-reorder.' },
            { title: 'v1.4.0 \u2014 AI Studio',            body: 'Per-tenant prompt routing. Brand-voice presets. SEO meta + alt-text generators.' },
            { title: 'v1.3.0 \u2014 Multi-provider payments', body: 'Stripe, Khalti, eSewa. Idempotent webhooks. Order lifecycle hooks.' },
            { title: 'v1.2.0 \u2014 Plugin gallery',       body: 'Tier \u00d7 theme compatibility matrix. One-click install.' },
            { title: 'v1.1.0 \u2014 Custom collections',   body: 'JSON-schema driven. Auto-generated admin UI.' },
        ],
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('changelog', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
