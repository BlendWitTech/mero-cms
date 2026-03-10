import { getSiteData, getPublishedPosts } from '@/lib/cms';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import HowItWorks from '@/components/sections/HowItWorks';
import Pricing from '@/components/sections/Pricing';
import Testimonials from '@/components/sections/Testimonials';
import BlogPreview from '@/components/sections/BlogPreview';

export default async function HomePage() {
  const [siteData, postsResult] = await Promise.all([
    getSiteData(60).catch(() => null),
    getPublishedPosts({ limit: 3 }, 60).catch(() => ({ posts: [], pagination: { total: 0, page: 1, limit: 3, totalPages: 0 } })),
  ]);

  const testimonials = siteData?.testimonials ?? [];
  const recentPosts = postsResult.posts;

  return (
    <>
      <Hero />
      <div className="glow-line" />
      <Features />
      <div className="glow-line" />
      <HowItWorks />
      <div className="glow-line" />
      <Pricing />
      <div className="glow-line" />
      <Testimonials testimonials={testimonials} />
      <div className="glow-line" />
      <BlogPreview posts={recentPosts} />

      {/* Final CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(3rem, 6vw, 5rem)',
          }}>
            <span className="section-label">Get Started Today</span>
            <h2 className="section-title" style={{ margin: '0 auto 1rem' }}>
              Ready to Build Smarter?
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--color-muted)', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              Deploy in minutes. Choose your modules. Ship a beautiful website.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/contact" className="btn btn-primary btn-lg">
                Start for Free
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
