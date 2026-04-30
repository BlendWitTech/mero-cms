import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Talk to a human',
        title: 'We\u2019d love to hear from you.',
        subtitle: 'Sales, partnerships, support, or just hello \u2014 pick the channel that fits.',
    } },
    { id: 'form', type: 'ContactForm', enabled: true, data: {
        title: 'Tell us a little about your project.',
        subtitle: 'We typically reply within one business day.',
        email: 'hello@mero.cms',
        phone: '+977 1-555-0140',
        address: 'Kathmandu, Nepal',
    } },
    { id: 'options', type: 'ListSection', enabled: true, data: {
        eyebrow: 'Other channels',
        title: 'Pick what works for you.',
        layout: 'grid',
        items: [
            { title: 'Sales',   body: 'Pricing, enterprise, agencies.',         href: 'mailto:sales@mero.cms' },
            { title: 'Support', body: 'Existing customers, technical issues.',  href: 'mailto:support@mero.cms' },
            { title: 'Press',   body: 'Logos, quotes, story leads.',            href: 'mailto:press@mero.cms' },
            { title: 'Security','body': 'Disclose a vulnerability.',            href: 'mailto:security@mero.cms' },
        ],
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('contact', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
