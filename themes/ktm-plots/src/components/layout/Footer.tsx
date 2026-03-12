'use client';
import Link from 'next/link';

import type { SiteData } from '@/lib/cms';

interface Props {
  siteData: SiteData;
}

export default function Footer({ siteData }: Props) {
  const { settings } = siteData;
  const year = new Date().getFullYear();

  const social = settings.socialLinks as Record<string, string> | null;

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
            {social && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noreferrer" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noreferrer" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noreferrer" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
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
