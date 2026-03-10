import { SiteData, cmsImageUrl } from '@/lib/cms';

interface FooterProps {
  siteData: SiteData | null;
}

export default function Footer({ siteData }: FooterProps) {
  const settings = siteData?.settings;
  const footerNav = siteData?.menus.find(m => m.slug === 'footer');
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#111827', color: '#9ca3af', padding: '3rem 0 2rem' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Brand */}
          <div>
            {settings?.logoUrl ? (
              <img
                src={cmsImageUrl(settings.logoUrl)!}
                alt={settings.siteTitle}
                style={{ height: '32px', width: 'auto', marginBottom: '0.75rem', filter: 'brightness(0) invert(1)' }}
              />
            ) : (
              <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', marginBottom: '0.75rem' }}>
                {settings?.siteTitle || 'My Site'}
              </div>
            )}
            {settings?.tagline && (
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{settings.tagline}</p>
            )}
          </div>

          {/* Footer nav links */}
          {footerNav && footerNav.items.length > 0 && (
            <div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Links
              </h3>
              <ul style={{ listStyle: 'none' }}>
                {footerNav.items
                  .sort((a, b) => a.order - b.order)
                  .map(item => (
                    <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                      <a
                        href={item.url}
                        style={{ fontSize: '0.875rem', color: '#9ca3af', transition: 'color 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#fff')}
                        onMouseOut={e => (e.currentTarget.style.color = '#9ca3af')}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {(settings?.contactEmail || settings?.contactPhone || settings?.address) && (
            <div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contact
              </h3>
              {settings.contactEmail && (
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <a href={`mailto:${settings.contactEmail}`} style={{ color: '#9ca3af' }}>
                    {settings.contactEmail}
                  </a>
                </p>
              )}
              {settings.contactPhone && (
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{settings.contactPhone}</p>
              )}
              {settings.address && (
                <p style={{ fontSize: '0.875rem' }}>{settings.address}</p>
              )}
            </div>
          )}

          {/* Social links */}
          {settings?.socialLinks && Object.values(settings.socialLinks).some(Boolean) && (
            <div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Follow Us
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {Object.entries(settings.socialLinks)
                  .filter(([, url]) => url)
                  .map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', color: '#9ca3af', textTransform: 'capitalize', transition: 'color 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.color = '#fff')}
                      onMouseOut={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      {platform}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '1.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
          {settings?.copyright || `© ${year} ${settings?.siteTitle || 'My Site'}. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
