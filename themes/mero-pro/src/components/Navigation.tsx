import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { getMenu, getSiteData, mediaUrl } from '@/lib/api';

/**
 * Floating pill navigation bar.
 *
 * Tries to fetch the CMS-authored 'main-nav' menu first; falls back to
 * the hardcoded NAV_LINKS list when no menu is configured (or backend
 * is offline). Same fallback pattern for the brand logo — uses the
 * theme-bundled /logo.svg unless the admin has uploaded a custom logo.
 *
 * Mounted once in app/layout.tsx so it shows on every route. Server
 * component — no client-side state.
 */
const FALLBACK_LINKS = [
    { label: 'Product', href: '/#features' },
    { label: 'Use cases', href: '/#use-cases' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Customers', href: '/customers' },
    { label: 'FAQ', href: '/#faq' },
];

export default async function Navigation() {
    const [menu, site] = await Promise.all([getMenu('main-nav'), getSiteData()]);

    const links = menu?.items?.length
        ? menu.items.map(item => ({ label: item.label, href: item.url }))
        : FALLBACK_LINKS;

    const logoSrc = site?.settings?.logoUrl ? mediaUrl(site.settings.logoUrl) : '/logo.svg';
    const siteTitle = site?.settings?.siteTitle || 'Mero CMS';

    return (
        <div
            className="nav-shell"
            style={{
                position: 'fixed',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: 'calc(100% - 32px)',
                maxWidth: 1140,
            }}
        >
            <nav
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.78)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(13,14,20,0.06)',
                    borderRadius: 100,
                    padding: '6px 8px 6px 20px',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                <Link href="/" aria-label={`${siteTitle} home`} style={{ lineHeight: 0 }}>
                    <Image
                        src={logoSrc}
                        alt={siteTitle}
                        width={140}
                        height={44}
                        priority
                        unoptimized
                        style={{ height: 44, width: 'auto', display: 'block' }}
                    />
                </Link>

                <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
                    {links.map(link => (
                        <Link
                            key={link.href + link.label}
                            href={link.href}
                            style={{
                                color: 'var(--ink-2)',
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 500,
                                padding: '8px 4px',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Button href="/login" variant="ghost">Sign in</Button>
                    <Button href="/signup" variant="primary">Start free</Button>
                </div>
            </nav>
        </div>
    );
}
