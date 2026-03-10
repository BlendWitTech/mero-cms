import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts, getImageUrl, formatDate } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Expert insights on land investment, property buying, and real estate in Nepal.',
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const { data: posts, total } = await getPosts({ page, limit: 9 });
  const totalPages = Math.ceil(total / 9);

  return (
    <>
      {/* Header */}
      <div style={{ background: '#1B4332', padding: '4rem 0 3rem' }}>
        <div className="container">
          <div style={{ color: '#D4A017', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Knowledge Hub</div>
          <h1 style={{ color: '#FFFFFF', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Our Blog
          </h1>
          <p style={{ color: '#B7D9C8', maxWidth: '480px' }}>
            Expert insights, guides, and market updates on land investment in Nepal.
          </p>
        </div>
      </div>

      <section style={{ padding: '3rem 0 5rem', background: '#F9F6F0' }}>
        <div className="container">
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B7280' }}>
              <p>No articles published yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
                {posts.map((post) => {
                  const imgUrl = getImageUrl(post.featuredImageUrl);
                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      style={{ textDecoration: 'none', display: 'block', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <div style={{ position: 'relative', height: '180px', background: '#1B4332' }}>
                        {imgUrl ? (
                          <Image src={imgUrl} alt={post.title} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="40" height="40" fill="none" stroke="#52B788" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                          </div>
                        )}
                        {post.featured && (
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#D4A017', color: '#1B4332', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            Featured
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '1.25rem' }}>
                        {post.categories && post.categories.length > 0 && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#D1FAE5', padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.75rem', display: 'inline-block' }}>
                            {post.categories[0].name}
                          </span>
                        )}
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.5rem', lineHeight: 1.4 }}>{post.title}</h2>
                        {post.excerpt && (
                          <p style={{ fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.excerpt}
                          </p>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                          {post.author && <span>{post.author.name}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {page > 1 && (
                    <Link href={`/blog?page=${page - 1}`} style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', textDecoration: 'none', color: '#4B5563', fontSize: '0.875rem' }}>← Prev</Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link key={p} href={`/blog?page=${p}`} style={{ padding: '0.5rem 0.875rem', background: p === page ? '#1B4332' : '#FFFFFF', border: '1px solid', borderColor: p === page ? '#1B4332' : '#E5E7EB', borderRadius: '6px', textDecoration: 'none', color: p === page ? '#FFFFFF' : '#4B5563', fontSize: '0.875rem', fontWeight: p === page ? 700 : 400 }}>
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link href={`/blog?page=${page + 1}`} style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', textDecoration: 'none', color: '#4B5563', fontSize: '0.875rem' }}>Next →</Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
