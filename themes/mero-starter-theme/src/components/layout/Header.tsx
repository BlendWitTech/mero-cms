'use client';

import { SiteData, cmsImageUrl } from '@/lib/cms';

interface HeaderProps {
  siteData: SiteData | null;
}

export default function Header({ siteData }: HeaderProps) {
  const settings = siteData?.settings;
  const mainNav = siteData?.menus?.find(m => m.slug === 'main-nav')?.items?.sort((a,b) => a.order - b.order) || [
    { id: '1', label: 'Features', url: '/#features', target: '_self', order: 1 },
    { id: '2', label: 'How It Works', url: '/#how-it-works', target: '_self', order: 2 },
    { id: '3', label: 'Pricing', url: '/pricing', target: '_self', order: 3 },
    { id: '4', label: 'Blog', url: '/blog', target: '_self', order: 4 },
  ];

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
          {mainNav.map(link => (
            <a
              key={link.id}
              href={link.url}
              target={link.target === '_blank' ? '_blank' : undefined}
              rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
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
