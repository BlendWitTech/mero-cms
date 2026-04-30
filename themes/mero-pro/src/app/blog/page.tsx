import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import PageHero from '@/components/ui/PageHero';
import { getPosts, mediaUrl, type PostRecord } from '@/lib/api';

export const revalidate = 120;

export const metadata: Metadata = {
    title: 'Blog',
    description:
        'Notes from the Mero CMS team on building product, motion-first design, and shipping content fast.',
};

/**
 * Blog index — lists published posts via /public/posts. Falls back to a
 * small set of placeholder cards when the backend isn't reachable so
 * the page still looks alive in dev.
 */
const PLACEHOLDER_POSTS: PostRecord[] = [
    {
        id: '1',
        slug: 'why-we-built-mero',
        title: 'Why we built Mero CMS',
        excerpt:
            "Three years of using other people's CMSes taught us exactly what we wanted ours to be. Here's the thesis behind v1.",
        content: '',
        status: 'PUBLISHED',
        featured: true,
        publishedAt: '2026-04-12T00:00:00Z',
        authorId: '1',
        author: { name: 'Saugat Pahari' },
        categories: [{ name: 'Product', slug: 'product' }],
        createdAt: '2026-04-12T00:00:00Z',
        updatedAt: '2026-04-12T00:00:00Z',
    },
    {
        id: '2',
        slug: 'motion-as-a-feature',
        title: 'Motion is a feature, not a polish layer',
        excerpt:
            "Most marketing sites bolt animation on at the end. We made it the spine — here's how the section variants stay scroll-perfect across themes.",
        content: '',
        status: 'PUBLISHED',
        featured: false,
        publishedAt: '2026-04-04T00:00:00Z',
        authorId: '2',
        author: { name: 'Mira Calder' },
        categories: [{ name: 'Design', slug: 'design' }],
        createdAt: '2026-04-04T00:00:00Z',
        updatedAt: '2026-04-04T00:00:00Z',
    },
    {
        id: '3',
        slug: 'eight-tier-pricing',
        title: 'Eight tiers, one matrix: how we keep pricing logic in code',
        excerpt:
            'Why a capability matrix beats per-feature flags, and how Mero CMS lets you swap a tier in production without a redeploy.',
        content: '',
        status: 'PUBLISHED',
        featured: false,
        publishedAt: '2026-03-19T00:00:00Z',
        authorId: '3',
        author: { name: 'Raj Joshi' },
        categories: [{ name: 'Engineering', slug: 'engineering' }],
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
    },
];

export default async function BlogIndex() {
    const { data: posts } = await getPosts(1, 12);
    const list = posts.length ? posts : PLACEHOLDER_POSTS;

    return (
        <Reveal>
            <main>
                <PageHero
                    eyebrow="Blog"
                    title={
                        <>
                            Notes from{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                the team.
                            </span>
                        </>
                    }
                    subtitle="Product decisions, motion-first design, and the occasional postmortem."
                />

                <section className="section" style={{ paddingTop: 32 }}>
                    <div className="container">
                        <div className="blog-grid reveal-stagger">
                            {list.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>

                        <style>{`
                            .blog-grid {
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                gap: 24px;
                            }
                            @media (max-width: 900px) {
                                .blog-grid { grid-template-columns: 1fr; }
                            }
                        `}</style>
                    </div>
                </section>
            </main>
        </Reveal>
    );
}

function PostCard({ post }: { post: PostRecord }) {
    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '';

    // Estimate reading time from content length (rough — ~225 words/min).
    const wordCount = post.content?.split(/\s+/).filter(Boolean).length || 0;
    const readingMinutes = Math.max(1, Math.round(wordCount / 225));

    const cover = post.featuredImageUrl || post.coverImage;

    return (
        <Link
            href={`/blog/${post.slug}`}
            style={{
                background: '#fff',
                border: '1px solid var(--paper-3)',
                borderRadius: 'var(--r-lg)',
                padding: 24,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'transform .2s ease, box-shadow .2s ease',
            }}
            className="blog-card"
        >
            <div
                style={{
                    aspectRatio: '16/10',
                    borderRadius: 16,
                    background: cover
                        ? `url(${mediaUrl(cover)}) center/cover`
                        : 'linear-gradient(135deg, var(--pastel-coral), var(--pastel-pink))',
                    marginBottom: 8,
                }}
                aria-hidden="true"
            />

            {post.categories?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {post.categories.map(c => (
                        <span
                            key={c.slug}
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: 'var(--brand)',
                                background: 'rgba(203,23,43,0.08)',
                                padding: '3px 8px',
                                borderRadius: 100,
                            }}
                        >
                            {c.name}
                        </span>
                    ))}
                </div>
            )}

            <h3 className="display" style={{ fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {post.title}
            </h3>
            {post.excerpt && (
                <p style={{ color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.55, flex: 1 }}>{post.excerpt}</p>
            )}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: 'var(--ink-4)',
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: '1px solid var(--paper-3)',
                }}
            >
                <span>{post.author?.name || 'Mero CMS'}</span>
                <span>
                    {date} · {readingMinutes} min
                </span>
            </div>
        </Link>
    );
}
