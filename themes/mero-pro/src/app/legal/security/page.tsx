import { renderCmsPage, simpleLayout } from '@/lib/page-renderer';
import type { WidgetLike } from '@/lib/widget-registry';

export const revalidate = 120; // ISR — re-render every 2 minutes

const DEFAULT_LAYOUT: WidgetLike[] = [
    { id: 'hero', type: 'PageHero', enabled: true, data: {
        eyebrow: 'Legal',
        title: 'Security at Mero',
        subtitle: 'Defense-in-depth, not security theater.',
    } },
    { id: 'practices', type: 'ListSection', enabled: true, data: {
        eyebrow: 'Practices', title: 'What we do.',
        items: [
            { title: 'Encryption',     body: 'TLS 1.3 in transit. AES-256 at rest. Per-tenant key wrapping.' },
            { title: 'Authentication', body: 'JWT + refresh-token rotation. WebAuthn 2FA on every account.' },
            { title: 'Audit log',      body: 'Every settings change is logged with actor, IP, and diff.' },
            { title: 'Backups',        body: 'Hourly snapshots, 30-day retention, monthly restore drills.' },
            { title: 'Disclosure',     body: 'Bug bounty live. 90-day disclosure SLA. security.txt published.' },
            { title: 'Compliance',     body: 'SOC 2 Type II in progress. GDPR-ready DPA available on request.' },
        ],
    } },
    { id: 'body', type: 'RichContent', enabled: true, data: {
        title: 'Reporting a vulnerability',
        body: 'Email security@mero.cms with steps to reproduce. We acknowledge within 24 hours and triage within 72. Eligible reports earn bounties up to $5,000.',
    } },
];

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ editMode?: string }>;
} = {}) {
    const sp = searchParams ? await searchParams : undefined;
    return renderCmsPage('legal-security', DEFAULT_LAYOUT, { editMode: !!sp?.editMode });
}
