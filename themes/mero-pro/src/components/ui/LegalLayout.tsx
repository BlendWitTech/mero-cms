import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Shared layout for terms / privacy / security / dpa pages. Each is a
 * long-form prose document with a sticky-ish "last updated" header and
 * a related-pages list at the bottom. Renders inside a 720px reading
 * column so paragraphs stay short.
 *
 * Pages pass their own children — most will be a series of <h2>/<p>
 * blocks describing the policy. The default styles here cover prose
 * markup well enough that pages don't need their own CSS.
 */
interface Props {
    title: string;
    eyebrow?: string;
    lastUpdated: string;
    children: ReactNode;
}

const LEGAL_LINKS = [
    { label: 'Terms', href: '/legal/terms' },
    { label: 'Privacy', href: '/legal/privacy' },
    { label: 'Security', href: '/legal/security' },
    { label: 'DPA', href: '/legal/dpa' },
];

export default function LegalLayout({ title, eyebrow = 'Legal', lastUpdated, children }: Props) {
    return (
        <main
            style={{
                maxWidth: 760,
                margin: '0 auto',
                padding: '160px 24px 80px',
            }}
            className="legal-prose"
        >
            <p className="section-eyebrow" style={{ marginBottom: 12 }}>
                {eyebrow}
            </p>
            <h1
                className="display"
                style={{
                    fontSize: 'clamp(36px, 5vw, 56px)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.025em',
                    marginBottom: 16,
                }}
            >
                {title}
            </h1>
            <p
                style={{
                    color: 'var(--ink-4)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    marginBottom: 32,
                    paddingBottom: 24,
                    borderBottom: '1px solid var(--paper-3)',
                }}
            >
                Last updated · {lastUpdated}
            </p>

            <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>{children}</div>

            <div
                style={{
                    marginTop: 64,
                    paddingTop: 24,
                    borderTop: '1px solid var(--paper-3)',
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                    fontSize: 14,
                }}
            >
                <span style={{ color: 'var(--ink-3)' }}>Other policies:</span>
                {LEGAL_LINKS.map(l => (
                    <Link
                        key={l.href}
                        href={l.href}
                        style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                    >
                        {l.label}
                    </Link>
                ))}
            </div>

            <style>{`
                .legal-prose h2 {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-weight: 800;
                    font-size: 22px;
                    margin: 40px 0 12px;
                    letter-spacing: -0.015em;
                    color: var(--ink);
                }
                .legal-prose h3 {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    font-weight: 700;
                    font-size: 17px;
                    margin: 24px 0 8px;
                    color: var(--ink);
                }
                .legal-prose p { margin-bottom: 16px; }
                .legal-prose ul, .legal-prose ol { margin: 0 0 16px 24px; padding: 0; }
                .legal-prose li { margin-bottom: 6px; }
                .legal-prose a { color: var(--brand); text-decoration: underline; }
                .legal-prose strong { color: var(--ink); }
            `}</style>
        </main>
    );
}
