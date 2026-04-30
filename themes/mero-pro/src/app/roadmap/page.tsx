import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Roadmap',
        title: 'Where Mero is going.',
        subtitle: 'Public, opinionated, and updated weekly.',
        primaryCta: 'Suggest a feature', primaryHref: 'mailto:feedback@mero.cms',
    } },
    { id: 'now',   type: 'ListSection', enabled: true, data: {
        eyebrow: 'Shipping this quarter', title: 'Now',
        items: [
            { title: 'Visual editor \u2014 GA',  body: 'Section locking, undo/redo, multi-user cursors.' },
            { title: 'Localization (i18n)',         body: 'Per-locale content, fallbacks, RTL support.' },
            { title: 'Audit log v2',                body: 'Diff view on every settings change.' },
        ],
    } },
    { id: 'next',  type: 'ListSection', enabled: true, data: {
        eyebrow: 'Next quarter', title: 'Next',
        items: [
            { title: 'Workflow + approvals',     body: 'Two-step publish, scheduled rollouts.' },
            { title: 'Data export (GDPR)',       body: 'Self-serve export of all tenant data.' },
            { title: 'Theme marketplace v2',     body: 'Paid themes, royalties, automatic updates.' },
        ],
    } },
    { id: 'later', type: 'ListSection', enabled: true, data: {
        eyebrow: 'On the horizon', title: 'Later',
        items: [
            { title: 'Edge image pipeline',       body: 'On-the-fly resize, focal-point cropping, AVIF.' },
            { title: 'A/B testing',               body: 'Split traffic at the section level.' },
            { title: 'Mobile app',                body: 'iOS + Android for editors on the go.' },
        ],
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('roadmap', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
