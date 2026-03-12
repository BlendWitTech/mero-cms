import Link from 'next/link';
import type { SiteData } from '@/lib/cms';

interface Props {
  siteData: SiteData;
}

export default function CtaStrip({ siteData }: Props) {
  const { settings } = siteData;
  const ctaText = settings.ctaText || 'Browse Available Plots';
  const ctaUrl = settings.ctaUrl || '/plots';

  return (
    <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
      <div className="container">
        <div
          style={{
            background: 'linear-gradient(135deg, #CC1414 0%, #A01010 100%)',
            borderRadius: '20px',
            padding: 'clamp(2.5rem, 5vw, 4rem)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background dots */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(204,20,20,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: '#CC1414', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Start Your Journey
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem', lineHeight: 1.2 }}>
              Ready to Find Your<br />
              <span style={{ color: '#CC1414' }}>Perfect Plot?</span>
            </h2>
            <p style={{ color: '#A0A0A0', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              {settings.tagline || 'Browse our verified plots across Kathmandu Valley or speak with one of our property consultants for a free consultation.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href={ctaUrl} className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
                {ctaText}
              </Link>
              <Link href="/contact" className="btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
                Free Consultation
              </Link>
            </div>

            {/* Contact info strip */}
            {(settings.contactPhone || settings.contactEmail) && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#A0A0A0' }}>
                {settings.contactPhone && (
                  <a href={`tel:${settings.contactPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#A0A0A0', textDecoration: 'none' }}>
                    <svg width="15" height="15" fill="none" stroke="#CC1414" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {settings.contactPhone}
                  </a>
                )}
                {settings.contactEmail && (
                  <a href={`mailto:${settings.contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#A0A0A0', textDecoration: 'none' }}>
                    <svg width="15" height="15" fill="none" stroke="#CC1414" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {settings.contactEmail}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
