import Link from 'next/link';
import Image from 'next/image';
import { getMenu, getSiteData, mediaUrl } from '@/lib/api';

/**
 * Site footer — wordmark + tagline on the left, four columns of nav
 * links on the right. Each column tries to fetch its corresponding
 * CMS menu (footer-product, footer-resources, footer-company, footer-legal);
 * falls back to hardcoded link lists when no menu is configured.
 *
 * Server component — runs all four menu fetches in parallel.
 */
const FALLBACK_GROUPS: { title: string; menuSlug: string; links: { label: string; href: string }[] }[] = [
    {
        title: 'Product',
        menuSlug: 'footer-product',
        links: [
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Changelog', href: '/changelog' },
            { label: 'Roadmap', href: '/roadmap' },
        ],
    },
    {
        title: 'Resources',
        menuSlug: 'footer-resources',
        links: [
            { label: 'Docs', href: '/docs' },
            { label: 'API reference', href: '/docs/api' },
            { label: 'Theme gallery', href: '/themes' },
            { label: 'Blog', href: '/blog' },
        ],
    },
    {
        title: 'Company',
        menuSlug: 'footer-company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Customers', href: '/customers' },
            { label: 'Careers', href: '/careers' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    {
        title: 'Legal',
        menuSlug: 'footer-legal',
        links: [
            { label: 'Terms', href: '/legal/terms' },
            { label: 'Privacy', href: '/legal/privacy' },
            { label: 'Security', href: '/legal/security' },
            { label: 'DPA', href: '/legal/dpa' },
        ],
    },
];

export default async function Footer() {
    const [site, ...menus] = await Promise.all([
        getSiteData(),
        ...FALLBACK_GROUPS.map(g => getMenu(g.menuSlug)),
    ]);

    const logoSrc = site?.settings?.logoUrl ? mediaUrl(site.settings.logoUrl) : '/logo.svg';
    const siteTitle = site?.settings?.siteTitle || 'Mero CMS';
    const footerTagline =
        site?.settings?.footerText ||
        'The motion-first CMS for teams that treat content as a product. Made by people who edit the site themselves.';
    const copyrightText =
        site?.settings?.copyrightText ||
        `© ${new Date().getFullYear()} Mero CMS · Built by Blendwit`;

    return (
        <footer style={{ background: 'var(--paper)', padding: '64px 0 32px' }}>
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Image
                            src={logoSrc}
                            alt={siteTitle}
                            width={180}
                            height={52}
                            unoptimized
                            style={{ height: 52, width: 'auto', marginBottom: 20, display: 'block' }}
                        />
                        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 280 }}>{footerTagline}</p>
                    </div>

                    {FALLBACK_GROUPS.map((group, i) => {
                        const cmsMenu = menus[i];
                        const links = cmsMenu?.items?.length
                            ? cmsMenu.items.map(item => ({ label: item.label, href: item.url }))
                            : group.links;
                        return (
                            <div key={group.title}>
                                <h5
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        color: 'var(--ink-2)',
                                        marginBottom: 16,
                                    }}
                                >
                                    {cmsMenu?.name || group.title}
                                </h5>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {links.map(link => (
                                        <li key={link.href + link.label} style={{ padding: '4px 0' }}>
                                            <Link
                                                href={link.href}
                                                style={{ color: 'var(--ink-3)', textDecoration: 'none', fontSize: 14 }}
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                <div
                    style={{
                        borderTop: '1px solid var(--paper-3)',
                        paddingTop: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--ink-3)',
                        fontSize: 13,
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <span>{copyrightText}</span>
                    <span>Made with care · v1.0</span>
                </div>
            </div>
        </footer>
    );
}
