import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, getPosts, getImageUrl, formatDate } from '@/lib/cms';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, { data: related }] = await Promise.all([
    getPostBySlug(slug),
    getPosts({ limit: 3 }),
  ]);

  if (!post) notFound();

  const imgUrl = getImageUrl(post.featuredImageUrl);
  const relatedPosts = related.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <div style={{ background: '#1E1E1E', padding: '4rem 0 3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#CC1414' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#A0A0A0', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/blog" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Blog</Link>
            <span>/</span>
            <span style={{ color: '#FFFFFF' }}>{post.title}</span>
          </div>

          {post.categories && post.categories.length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', background: '#CC1414', padding: '0.2rem 0.7rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'inline-block' }}>
              {post.categories[0].name}
            </span>
          )}

          <h1 style={{ color: '#FFFFFF', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.25, maxWidth: '800px' }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#A0A0A0' }}>
            {post.author && <span>By {post.author.name}</span>}
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>
        </div>
      </div>

      <section style={{ padding: '3rem 0 5rem', background: '#F4F4F4' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr min(680px, 100%) 1fr', gap: 0 }}>
            <div style={{ gridColumn: '2' }}>
              {/* Featured image */}
              {imgUrl && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', aspectRatio: '16/9', position: 'relative' }}>
                  <Image src={imgUrl} alt={post.title} fill style={{ objectFit: 'cover' }} priority />
                </div>
              )}

              {/* Article content */}
              <div
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: post.content
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                    .replace(/^# (.*)/gm, '<h1>$1</h1>')
                    .replace(/^## (.*)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*)/gm, '<h3>$3</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- (.*)/gm, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'),
                }}
              />

              {/* Tags */}
              {post.categories && post.categories.length > 0 && (
                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {post.categories.map((cat) => (
                    <span key={cat.slug} style={{ background: '#FEE2E2', color: '#065F46', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '9999px' }}>
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div style={{ marginTop: '3rem', background: '#CC1414', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ color: '#CC1414', fontWeight: 700, marginBottom: '0.5rem' }}>Looking for Land in Kathmandu Valley?</h3>
                <p style={{ color: '#A0A0A0', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Browse our verified plots or speak with one of our property consultants today.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link href="/plots" className="btn-primary">Browse Plots</Link>
                  <Link href="/contact" className="btn-outline">Get Free Consultation</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section style={{ padding: '4rem 0', background: '#FFFFFF' }}>
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>More Articles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {relatedPosts.map((p) => {
                const pImgUrl = getImageUrl(p.featuredImageUrl);
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: 'none', display: 'block', background: '#F4F4F4', borderRadius: '10px', overflow: 'hidden', transition: 'transform 0.2s' }}>
                    <div style={{ height: '150px', background: '#CC1414', position: 'relative' }}>
                      {pImgUrl ? (
                        <Image src={pImgUrl} alt={p.title} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #CC1414, #A01010)' }} />
                      )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h4 style={{ fontWeight: 700, color: '#CC1414', fontSize: '0.95rem', marginBottom: '0.35rem', lineHeight: 1.4 }}>{p.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{formatDate(p.publishedAt || p.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
