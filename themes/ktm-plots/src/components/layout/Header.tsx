'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { SiteData, Menu } from '@/lib/cms';
import { getImageUrl } from '@/lib/cms';

interface Props {
  siteData: SiteData;
  menu?: Menu;
}

export default function Header({ siteData, menu }: Props) {
  const [open, setOpen] = useState(false);
  const { settings } = siteData;
  const logoUrl = getImageUrl(settings.logoUrl);

  const items = menu?.items?.sort((a, b) => a.order - b.order) ?? [
    { id: '1', label: 'Home',     url: '/',         order: 1 },
    { id: '2', label: 'About',    url: '/about',    order: 2 },
    { id: '3', label: 'Plots',    url: '/plots',    order: 3 },
    { id: '4', label: 'Services', url: '/services', order: 4 },
    { id: '5', label: 'Blog',     url: '/blog',     order: 5 },
    { id: '6', label: 'Contact',  url: '/contact',  order: 6 },
  ];

  return (
    <header style={{ background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', borderBottom: '3px solid #CC1414' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>

        {/* Logo — full image if set in CMS, otherwise brand-matching KTM PLOTS blocks */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={settings.siteTitle || 'KTM Plots'}
              width={150}
              height={56}
              style={{ objectFit: 'contain', maxHeight: '56px', width: 'auto' }}
              priority
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'stretch', lineHeight: 1 }}>
              <span style={{ background: '#CC1414', color: '#fff', fontWeight: 900, fontSize: '1.45rem', letterSpacing: '-0.5px', padding: '6px 12px' }}>
                KTM
              </span>
              <span style={{ background: '#1E1E1E', color: '#fff', fontWeight: 900, fontSize: '1.45rem', letterSpacing: '4px', padding: '6px 12px' }}>
                PLOTS
              </span>
            </div>
          )}
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="desktop-nav">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              style={{ color: '#2E2E2E', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#CC1414')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#2E2E2E')}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary" style={{ padding: '0.5rem 1.4rem', fontSize: '0.875rem' }}>
            Get a Quote
          </Link>
        </nav>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          className="hamburger"
          aria-label="Toggle menu"
        >
          <svg width="26" height="26" fill="none" stroke="#CC1414" strokeWidth="2.5">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="13" x2="21" y2="13" /><line x1="3" y1="19" x2="21" y2="19" /></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#1E1E1E', borderTop: '2px solid #CC1414', padding: '1rem 1.5rem 1.5rem' }} className="mobile-menu">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setOpen(false)}
              style={{ display: 'block', color: '#E5E7EB', textDecoration: 'none', padding: '0.7rem 0', fontSize: '1rem', borderBottom: '1px solid #333', fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#CC1414')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }} onClick={() => setOpen(false)}>
            Get a Quote
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </header>
  );
}
