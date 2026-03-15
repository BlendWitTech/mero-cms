'use client';

import { SiteData, cmsImageUrl } from '@/lib/cms';

interface FooterProps {
  siteData: SiteData | null;
}

const STATIC_PRODUCT = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Changelog', href: '/blog' },
];

export default function Footer({ siteData }: FooterProps) {
  const settings = siteData?.settings;
  const year = new Date().getFullYear();

  // Dynamic menus
  const productMenu = siteData?.menus?.find(m => m.slug === 'footer-product')?.items?.sort((a,b) => a.order - b.order) || [
    { id: 'p1', label: 'Features', url: '/#features', target: '_self', order: 1 },
    { id: 'p2', label: 'Pricing', url: '/pricing', target: '_self', order: 2 },
  ];
  const resourcesMenu = siteData?.menus?.find(m => m.slug === 'footer-resources')?.items?.sort((a,b) => a.order - b.order) || [
    { id: 'r1', label: 'Documentation', url: '/docs', target: '_self', order: 1 },
    { id: 'r2', label: 'Blog', url: '/blog', target: '_self', order: 2 },
    { id: 'r3', label: 'Support', url: '/contact', target: '_self', order: 3 },
  ];

  // Social URLs from individual settings
  const socialConfig = [
    { key: 'facebook', url: (settings as any)?.social_facebook, color: '#1877F2' },
    { key: 'twitter', url: (settings as any)?.social_twitter, color: '#1DA1F2' },
    { key: 'instagram', url: (settings as any)?.social_instagram, color: '#E1306C' },
    { key: 'linkedin', url: (settings as any)?.social_linkedin, color: '#0A66C2' },
    { key: 'youtube', url: (settings as any)?.social_youtube, color: '#FF0000' },
    { key: 'github', url: (settings as any)?.social_github, color: '#ffffff' },
  ];
  const activeSocials = socialConfig.filter(s => Boolean(s.url));

  return (
    <footer style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', paddingTop: '4rem', paddingBottom: '2rem' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem',
        }}>
          {/* Brand column */}
          <div style={{ gridColumn: 'span 1' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              {settings?.logoUrl ? (
                <img src={cmsImageUrl(settings.logoUrl)!} alt={settings.siteTitle} style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
              ) : (
                <>
                  <div style={{
                    width: '28px', height: '28px',
                    background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                    borderRadius: '7px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 800, color: '#fff',
                  }}>M</div>
                  <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>
                    {settings?.siteTitle || 'Mero CMS'}
                  </span>
                </>
              )}
            </a>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              {settings?.tagline || 'The modular CMS that adapts to every project.'}
            </p>
            {/* Social links */}
            {activeSocials.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--color-muted-2)', textTransform: 'capitalize', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = s.color)}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted-2)')}
                  >
                    {s.key}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Product */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)', marginBottom: '1rem' }}>
              Product
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {productMenu.map(link => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target={link.target === '_blank' ? '_blank' : undefined}
                    rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                    style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)', marginBottom: '1rem' }}>
              Resources
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {resourcesMenu.map(link => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target={link.target === '_blank' ? '_blank' : undefined}
                    rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                    style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)', marginBottom: '1rem' }}>
              Legal
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <a href="/privacy" style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="glow-line" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-muted-2)' }}>
          <span>
            {settings?.copyright || `© ${year} ${settings?.siteTitle || 'Mero CMS'}. All rights reserved.`}
          </span>
          <span>Built with Mero CMS</span>
        </div>
      </div>
    </footer>
  );
}
