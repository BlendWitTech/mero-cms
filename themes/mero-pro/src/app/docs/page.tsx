import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import PageHero from '@/components/ui/PageHero';

export const revalidate = 600;

export const metadata: Metadata = {
    title: 'Documentation',
    description: 'Mero CMS docs — installation, theme system, API reference, and how-to guides.',
};

interface DocSection {
    title: string;
    description: string;
    icon: string;
    color: string;
    links: { label: string; href: string }[];
}

const SECTIONS: DocSection[] = [
    {
        title: 'Get started',
        description: 'Install Mero CMS, deploy a theme, and ship your first page.',
        icon: '🚀',
        color: 'var(--pastel-pink)',
        links: [
            { label: 'Install + deploy in 5 minutes', href: '/docs/install' },
            { label: 'Pick a theme', href: '/docs/themes' },
            { label: 'Connect your domain', href: '/docs/domains' },
            { label: 'Invite your team', href: '/docs/team' },
        ],
    },
    {
        title: 'Theme system',
        description: 'Build your own theme — or fork one of ours. Every theme is a Next.js project.',
        icon: '🎨',
        color: 'var(--pastel-lav)',
        links: [
            { label: 'Anatomy of a theme', href: '/docs/themes/anatomy' },
            { label: 'theme.json reference', href: '/docs/themes/manifest' },
            { label: 'Section variants', href: '/docs/themes/variants' },
            { label: 'Custom field types', href: '/docs/themes/fields' },
        ],
    },
    {
        title: 'API reference',
        description: 'REST endpoints, authentication, webhooks. Everything you need to build on top.',
        icon: '🔌',
        color: 'var(--pastel-sky)',
        links: [
            { label: 'Authentication', href: '/docs/api/auth' },
            { label: 'Sites + sections', href: '/docs/api/sites' },
            { label: 'Webhooks (HMAC)', href: '/docs/api/webhooks' },
            { label: 'Capability matrix', href: '/docs/api/capabilities' },
        ],
    },
    {
        title: 'Capabilities',
        description: 'What each tier can do — and how the matrix gates features in code.',
        icon: '🧩',
        color: 'var(--pastel-pist)',
        links: [
            { label: 'Visual editor', href: '/docs/capabilities/visual-editor' },
            { label: 'AI Studio', href: '/docs/capabilities/ai-studio' },
            { label: 'Forms + submissions', href: '/docs/capabilities/forms' },
            { label: 'White-label admin', href: '/docs/capabilities/white-label' },
        ],
    },
    {
        title: 'Operations',
        description: 'Backups, deployments, monitoring, security, scaling.',
        icon: '⚙️',
        color: 'var(--pastel-butter)',
        links: [
            { label: 'Backup + restore', href: '/docs/ops/backup' },
            { label: 'Deployment recipes', href: '/docs/ops/deploy' },
            { label: 'Monitoring + alerts', href: '/docs/ops/monitoring' },
            { label: 'Scaling beyond a single node', href: '/docs/ops/scale' },
        ],
    },
    {
        title: 'How-to recipes',
        description: 'Cookbook-style answers to specific questions.',
        icon: '📖',
        color: 'var(--pastel-coral)',
        links: [
            { label: 'Migrate from WordPress', href: '/docs/recipes/migrate-wp' },
            { label: 'Run a multi-language site', href: '/docs/recipes/i18n' },
            { label: 'Embed Mero in another app', href: '/docs/recipes/embed' },
            { label: 'Run on Kubernetes', href: '/docs/recipes/k8s' },
        ],
    },
];

/**
 * Documentation index — colour-coded section cards, each with a list
 * of the most-visited articles inside. Real docs live elsewhere; this
 * page is the entry point that helps people self-route.
 */
export default function DocsPage() {
    return (
        <Reveal>
            <main>
                <PageHero
                    eyebrow="Documentation"
                    title={
                        <>
                            Read it once.{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                Never again.
                            </span>
                        </>
                    }
                    subtitle="Install, configure, build, and operate Mero CMS. Documentation written by the people who shipped the feature, kept short on purpose."
                />

                <section className="section" style={{ paddingTop: 32 }}>
                    <div className="container">
                        <div className="docs-grid reveal-stagger">
                            {SECTIONS.map(section => (
                                <div
                                    key={section.title}
                                    style={{
                                        background: '#fff',
                                        border: '1px solid var(--paper-3)',
                                        borderRadius: 'var(--r-lg)',
                                        padding: 28,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 16,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                background: section.color,
                                                display: 'grid',
                                                placeItems: 'center',
                                                fontSize: 22,
                                            }}
                                        >
                                            {section.icon}
                                        </div>
                                        <h3 className="display" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
                                            {section.title}
                                        </h3>
                                    </div>
                                    <p style={{ color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.55 }}>{section.description}</p>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {section.links.map(link => (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    style={{ color: 'var(--ink-2)', fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}
                                                >
                                                    <span>{link.label}</span>
                                                    <span style={{ color: 'var(--brand)' }}>→</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <style>{`
                            .docs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                            @media (max-width: 1100px) { .docs-grid { grid-template-columns: repeat(2, 1fr); } }
                            @media (max-width: 700px)  { .docs-grid { grid-template-columns: 1fr; } }
                        `}</style>

                        <p style={{ color: 'var(--ink-3)', fontSize: 14, textAlign: 'center', marginTop: 48 }}>
                            Can&apos;t find what you&apos;re looking for?{' '}
                            <a href="/contact" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                                Tell us — we&apos;ll write it. →
                            </a>
                        </p>
                    </div>
                </section>
            </main>
        </Reveal>
    );
}
