import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, cmsImageUrl } from '@/lib/cms';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: post.featuredImage
      ? { images: [{ url: cmsImageUrl(post.featuredImage)! }] }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug, 60).catch(() => null);
  if (!post || post.status !== 'published') notFound();

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
      {/* Back link */}
      <a href="/blog" style={{ color: '#6b7280', fontSize: '0.875rem' }}>← Back to Blog</a>

      {/* Categories */}
      {post.categories.length > 0 && (
        <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
          {post.categories.map(c => (
            <span
              key={c.id}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#2563eb',
                marginRight: '0.75rem',
              }}
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
        {post.title}
      </h1>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
        <span>By {post.author.name}</span>
        {post.publishedAt && (
          <span>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag.id} style={{ background: '#f3f4f6', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <img
          src={cmsImageUrl(post.featuredImage)!}
          alt={post.title}
          style={{ width: '100%', borderRadius: '0.75rem', marginBottom: '2rem', maxHeight: '480px', objectFit: 'cover' }}
        />
      )}

      {/* Content */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
}
