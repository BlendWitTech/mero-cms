import type { Metadata } from 'next';
import { getPublishedPosts, cmsImageUrl } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest articles and updates.',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Number(searchParams?.page) || 1;
  const { data: posts, total, limit } = await getPublishedPosts({ page, limit: 9 }, 60).catch(
    () => ({ data: [], total: 0, page: 1, limit: 9 })
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Blog</h1>

      {posts.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No posts published yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {posts.map(post => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                display: 'block',
                background: '#fff',
                transition: 'box-shadow 0.2s',
              }}
            >
              {post.featuredImage && (
                <img
                  src={cmsImageUrl(post.featuredImage)!}
                  alt={post.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: '1.25rem' }}>
                {post.categories.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    {post.categories.map(c => (
                      <span
                        key={c.id}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#2563eb',
                          marginRight: '0.5rem',
                        }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {post.excerpt}
                  </p>
                )}
                {post.publishedAt && (
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '3rem', justifyContent: 'center' }}>
          {page > 1 && (
            <a
              href={`/blog?page=${page - 1}`}
              style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
            >
              ← Previous
            </a>
          )}
          <span style={{ padding: '0.5rem 1rem', color: '#6b7280' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/blog?page=${page + 1}`}
              style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
