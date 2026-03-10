'use client';

import { SiteData, cmsImageUrl } from '@/lib/cms';

interface HeaderProps {
  siteData: SiteData | null;
}

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export default function Header({ siteData }: HeaderProps) {
  const settings = siteData?.settings;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 15, 30, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
        gap: '2rem',
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          {settings?.logoUrl ? (
            <img
              src={cmsImageUrl(settings.logoUrl)!}
              alt={settings.siteTitle}
              style={{ height: '32px', width: 'auto' }}
            />
          ) : (
            <>
              {/* Icon mark */}
              <div style={{
                width: '30px', height: '30px',
                background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 800, color: '#fff',
              }}>M</div>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-text)' }}>
                {settings?.siteTitle || 'Mero CMS'}
              </span>
            </>
          )}
        </a>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-muted)',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.color = 'var(--color-text)';
                e.currentTarget.style.background = 'var(--color-surface)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = 'var(--color-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <a
            href={process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000'}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-muted)',
              transition: 'color 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            Log in
          </a>
          <a href="/contact" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
            Get Started →
          </a>
        </div>
      </div>
    </header>
  );
}
