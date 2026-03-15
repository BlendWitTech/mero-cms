import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, cmsImageUrl, formatDate } from '@/lib/cms';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph:
      post.featuredImageUrl || post.featuredImage
        ? {
            images: [
              {
                url:
                  cmsImageUrl(post.featuredImageUrl || post.featuredImage) ??
                  (post.featuredImageUrl || post.featuredImage)!,
              },
            ],
          }
        : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, 60).catch(() => null);
  if (!post || post.status === 'draft') notFound();

  const imageUrl =
    cmsImageUrl(post.featuredImageUrl || post.featuredImage) ??
    (post.featuredImageUrl || post.featuredImage) ??
    null;

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Back link */}
        <a
          href="/blog"
          style={{ color: '#6b7280', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
        >
          ← Back to Blog
        </a>

        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            {post.categories.map((c) => (
              <span
                key={c.slug}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#4f46e5',
                  marginRight: '0.75rem',
                }}
              >
                {c.name}
              </span>
            ))}
          </div>
        )}

        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            marginTop: '0.75rem',
          }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {post.author && <span>By {post.author.name}</span>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  style={{
                    background: '#f3f4f6',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                  }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Featured Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={post.title}
            style={{
              width: '100%',
              borderRadius: '0.875rem',
              marginBottom: '2rem',
              maxHeight: '480px',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Content */}
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{
            maxWidth: '100%',
            lineHeight: 1.8,
            fontSize: '1rem',
            color: '#1f2937',
          }}
        />
      </div>
    </div>
  );
}
