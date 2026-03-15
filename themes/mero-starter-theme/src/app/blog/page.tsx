import type { Metadata } from 'next';
import { getPublishedPosts, cmsImageUrl } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tutorials, updates, and insights from the Mero CMS team.',
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp?.page) || 1;
  const { posts, pagination } = await getPublishedPosts({ page, limit: 9 }, 60).catch(
    () => ({ posts: [], pagination: { total: 0, page: 1, limit: 9, totalPages: 0 } })
  );
  const { totalPages } = pagination;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Page header */}
      <div style={{ padding: '5rem 0 3rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <span className="section-label">Blog</span>
          <h1 className="section-title">Tutorials & Updates</h1>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Guides, release notes, and best practices for Mero CMS.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '3.5rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>✏</div>
            <p>No posts published yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {posts.map(post => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="post-card"
              >
                {post.featuredImage ? (
                  <img src={cmsImageUrl(post.featuredImage)!} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '140px', background: 'linear-gradient(135deg, var(--color-surface-2), var(--color-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>✏</span>
                  </div>
                )}
                <div style={{ padding: '1.25rem' }}>
                  {post.categories[0] && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                      {post.categories[0].name}
                    </span>
                  )}
                  <h2 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-muted)', lineHeight: 1.65, marginBottom: '0.875rem' }}>
                      {post.excerpt.length > 110 ? post.excerpt.slice(0, 110) + '…' : post.excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-muted-2)' }}>
                    <span>{post.author.name}</span>
                    {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '3.5rem', justifyContent: 'center', alignItems: 'center' }}>
            {page > 1 && (
              <a href={`/blog?page=${page - 1}`} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>← Prev</a>
            )}
            <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
            {page < totalPages && (
              <a href={`/blog?page=${page + 1}`} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>Next →</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
