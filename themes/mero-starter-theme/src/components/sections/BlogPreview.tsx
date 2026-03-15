'use client';

import { Post, cmsImageUrl } from '@/lib/cms';

interface BlogPreviewProps {
  posts: Post[];
}

export default function BlogPreview({ posts }: BlogPreviewProps) {
  if (posts.length === 0) return null;

  return (
    <section className="section section--alt" id="blog">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="section-label">From the Blog</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Latest Articles</h2>
          </div>
          <a href="/blog" style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
            View all posts →
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {posts.map(post => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{
                display: 'block',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-light)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Thumbnail */}
              {post.featuredImage ? (
                <img
                  src={cmsImageUrl(post.featuredImage)!}
                  alt={post.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '140px',
                  background: 'linear-gradient(135deg, var(--color-surface-2), var(--color-surface))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '2rem', opacity: 0.2 }}>✏</span>
                </div>
              )}

              <div style={{ padding: '1.25rem' }}>
                {/* Category chip */}
                {post.categories.length > 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                    {post.categories[0].name}
                  </span>
                )}

                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                  {post.title}
                </h3>

                {post.excerpt && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-muted)', lineHeight: 1.65, marginBottom: '1rem' }}>
                    {post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + '…' : post.excerpt}
                  </p>
                )}

                {post.publishedAt && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted-2)' }}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
