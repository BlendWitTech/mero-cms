'use client';
import Link from 'next/link';

import type { SiteData } from '@/lib/cms';

interface Props {
  siteData: SiteData;
}

export default function Footer({ siteData }: Props) {
  const { settings } = siteData;
  const year = new Date().getFullYear();

  // Read individual social settings set via Admin -> Theme Settings
  const fbUrl = (settings as any).social_facebook || '';
  const igUrl = (settings as any).social_instagram || '';
  const ytUrl = (settings as any).social_youtube || '';
  const waUrl = (settings as any).social_whatsapp || '';
  const hasSocial = fbUrl || igUrl || ytUrl || waUrl;

  return (
    <footer style={{ background: '#111111', color: '#9CA3AF', paddingTop: '3rem', paddingBottom: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Brand */}
          <div>
            <div style={{ color: '#CC1414', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.75rem' }}>
              {settings.siteTitle || 'KTM Plots'}
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.7', color: '#9CA3AF' }}>
              {settings.tagline || "Kathmandu Valley's Trusted Land Partner"}
            </p>
            {/* Social links */}
            {hasSocial && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {fbUrl && (
                  <a href={fbUrl} target="_blank" rel="noreferrer" aria-label="Facebook" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#CC1414')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                )}
                {igUrl && (
                  <a href={igUrl} target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#CC1414')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </a>
                )}
                {ytUrl && (
                  <a href={ytUrl} target="_blank" rel="noreferrer" aria-label="YouTube" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#CC1414')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02" fill="#111"/></svg>
                  </a>
                )}
                {waUrl && (
                  <a href={`https://wa.me/${waUrl.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#25D366')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Home', href: '/' },
                { label: 'About Us', href: '/about' },
                { label: 'Plots', href: '/plots' },
                { label: 'Services', href: '#services' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#CC1414')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Contact Us</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              {settings.address && (
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <svg width="16" height="16" fill="none" stroke="#CC1414" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{settings.address}</span>
                </li>
              )}
              {settings.contactPhone && (
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <svg width="16" height="16" fill="none" stroke="#CC1414" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <a href={`tel:${settings.contactPhone}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}>{settings.contactPhone}</a>
                </li>
              )}
              {settings.contactEmail && (
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <svg width="16" height="16" fill="none" stroke="#CC1414" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <a href={`mailto:${settings.contactEmail}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}>{settings.contactEmail}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1F2937', paddingTop: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span>© {year} {settings.siteTitle || 'KTM Plots'}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/privacy" style={{ color: '#6B7280', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#6B7280', textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
