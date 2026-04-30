import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Careers',
        title: 'Build the CMS you wish existed.',
        subtitle: 'Small team, fully remote, async-first. We hire for taste, judgement, and a high bar for craft.',
        primaryCta: 'See open roles', primaryHref: '#roles',
    } },
    { id: 'values', type: 'ListSection', enabled: true, data: {
        eyebrow: 'How we work',
        title: 'What you can expect.',
        items: [
            { title: 'Async by default',     body: 'Few meetings, lots of writing. Your calendar belongs to you.' },
            { title: 'Ship something real',  body: 'First-week PR is the norm. We don\u2019t believe in three-month onboarding.' },
            { title: 'Generous tooling',     body: 'Whatever you need to do your best work \u2014 laptops, software, conferences.' },
            { title: 'Equity that matters',  body: 'Real ownership, not lottery tickets. Liquid at every secondary.' },
        ],
    } },
    { id: 'roles', type: 'ListSection', enabled: true, data: {
        eyebrow: 'Open positions',
        title: 'Join us.',
        layout: 'list',
        items: [
            { title: 'Senior full-stack engineer',   body: 'Remote \u00b7 Full-time \u00b7 NestJS + Next.js',        href: '/careers/senior-fullstack' },
            { title: 'Product designer',             body: 'Remote \u00b7 Full-time \u00b7 Figma + design systems', href: '/careers/product-designer' },
            { title: 'Developer relations',          body: 'Remote \u00b7 Full-time \u00b7 Docs, demos, community', href: '/careers/devrel' },
            { title: 'Customer success engineer',    body: 'Remote \u00b7 Full-time \u00b7 Migrations + support',    href: '/careers/customer-success' },
        ],
    } },
    { id: 'cta', type: 'FinalCTA', enabled: true, data: {
        title: 'Don\u2019t see your role?',
        subtitle: 'We\u2019re always happy to hear from sharp people.',
        primaryCta: 'Email us', primaryHref: 'mailto:work@mero.cms',
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('careers', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
