import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = simpleLayout(
    {
        eyebrow: 'Legal',
        title: 'Terms of service',
        subtitle: 'Last updated: April 2026.',
    },
    {
        title: 'Agreement',
        body: '## 1. Introduction\n\nThese Terms govern your use of Mero CMS. By using the service, you agree to be bound by these Terms.\n\n## 2. Accounts\n\nYou are responsible for keeping your account credentials secure. You must be at least 18 years old to create an account.\n\n## 3. Acceptable use\n\nYou may not use the service to host illegal content, send spam, or attempt to disrupt the service for other users.\n\n## 4. Payments\n\nLicenses are sold one-time. Refunds are available within 14 days of purchase, no questions asked.\n\n## 5. Liability\n\nThe service is provided as-is. We will not be liable for any indirect or consequential damages.\n\n## 6. Changes\n\nWe may update these Terms from time to time. We\u2019ll notify you of material changes by email.',
    },
);

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('legal-terms', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
