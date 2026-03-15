'use client';
import Link from 'next/link';

import Image from 'next/image';
import type { Post } from '@/lib/cms';
import { getImageUrl, formatDate } from '@/lib/cms';

interface Props {
  posts: Post[];
  secData?: Record<string, any>;
}

export default function BlogPreview({ posts, secData = {} }: Props) {
  if (posts.length === 0) return null;

  return (
    <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ color: '#CC1414', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              {secData.label || 'Latest Articles'}
            </div>
            <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>{secData.title || 'From Our Blog'}</h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>{secData.subtitle || 'Expert insights on land investment and property in Nepal'}</p>
          </div>
          <Link href="/blog" className="btn-green" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
            {secData.viewAllText || 'All Articles →'}
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.75rem' }}>
          {posts.slice(0, 3).map((post) => {
            const imgUrl = getImageUrl(post.featuredImageUrl);
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'block', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '180px', background: '#F3F4F6' }}>
                  {imgUrl ? (
                    <Image src={imgUrl} alt={post.title} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #CC1414, #A01010)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="40" height="40" fill="none" stroke="#E82020" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem' }}>
                  {post.categories && post.categories.length > 0 && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#CC1414', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FEE2E2', padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.75rem', display: 'inline-block' }}>
                      {post.categories[0].name}
                    </span>
                  )}
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.5rem', lineHeight: 1.4 }}>{post.title}</h3>
                  {post.excerpt && (
                    <p style={{ fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    <span style={{ color: '#CC1414', fontWeight: 600 }}>Read more →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
