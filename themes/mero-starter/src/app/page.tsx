import type { Metadata } from 'next';
import { getSiteData, getPublishedPosts, formatDate } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData(3600).catch(() => ({
    settings: { siteTitle: 'Mero CMS', metaDescription: null, tagline: 'The flexible CMS for modern websites' },
  }));
  return {
    title: settings.siteTitle,
    description: settings.metaDescription || settings.tagline,
  };
}

export default async function HomePage() {
  const siteData = await getSiteData(60).catch(() => null);
  const settings = siteData?.settings;
  const services = siteData?.services ?? [];
  const testimonials = siteData?.testimonials ?? [];

  const { data: recentPosts } = await getPublishedPosts({ limit: 3 }, 120).catch(() => ({
    data: [],
  }));

  const primaryColor = settings?.primaryColor || '#4f46e5';
  const heroTitle = settings?.heroTitle || 'Build Powerful Websites — Without the Complexity';
  const heroSubtitle =
    settings?.heroSubtitle ||
    'Mero CMS gives developers and businesses a clean content management system with a beautiful dashboard, theme switching, and a public REST API.';
  const ctaText = settings?.ctaText || 'Get Started Free';
  const ctaUrl = settings?.ctaUrl || 'https://github.com/BlendWitTech/blendwit-cms-saas';

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #7c3aed 100%)`,
          color: '#fff',
          padding: '6rem 0 5rem',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}
          >
            Open Source CMS
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.5rem',
              maxWidth: '820px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {heroTitle}
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: 1.7,
              opacity: 0.9,
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '2.5rem',
            }}
          >
            {heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#fff',
                color: primaryColor,
                fontWeight: 700,
                padding: '0.85rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                display: 'inline-block',
                transition: 'opacity 0.2s',
              }}
            >
              {ctaText}
            </a>
            <a
              href="/dashboard"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 600,
                padding: '0.85rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-block',
                transition: 'background 0.2s',
              }}
            >
              View Demo
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: '#fff', padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Everything You Need
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto' }}>
              Mero CMS ships with all the modules your project needs — no plugins required.
            </p>
          </div>

          {services.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {services.map((service) => (
                <div
                  key={service.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.875rem',
                    padding: '2rem',
                    background: '#fafafa',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                >
                  {service.icon && (
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{service.icon}</div>
                  )}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {service.title}
                  </h3>
                  {service.description && (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {service.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {[
                { icon: '🎨', title: 'Theme Management', desc: 'Upload ZIP themes, switch with one click, and import demo content instantly.' },
                { icon: '✍️', title: 'Blog & Content', desc: 'Rich editor with categories, tags, featured images and per-post SEO meta.' },
                { icon: '🔌', title: 'Public REST API', desc: 'Every piece of content exposed as clean JSON for any frontend framework.' },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.875rem',
                    padding: '2rem',
                    background: '#fafafa',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#f9fafb', padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Up and Running in Minutes
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>Three steps to your new site.</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2rem',
            }}
          >
            {[
              {
                step: '1',
                title: 'Install & Deploy',
                desc: 'Clone the repo, run the setup script, and deploy to Railway, Render or any Node host in minutes.',
              },
              {
                step: '2',
                title: 'Choose a Theme',
                desc: 'Upload a ZIP theme from the dashboard and import demo content with a single click.',
              },
              {
                step: '3',
                title: 'Manage Content',
                desc: 'Add pages, blog posts, services and team members — no developer needed for day-to-day edits.',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1.5rem',
                  background: '#fff',
                  borderRadius: '1rem',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: primaryColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  {item.step}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section style={{ background: '#fff', padding: '5rem 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Loved by Teams
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>
                Real people, real projects.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.875rem',
                    padding: '2rem',
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {t.rating && (
                    <div style={{ fontSize: '1rem', color: '#f59e0b' }}>
                      {'⭐'.repeat(t.rating)}
                    </div>
                  )}
                  <p style={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.7, flex: 1 }}>
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.clientName}</div>
                    {t.clientRole && (
                      <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{t.clientRole}</div>
                    )}
                    {t.clientCompany && (
                      <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{t.clientCompany}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog Preview ──────────────────────────────────────────────────────── */}
      {recentPosts.length > 0 && (
        <section style={{ background: '#f9fafb', padding: '5rem 0' }}>
          <div className="container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  From the Blog
                </h2>
                <p style={{ color: '#6b7280' }}>Tips, tutorials and product updates.</p>
              </div>
              <a
                href="/blog"
                style={{
                  color: primaryColor,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: `1px solid ${primaryColor}`,
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                }}
              >
                View all posts →
              </a>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {recentPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.875rem',
                    overflow: 'hidden',
                    display: 'block',
                    background: '#fff',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {(post.featuredImageUrl || post.featuredImage) && (
                    <img
                      src={post.featuredImageUrl || post.featuredImage || ''}
                      alt={post.title}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '1.25rem' }}>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {post.title}
                    </h3>
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: '#9ca3af',
                      }}
                    >
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      <span style={{ color: primaryColor, fontWeight: 600 }}>Read more →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ───────────────────────────────────────────────────────── */}
      <section
        style={{
          background: '#111827',
          color: '#fff',
          padding: '5rem 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            Ready to build something great?
          </h2>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '1.05rem',
              marginBottom: '2.5rem',
              maxWidth: '480px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Get Mero CMS running on your own infrastructure in minutes — free and open source.
          </p>
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: primaryColor,
              color: '#fff',
              fontWeight: 700,
              padding: '0.9rem 2.25rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              display: 'inline-block',
              transition: 'opacity 0.2s',
            }}
          >
            {ctaText}
          </a>
        </div>
      </section>
    </>
  );
}
