import Link from 'next/link';
import type { SiteData } from '@/lib/cms';

interface Props {
  siteData: SiteData;
}

export default function Hero({ siteData }: Props) {
  const { settings } = siteData;

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #1B4332 100%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Decorative mountain silhouette */}
      <svg
        viewBox="0 0 1440 320"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.15 }}
        preserveAspectRatio="none"
      >
        <path fill="#52B788" d="M0,320 L0,200 L180,100 L360,180 L540,60 L720,140 L900,40 L1080,120 L1260,70 L1440,130 L1440,320 Z" />
        <path fill="#40916C" d="M0,320 L0,240 L120,160 L280,220 L480,120 L660,200 L840,110 L1020,180 L1200,140 L1440,180 L1440,320 Z" />
      </svg>

      {/* Dot pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(212,160,23,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '700px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(212,160,23,0.15)',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4A017', display: 'inline-block' }} />
            <span style={{ color: '#D4A017', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              KATHMANDU VALLEY&apos;S TRUSTED LAND PARTNER
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Find Your Perfect
            <span style={{ color: '#D4A017', display: 'block' }}>Land Plot</span>
            in Kathmandu Valley
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#B7D9C8',
              marginBottom: '2.5rem',
              maxWidth: '560px',
              lineHeight: 1.7,
            }}
          >
            Premium residential and commercial plots with clear legal titles, transparent pricing, and full registration support. Your dream home starts here.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
            <Link href="/plots" className="btn-primary" style={{ fontSize: '1rem', padding: '0.85rem 2.25rem' }}>
              Browse Plots
            </Link>
            <Link href="/contact" className="btn-outline" style={{ fontSize: '1rem', padding: '0.85rem 2.25rem' }}>
              Free Consultation
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem' }}>
            {[
              { value: '500+', label: 'Plots Sold' },
              { value: '50+', label: 'Locations' },
              { value: '10+', label: 'Years Experience' },
              { value: '100%', label: 'Legal Titles' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D4A017' }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#B7D9C8', marginTop: '0.15rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: 0.6,
        }}
      >
        <span style={{ color: '#B7D9C8', fontSize: '0.75rem', letterSpacing: '0.1em' }}>SCROLL</span>
        <svg width="20" height="20" fill="none" stroke="#B7D9C8" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
