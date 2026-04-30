import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Customers',
        title: 'Built for teams that ship.',
        subtitle: 'From two-person studios to 200-person product orgs \u2014 Mero scales with the work.',
    } },
    { id: 'logos', type: 'LogoStrip', enabled: true, data: { eyebrow: 'Trusted by 600+ teams worldwide' } },
    { id: 'cases', type: 'ListSection', enabled: true, data: {
        eyebrow: 'Case studies',
        title: 'How real teams use Mero.',
        layout: 'grid',
        items: [
            { title: 'Blendwit',  body: 'Migrated 2k pages off WordPress in 11 days.',    href: '/customers/blendwit' },
            { title: 'Paperline', body: 'Saved $14k/yr by replacing three tools with one.', href: '/customers/paperline' },
            { title: 'Sequence',  body: 'Custom collections power a public knowledge base.', href: '/customers/sequence' },
        ],
    } },
    { id: 'cta', type: 'FinalCTA', enabled: true, data: {
        title: 'Start with Mero today.',
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('customers', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
