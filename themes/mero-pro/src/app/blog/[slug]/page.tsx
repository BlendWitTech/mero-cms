import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import FinalCTA from '@/components/sections/FinalCTA';
import { getPost, mediaUrl } from '@/lib/api';

export const revalidate = 120;

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) return { title: 'Post not found' };
    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.publishedAt,
        },
    };
}

/**
 * Single blog post — long-form layout with categories/tags, title, meta
 * strip, optional cover image, then the post body. Body comes from the
 * backend's rich-text editor (sanitised server-side); rendered via
 * dangerouslySetInnerHTML so the admin's editor controls (links, lists,
 * blockquotes, code blocks) render correctly.
 */
export default async function BlogPostPage({ params }: RouteProps) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        if (!process.env.NEXT_PUBLIC_API_URL) return <PlaceholderPost slug={slug} />;
        notFound();
    }

    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '';

    const wordCount = post.content?.split(/\s+/).filter(Boolean).length || 0;
    const readingMinutes = Math.max(1, Math.round(wordCount / 225));

    const cover = post.featuredImageUrl || post.coverImage;

    return (
        <Reveal>
            <main>
                <article style={{ maxWidth: 760, margin: '0 auto', padding: '160px 24px 80px' }}>
                    {post.categories?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                            {post.categories.map(c => (
                                <span
                                    key={c.slug}
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: 'var(--brand)',
                                        background: 'rgba(203,23,43,0.08)',
                                        padding: '4px 10px',
                                        borderRadius: 100,
                                    }}
                                >
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1
                        className="display"
                        style={{
                            fontSize: 'clamp(36px, 5vw, 56px)',
                            lineHeight: 1.05,
                            letterSpacing: '-0.025em',
                            marginBottom: 16,
                        }}
                    >
                        {post.title}
                    </h1>

                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            color: 'var(--ink-3)',
                            fontSize: 14,
                            marginBottom: 32,
                            paddingBottom: 24,
                            borderBottom: '1px solid var(--paper-3)',
                        }}
                    >
                        <span>{post.author?.name || 'Mero CMS'}</span>
                        {date && <><span>·</span><span>{date}</span></>}
                        <span>·</span>
                        <span>{readingMinutes} min read</span>
                    </div>

                    {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={mediaUrl(cover)}
                            alt=""
                            style={{
                                width: '100%',
                                borderRadius: 'var(--r-md)',
                                marginBottom: 32,
                                aspectRatio: '16/9',
                                objectFit: 'cover',
                            }}
                        />
                    )}

                    {post.content ? (
                        <div
                            className="post-body"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                            style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2)' }}
                        />
                    ) : (
                        post.excerpt && (
                            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink-3)' }}>{post.excerpt}</p>
                        )
                    )}

                    <div
                        style={{
                            marginTop: 64,
                            paddingTop: 24,
                            borderTop: '1px solid var(--paper-3)',
                        }}
                    >
                        <Link
                            href="/blog"
                            style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                        >
                            ← Back to all posts
                        </Link>
                    </div>
                </article>

                <FinalCTA />

                <style>{`
                    .post-body h2 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 28px; margin: 48px 0 16px; letter-spacing: -0.02em; color: var(--ink); }
                    .post-body h3 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 22px; margin: 32px 0 12px; color: var(--ink); }
                    .post-body p { margin-bottom: 20px; }
                    .post-body a { color: var(--brand); text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 3px; }
                    .post-body ul, .post-body ol { margin: 0 0 24px 24px; padding: 0; }
                    .post-body li { margin-bottom: 8px; }
                    .post-body blockquote { border-left: 3px solid var(--brand); padding: 8px 20px; margin: 24px 0; color: var(--ink-2); font-style: italic; }
                    .post-body code { background: var(--paper-2); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: 'JetBrains Mono', monospace; }
                    .post-body pre { background: var(--ink); color: #f5f5f7; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 24px 0; }
                    .post-body pre code { background: transparent; padding: 0; color: inherit; }
                `}</style>
            </main>
        </Reveal>
    );
}

function PlaceholderPost({ slug }: { slug: string }) {
    return (
        <main style={{ maxWidth: 760, margin: '0 auto', padding: '160px 24px' }}>
            <p className="section-eyebrow">Dev mode · placeholder</p>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', marginBottom: 16 }}>
                {slug}
            </h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 17, lineHeight: 1.7 }}>
                The backend isn&apos;t connected, so this slug renders as a placeholder. When you point{' '}
                <code>NEXT_PUBLIC_API_URL</code> at a running Mero CMS backend, this page fetches the real post.
            </p>
        </main>
    );
}
