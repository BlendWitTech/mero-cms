import { SiteData, cmsImageUrl } from '@/lib/cms';

interface HeaderProps {
  siteData: SiteData | null;
}

export default function Header({ siteData }: HeaderProps) {
  const settings = siteData?.settings;
  const mainNav = siteData?.menus.find(m => m.slug === 'main-nav');

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
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
        }}
      >
        {/* Logo / Site Title */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}>
          {settings?.logoUrl ? (
            <img
              src={cmsImageUrl(settings.logoUrl)!}
              alt={settings.siteTitle}
              style={{ height: '36px', width: 'auto' }}
            />
          ) : (
            <span>{settings?.siteTitle || 'My Site'}</span>
          )}
        </a>

        {/* Navigation */}
        {mainNav && mainNav.items.length > 0 && (
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: '0.25rem', alignItems: 'center' }}>
              {mainNav.items
                .sort((a, b) => a.order - b.order)
                .map(item => (
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
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
