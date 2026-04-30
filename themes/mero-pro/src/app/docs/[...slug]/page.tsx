import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/ui/Reveal';
import { getDocArticle, listDocArticles } from '@/lib/docs-content';

export const revalidate = 600;

export async function generateStaticParams() {
    return listDocArticles().map(a => ({ slug: a.slug.split('/') }));
}

export async function generateMetadata(props: {
    params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
    const { slug } = await props.params;
    const path = slug.join('/');
    const article = getDocArticle(path);
    if (!article) return { title: 'Doc not found' };
    return { title: `${article.title} · Docs`, description: article.description };
}

/**
 * Catch-all docs route — handles every /docs/* path the docs index
 * links to. Looks up content by slug-path in the docs-content lib;
 * renders body as trusted HTML (the data is in-tree, not user-provided).
 *
 * Layout: prev/next-style breadcrumb at top, h1 + section/description,
 * then the body in a 720px reading column. Sidebar nav back to /docs.
 */
export default async function DocPage(props: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await props.params;
    const path = slug.join('/');
    const article = getDocArticle(path);
    if (!article) notFound();

    return (
        <Reveal>
            <main
                style={{
                    maxWidth: 1080,
                    margin: '0 auto',
                    padding: '160px 24px 80px',
                }}
            >
                <div className="docs-layout">
                    <aside>
                        <Link
                            href="/docs"
                            style={{ color: 'var(--ink-3)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                        >
                            ← All docs
                        </Link>
                        <p
                            style={{
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--brand)',
                                marginTop: 24,
                            }}
                        >
                            {article.section}
                        </p>
                    </aside>

                    <article className="docs-prose">
                        <h1
                            className="display"
                            style={{
                                fontSize: 'clamp(32px, 4.5vw, 52px)',
                                lineHeight: 1.05,
                                letterSpacing: '-0.025em',
                                marginBottom: 12,
                            }}
                        >
                            {article.title}
                        </h1>
                        <p
                            style={{
                                fontSize: 17,
                                color: 'var(--ink-3)',
                                lineHeight: 1.55,
                                marginBottom: 32,
                                paddingBottom: 24,
                                borderBottom: '1px solid var(--paper-3)',
                            }}
                        >
                            {article.description}
                        </p>

                        <div
                            dangerouslySetInnerHTML={{ __html: article.body }}
                            style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}
                        />

                        <div
                            style={{
                                marginTop: 64,
                                paddingTop: 24,
                                borderTop: '1px solid var(--paper-3)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                                fontSize: 14,
                            }}
                        >
                            <Link href="/docs" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                                ← Back to docs index
                            </Link>
                            <a
                                href={`https://github.com/merocms/docs/edit/main/${article.slug}.md`}
                                style={{ color: 'var(--ink-3)', textDecoration: 'none' }}
                            >
                                Edit on GitHub →
                            </a>
                        </div>
                    </article>
                </div>

                <style>{`
                    .docs-layout {
                        display: grid;
                        grid-template-columns: 200px 1fr;
                        gap: 48px;
                        align-items: start;
                    }
                    .docs-prose h2 {
                        font-family: 'Bricolage Grotesque', sans-serif;
                        font-weight: 800;
                        font-size: 24px;
                        margin: 32px 0 12px;
                        letter-spacing: -0.015em;
                        color: var(--ink);
                    }
                    .docs-prose h3 {
                        font-family: 'Bricolage Grotesque', sans-serif;
                        font-weight: 700;
                        font-size: 18px;
                        margin: 24px 0 8px;
                        color: var(--ink);
                    }
                    .docs-prose p { margin-bottom: 16px; }
                    .docs-prose ul, .docs-prose ol { margin: 0 0 16px 24px; padding: 0; }
                    .docs-prose li { margin-bottom: 6px; }
                    .docs-prose a { color: var(--brand); text-decoration: underline; }
                    .docs-prose strong { color: var(--ink); }
                    .docs-prose code {
                        background: var(--paper-2);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 0.92em;
                        font-family: monospace;
                    }
                    .docs-prose pre {
                        background: var(--ink);
                        color: #f5f5f7;
                        padding: 18px 20px;
                        border-radius: 12px;
                        overflow-x: auto;
                        margin: 24px 0;
                        font-size: 13px;
                    }
                    .docs-prose pre code {
                        background: transparent;
                        padding: 0;
                        color: inherit;
                    }
                    @media (max-width: 900px) {
                        .docs-layout { grid-template-columns: 1fr; gap: 24px; }
                    }
                `}</style>
            </main>
        </Reveal>
    );
}
