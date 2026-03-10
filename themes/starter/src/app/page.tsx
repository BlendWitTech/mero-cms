import type { Metadata } from 'next';
import { getSiteData, getPublishedPosts, cmsImageUrl } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData(3600).catch(() => ({ settings: { siteTitle: 'Home', tagline: '' } as any }));
  return {
    title: settings.siteTitle,
    description: settings.tagline,
  };
}

export default async function HomePage() {
  const [siteData, { data: recentPosts }] = await Promise.all([
    getSiteData(60),
    getPublishedPosts({ limit: 3 }, 60).catch(() => ({ data: [], total: 0, page: 1, limit: 3 })),
  ]);

  const { settings, services, testimonials, team } = siteData;

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '5rem 0', textAlign: 'center', background: '#f8fafc' }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
            {settings.siteTitle}
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto 2rem' }}>
            {settings.tagline}
          </p>
          <a
            href="/blog"
            style={{
              display: 'inline-block',
              background: '#2563eb',
              color: '#fff',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
            }}
          >
            Read the Blog
          </a>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section style={{ padding: '4rem 0' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
              Our Services
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {services.map(service => (
                <div
                  key={service.id}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}
                >
                  {service.icon && <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{service.icon}</div>}
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{service.title}</h3>
                  {service.description && (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section style={{ padding: '4rem 0', background: '#f8fafc' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
              Latest Posts
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {recentPosts.map(post => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', display: 'block', background: '#fff' }}
                >
                  {post.featuredImage && (
                    <img
                      src={cmsImageUrl(post.featuredImage)!}
                      alt={post.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{post.title}</h3>
                    {post.excerpt && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{post.excerpt}</p>}
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <a href="/blog" style={{ color: '#2563eb', fontWeight: 600 }}>View all posts →</a>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section style={{ padding: '4rem 0' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
              What Clients Say
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {testimonials.map(t => (
                <div
                  key={t.id}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', background: '#fff' }}
                >
                  <p style={{ color: '#374151', fontStyle: 'italic', marginBottom: '1rem' }}>"{t.content}"</p>
                  <div style={{ fontWeight: 700 }}>{t.clientName}</div>
                  {(t.clientRole || t.clientCompany) && (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      {t.clientRole}{t.clientRole && t.clientCompany && ', '}{t.clientCompany}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section style={{ padding: '4rem 0', background: '#f8fafc' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
              Meet the Team
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
              {team.map(member => (
                <div key={member.id}>
                  {member.photo ? (
                    <img
                      src={cmsImageUrl(member.photo)!}
                      alt={member.name}
                      style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem' }}
                    />
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 0.75rem' }} />
                  )}
                  <div style={{ fontWeight: 700 }}>{member.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{member.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
