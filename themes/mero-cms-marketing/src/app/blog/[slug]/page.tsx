import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, cmsImageUrl } from '@/lib/cms';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: post.featuredImage ? { images: [{ url: cmsImageUrl(post.featuredImage)! }] } : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, 60).catch(() => null);
  if (!post || post.status !== 'published') notFound();

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ padding: '4rem 0 3rem', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          {post.categories[0] && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '1rem' }}>
              {post.categories[0].name}
            </span>
          )}
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--color-text)', marginBottom: '1.25rem' }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p style={{ fontSize: '1.125rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {post.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                {post.author.name[0]}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{post.author.name}</span>
            </div>
            {post.publishedAt && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-2)' }}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            {post.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {post.tags.map(t => (
                  <span key={t.id} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '9999px' }}>
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '760px', paddingTop: '3rem' }}>
        {/* Featured image */}
        {post.featuredImage && (
          <img
            src={cmsImageUrl(post.featuredImage)!}
            alt={post.title}
            style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem', maxHeight: '460px', objectFit: 'cover' }}
          />
        )}

        {/* Content */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Back */}
        <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
          <a href="/blog" style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.875rem' }}>← Back to Blog</a>
        </div>
      </div>
    </div>
  );
}
