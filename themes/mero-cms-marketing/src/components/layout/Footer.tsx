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

const STATIC_RESOURCES = [
  { label: 'Documentation', href: '/docs' },
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Blog', href: '/blog' },
  { label: 'Support', href: '/contact' },
];

const STATIC_LEGAL = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'MIT License', href: 'https://github.com' },
];

export default function Footer({ siteData }: FooterProps) {
  const settings = siteData?.settings;
  const year = new Date().getFullYear();

  const socialLinks = settings?.socialLinks
    ? Object.entries(settings.socialLinks).filter(([, url]) => Boolean(url))
    : [];

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
            {socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {socialLinks.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--color-muted-2)', textTransform: 'capitalize', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted-2)')}
                  >
                    {platform}
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
              {STATIC_PRODUCT.map(l => (
                <li key={l.href}>
                  <a href={l.href} style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                    {l.label}
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
              {STATIC_RESOURCES.map(l => (
                <li key={l.href}>
                  <a href={l.href} style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                    {l.label}
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
              {STATIC_LEGAL.map(l => (
                <li key={l.href}>
                  <a href={l.href} style={{ fontSize: '0.875rem', color: 'var(--color-muted)', transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
                    {l.label}
                  </a>
                </li>
              ))}
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
