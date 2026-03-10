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
    { id: '1', label: 'Home', url: '/', order: 1 },
    { id: '2', label: 'About', url: '/about', order: 2 },
    { id: '3', label: 'Plots', url: '/plots', order: 3 },
    { id: '4', label: 'Services', url: '/services', order: 4 },
    { id: '5', label: 'Blog', url: '/blog', order: 5 },
    { id: '6', label: 'Contact', url: '/contact', order: 6 },
  ];

  return (
    <header style={{ background: '#1B4332', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          {logoUrl ? (
            <Image src={logoUrl} alt={settings.siteTitle} width={48} height={48} style={{ objectFit: 'contain', borderRadius: '4px' }} />
          ) : null}
          <span style={{ color: '#D4A017', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
            {settings.siteTitle || 'KTM Plots'}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#D4A017')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
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
          <svg width="24" height="24" fill="none" stroke="#D4A017" strokeWidth="2">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#1B4332', borderTop: '1px solid #2D6A4F', padding: '1rem 1.5rem' }} className="mobile-menu">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setOpen(false)}
              style={{ display: 'block', color: '#E5E7EB', textDecoration: 'none', padding: '0.6rem 0', fontSize: '1rem', borderBottom: '1px solid #2D6A4F' }}
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
