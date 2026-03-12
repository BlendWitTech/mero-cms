import Link from 'next/link';
import Image from 'next/image';
import type { SiteData } from '@/lib/cms';
import { getImageUrl } from '@/lib/cms';

interface Props {
  siteData: SiteData;
}

export default function Hero({ siteData }: Props) {
  const { settings } = siteData;

  // Use CMS-managed content if available, fall back to defaults
  const title = settings.heroTitle || 'Find Your Perfect Land Plot';
  const subtitle = settings.heroSubtitle || 'Premium residential and commercial plots with clear legal titles, transparent pricing, and full registration support. Your dream home starts here.';
  const bgImageUrl = getImageUrl(settings.heroBgImage);
  const ctaText = settings.ctaText || 'Browse Plots';
  const ctaUrl = settings.ctaUrl || '/plots';

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #CC1414 0%, #A01010 60%, #CC1414 100%)',
      }}
    >
      {/* Background image (if set in CMS settings) */}
      {bgImageUrl && (
        <Image
          src={bgImageUrl}
          alt="Hero background"
          fill
          style={{ objectFit: 'cover', opacity: 0.25 }}
          priority
        />
      )}

      {/* Decorative mountain silhouette */}
      <svg
        viewBox="0 0 1440 320"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: bgImageUrl ? 0.05 : 0.15 }}
        preserveAspectRatio="none"
      >
        <path fill="#E82020" d="M0,320 L0,200 L180,100 L360,180 L540,60 L720,140 L900,40 L1080,120 L1260,70 L1440,130 L1440,320 Z" />
        <path fill="#B81010" d="M0,320 L0,240 L120,160 L280,220 L480,120 L660,200 L840,110 L1020,180 L1200,140 L1440,180 L1440,320 Z" />
      </svg>

      {/* Dot pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(204,20,20,0.15) 1px, transparent 1px)',
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
              background: 'rgba(204,20,20,0.15)',
              border: '1px solid rgba(204,20,20,0.4)',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CC1414', display: 'inline-block' }} />
            <span style={{ color: '#CC1414', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              {settings.tagline || "KATHMANDU VALLEY'S TRUSTED LAND PARTNER"}
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
            {title.includes('\n')
              ? title.split('\n').map((line, i) => (
                  <span key={i} style={i > 0 ? { color: '#CC1414', display: 'block' } : undefined}>{line}</span>
                ))
              : (
                <>
                  {title.split(' ').slice(0, -3).join(' ')}{' '}
                  <span style={{ color: '#CC1414' }}>{title.split(' ').slice(-3).join(' ')}</span>
                </>
              )
            }
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#A0A0A0',
              marginBottom: '2.5rem',
              maxWidth: '560px',
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
            <Link href={ctaUrl} className="btn-primary" style={{ fontSize: '1rem', padding: '0.85rem 2.25rem' }}>
              {ctaText}
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
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#CC1414' }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#A0A0A0', marginTop: '0.15rem' }}>{stat.label}</div>
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
        <span style={{ color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.1em' }}>SCROLL</span>
        <svg width="20" height="20" fill="none" stroke="#A0A0A0" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
