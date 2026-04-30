import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = simpleLayout(
    {
        eyebrow: 'Legal',
        title: 'Privacy policy',
        subtitle: 'Last updated: April 2026.',
    },
    {
        title: 'Your privacy',
        body: '## What we collect\n\nAccount info (name, email), billing info (held by Stripe / Khalti / eSewa \u2014 never us), and product usage telemetry.\n\n## What we don\u2019t collect\n\nWe do not sell your data. We do not run third-party ad pixels. We do not read your content.\n\n## Where data lives\n\nSelf-hosted: your servers, your rules. Cloud: Frankfurt (EU customers) or Singapore (APAC). You choose at signup.\n\n## Your rights\n\nExport, delete, or correct your data at any time from Settings \u2192 Data.\n\n## Contact\n\nQuestions? privacy@mero.cms.',
    },
);

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('legal-privacy', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
