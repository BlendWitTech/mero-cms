import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = simpleLayout(
    {
        eyebrow: 'Legal',
        title: 'Data processing addendum',
        subtitle: 'Last updated: April 2026.',
    },
    {
        title: 'DPA',
        body: '## 1. Roles\n\nYou are the Controller. Mero CMS is the Processor.\n\n## 2. Subject matter\n\nProcessing of personal data submitted to the service by your end users in the course of providing the service.\n\n## 3. Sub-processors\n\nA current list is published at /legal/sub-processors. We notify you 30 days in advance of any addition.\n\n## 4. Security\n\nWe implement and maintain the technical and organizational measures described in our Security page.\n\n## 5. International transfers\n\nFor EU customers, we rely on EU Standard Contractual Clauses. Data residency in Frankfurt is available.\n\n## 6. Termination\n\nUpon termination, we delete or return all personal data within 30 days, at your option.',
    },
);

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('legal-dpa', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
