import type { Metadata } from 'next';
import { getPublishedPosts, cmsImageUrl, formatDate } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest articles, tutorials and product updates from Mero CMS.',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const { data: posts, total, limit } = await getPublishedPosts({ page, limit: 9 }, 60).catch(
    () => ({ data: [], total: 0, page: 1, limit: 9 })
  );

  const totalPages = Math.ceil(total / (limit || 9));

  return (
    <div style={{ padding: '3rem 0 4rem' }}>
      <div className="container">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Blog</h1>
        <p style={{ color: '#6b7280', marginBottom: '2.5rem' }}>
          Tips, tutorials and product updates.
        </p>

        {!posts || posts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 0',
              color: '#6b7280',
            }}
          >
            <p style={{ fontSize: '1.1rem' }}>No posts published yet.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Check back soon!</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.875rem',
                  overflow: 'hidden',
                  display: 'block',
                  background: '#fff',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {(post.featuredImageUrl || post.featuredImage) && (
                  <img
                    src={
                      cmsImageUrl(post.featuredImageUrl || post.featuredImage) ??
                      (post.featuredImageUrl || post.featuredImage)!
                    }
                    alt={post.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ padding: '1.25rem' }}>
                  {post.categories && post.categories.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      {post.categories.map((c) => (
                        <span
                          key={c.slug}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#4f46e5',
                            marginRight: '0.5rem',
                          }}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        marginBottom: '0.75rem',
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  {post.publishedAt && (
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '3rem',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {page > 1 && (
              <a
                href={`/blog?page=${page - 1}`}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                ← Previous
              </a>
            )}
            <span style={{ padding: '0.5rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`/blog?page=${page + 1}`}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Next →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
