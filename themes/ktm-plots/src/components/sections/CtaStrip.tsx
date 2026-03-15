import Link from 'next/link';
import type { SiteData } from '@/lib/cms';

interface Props { siteData: SiteData; secData?: Record<string, any>; }

export default function CtaStrip({ siteData, secData = {} }: Props) {
  const { settings } = siteData;
  const ctaText = settings.ctaText || secData.buttons?.[0]?.text || 'Browse Available Plots';
  const ctaUrl  = settings.ctaUrl  || secData.buttons?.[0]?.url  || '/plots';
  const badge = secData.badge || 'Start Your Journey';
  const heading = secData.heading || 'Secure Your Piece of Kathmandu Valley';
  const secondaryButtonText = secData.secondaryButtonText || 'Schedule a Free Visit';
  const secondaryButtonUrl = secData.secondaryButtonUrl || '/contact';

  return (
    <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
          gap: 0,
          boxShadow: '0 20px 40px rgba(204, 20, 20, 0.15)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          {/* Background texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(204,20,20,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', background: 'linear-gradient(90deg, transparent, rgba(204,20,20,0.1))', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }} />

          {/* Left: Text */}
          <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(3rem, 5vw, 4rem) clamp(2.5rem, 4vw, 4rem)' }}>
            <div style={{ display: 'inline-block', background: 'rgba(204,20,20,0.2)', color: '#FF4444', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem', border: '1px solid rgba(204,20,20,0.3)' }}>
              {badge}
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.5px' }}>
              {heading}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '440px', lineHeight: 1.7 }}>
              {settings.tagline || 'Browse our verified plots or speak with a property consultant for a free consultation and guided site visit.'}
            </p>

            {/* Contact strip */}
            {(settings.contactPhone || settings.contactEmail) && (
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {settings.contactPhone && (
                  <a href={`tel:${settings.contactPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" fill="none" stroke="#CC1414" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    {settings.contactPhone}
                  </a>
                )}
                {settings.contactEmail && (
                  <a href={`mailto:${settings.contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                     <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" fill="none" stroke="#CC1414" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    {settings.contactEmail}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: Buttons — border-left removed on mobile via .cta-right-panel */}
          <div className="cta-right-panel" style={{ position: 'relative', zIndex: 1, padding: 'clamp(2rem, 4vw, 4rem) clamp(2.5rem, 4vw, 4rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start', justifyContent: 'center', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
             <Link href={ctaUrl} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#CC1414', color: '#FFFFFF', fontWeight: 800, padding: '1.1rem 2.5rem', borderRadius: '8px', textDecoration: 'none', fontSize: '1.05rem', width: '100%', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: '0 4px 14px rgba(204, 20, 20, 0.4)' }}>
              {ctaText}
              <svg style={{ marginLeft: '10px' }} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </Link>
            <Link href={secondaryButtonUrl} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#FFFFFF', fontWeight: 600, padding: '1.1rem 2.5rem', borderRadius: '8px', textDecoration: 'none', fontSize: '1.05rem', border: '2px solid rgba(255,255,255,0.2)', width: '100%', textAlign: 'center', transition: 'all 0.2s ease' }}>
              {secondaryButtonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
