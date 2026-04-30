import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/ui/Reveal';
import Button from '@/components/ui/Button';
import { getTheme, listThemes } from '@/lib/themes-catalog';

export const revalidate = 600;

export async function generateStaticParams() {
    return listThemes().map(t => ({ slug: t.slug }));
}

export async function generateMetadata(props: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await props.params;
    const theme = getTheme(slug);
    if (!theme) return { title: 'Theme not found' };
    return {
        title: `${theme.name} · Themes`,
        description: theme.description,
    };
}

/**
 * Theme detail page — preview block, install instructions, feature
 * list, section list, "best for" callout, and a CTA back to the
 * gallery + an install command.
 */
export default async function ThemeDetailPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const theme = getTheme(slug);
    if (!theme) notFound();

    return (
        <Reveal>
            <main>
                {/* Pastel hero matching the gallery card colour */}
                <section
                    style={{
                        padding: '160px 0 64px',
                        background: `linear-gradient(180deg, ${theme.color} 0%, var(--paper) 100%)`,
                    }}
                >
                    <div className="container" style={{ maxWidth: 880 }}>
                        <Link
                            href="/themes"
                            style={{ color: 'var(--ink-3)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                        >
                            ← All themes
                        </Link>
                        <p
                            style={{
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--brand)',
                                marginTop: 24,
                                marginBottom: 12,
                            }}
                        >
                            {theme.tagline}
                        </p>
                        <h1
                            className="display"
                            style={{
                                fontSize: 'clamp(40px, 6vw, 76px)',
                                lineHeight: 1.05,
                                letterSpacing: '-0.025em',
                                marginBottom: 16,
                            }}
                        >
                            {theme.name}
                        </h1>
                        <p style={{ color: 'var(--ink-2)', fontSize: 18, lineHeight: 1.55, maxWidth: '60ch' }}>
                            {theme.description}
                        </p>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 32 }}>
                            <Button href={`/signup?theme=${theme.slug}`} variant="brand" size="lg">
                                Install this theme →
                            </Button>
                            <Button href={`https://${theme.repo}`} variant="light" size="lg">
                                View source on GitHub
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Body — install + features + sections */}
                <section className="section" style={{ paddingTop: 32 }}>
                    <div className="container" style={{ maxWidth: 1000 }}>
                        <div className="theme-grid">
                            <article style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                                <div>
                                    <h2 className="display" style={{ fontSize: 26, marginBottom: 12 }}>
                                        Install
                                    </h2>
                                    <p style={{ color: 'var(--ink-3)', fontSize: 15, marginBottom: 16, lineHeight: 1.6 }}>
                                        From your Mero CMS admin: open Settings → Themes → Install from gallery, then pick{' '}
                                        <strong style={{ color: 'var(--ink-2)' }}>{theme.name}</strong>. Or via the CLI:
                                    </p>
                                    <pre
                                        style={{
                                            background: 'var(--ink)',
                                            color: '#f5f5f7',
                                            padding: 20,
                                            borderRadius: 12,
                                            overflowX: 'auto',
                                            fontSize: 13,
                                            fontFamily: 'monospace',
                                            margin: 0,
                                        }}
                                    >
                                        <code>{`mero themes install ${theme.slug}\nmero themes activate ${theme.slug}`}</code>
                                    </pre>
                                </div>

                                <div>
                                    <h2 className="display" style={{ fontSize: 26, marginBottom: 12 }}>
                                        What you get
                                    </h2>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {theme.features.map((f, i) => (
                                            <li
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    gap: 12,
                                                    fontSize: 15,
                                                    lineHeight: 1.55,
                                                    color: 'var(--ink-2)',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 22,
                                                        height: 22,
                                                        borderRadius: '50%',
                                                        background: 'var(--brand)',
                                                        color: '#fff',
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        fontWeight: 800,
                                                        fontSize: 12,
                                                        flexShrink: 0,
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    ✓
                                                </span>
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h2 className="display" style={{ fontSize: 26, marginBottom: 12 }}>
                                        Sections included
                                    </h2>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {theme.sectionList.map(s => (
                                            <li
                                                key={s.name}
                                                style={{
                                                    background: '#fff',
                                                    border: '1px solid var(--paper-3)',
                                                    borderRadius: 'var(--r-md)',
                                                    padding: '14px 18px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'baseline',
                                                        gap: 12,
                                                    }}
                                                >
                                                    <strong style={{ fontSize: 15 }}>{s.name}</strong>
                                                    <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{s.description}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>

                            <aside>
                                <div
                                    style={{
                                        background: '#fff',
                                        border: '1px solid var(--paper-3)',
                                        borderRadius: 'var(--r-md)',
                                        padding: 24,
                                        position: 'sticky',
                                        top: 96,
                                    }}
                                >
                                    <h4
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color: 'var(--ink-4)',
                                            marginBottom: 14,
                                        }}
                                    >
                                        Best for
                                    </h4>
                                    <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 24 }}>
                                        {theme.bestFor}
                                    </p>

                                    <h4
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color: 'var(--ink-4)',
                                            marginBottom: 14,
                                        }}
                                    >
                                        Quick facts
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: 'var(--ink-3)' }}>Sections</span>
                                            <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{theme.sections}</span>
                                        </li>
                                        <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: 'var(--ink-3)' }}>License</span>
                                            <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>MIT</span>
                                        </li>
                                        <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: 'var(--ink-3)' }}>Repo</span>
                                            <a
                                                href={`https://${theme.repo}`}
                                                style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                                            >
                                                GitHub →
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </aside>
                        </div>

                        <style>{`
                            .theme-grid { display: grid; grid-template-columns: 1fr 280px; gap: 64px; align-items: start; }
                            @media (max-width: 900px) {
                                .theme-grid { grid-template-columns: 1fr; gap: 32px; }
                            }
                        `}</style>
                    </div>
                </section>
            </main>
        </Reveal>
    );
}
