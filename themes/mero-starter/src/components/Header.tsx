'use client';

import { SiteData, cmsImageUrl } from '@/lib/cms';

interface HeaderProps {
  siteData: SiteData | null;
}

export default function Header({ siteData }: HeaderProps) {
  const settings = siteData?.settings;
  const mainNav = siteData?.menus.find((m) => m.slug === 'main-nav');
  const primaryColor = settings?.primaryColor || '#4f46e5';

  // Separate last item to render as a button-style CTA
  const sortedItems = (mainNav?.items ?? []).slice().sort((a, b) => a.order - b.order);
  const navItems = sortedItems.slice(0, -1);
  const ctaItem = sortedItems.length > 0 ? sortedItems[sortedItems.length - 1] : null;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '1rem',
        }}
      >
        {/* Logo / Site Title */}
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#111827',
            flexShrink: 0,
          }}
        >
          {settings?.logoUrl ? (
            <img
              src={cmsImageUrl(settings.logoUrl)!}
              alt={settings.siteTitle}
              style={{ height: '34px', width: 'auto' }}
            />
          ) : (
            <>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: primaryColor,
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                }}
              >
                M
              </span>
              <span>{settings?.siteTitle || 'Mero CMS'}</span>
            </>
          )}
        </a>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '0.1rem', alignItems: 'center' }}>
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target={item.target === '_blank' ? '_blank' : undefined}
                  rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#374151',
                    display: 'block',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Last nav item styled as CTA button */}
          {ctaItem && (
            <a
              href={ctaItem.url}
              target={ctaItem.target === '_blank' ? '_blank' : undefined}
              rel={ctaItem.target === '_blank' ? 'noopener noreferrer' : undefined}
              style={{
                marginLeft: '0.5rem',
                padding: '0.45rem 1rem',
                borderRadius: '0.5rem',
                background: primaryColor,
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'inline-block',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {ctaItem.label}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
