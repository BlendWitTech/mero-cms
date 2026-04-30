import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import PageHero from '@/components/ui/PageHero';

export const revalidate = 600;

export const metadata: Metadata = {
    title: 'API reference',
    description: 'REST endpoints exposed by the Mero CMS backend.',
};

interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    summary: string;
    auth: 'public' | 'session' | 'api-key';
}

interface Group {
    title: string;
    description: string;
    endpoints: Endpoint[];
}

const GROUPS: Group[] = [
    {
        title: 'Public read',
        description: 'Theme-facing read endpoints. No auth required.',
        endpoints: [
            { method: 'GET', path: '/public/site-data',                 summary: 'Site metadata, settings, menus, testimonials, recent posts', auth: 'public' },
            { method: 'GET', path: '/public/pages/:slug',               summary: 'Single page with section content', auth: 'public' },
            { method: 'GET', path: '/public/posts',                     summary: 'Paginated public posts', auth: 'public' },
            { method: 'GET', path: '/public/posts/:slug',               summary: 'Single post', auth: 'public' },
            { method: 'GET', path: '/public/collections/:slug',         summary: 'Collection with first 50 items', auth: 'public' },
            { method: 'GET', path: '/public/collections/:slug/items',   summary: 'Paginated collection items', auth: 'public' },
            { method: 'GET', path: '/public/capabilities',              summary: 'Tier-derived capability map', auth: 'public' },
            { method: 'GET', path: '/public/packages',                  summary: 'Pricing tier list', auth: 'public' },
        ],
    },
    {
        title: 'Auth',
        description: 'JWT-based auth — login returns access + refresh tokens.',
        endpoints: [
            { method: 'POST', path: '/auth/register', summary: 'Create a new workspace (rate-limited)', auth: 'public' },
            { method: 'POST', path: '/auth/login',    summary: 'Authenticate, returns JWT pair',         auth: 'public' },
            { method: 'POST', path: '/auth/refresh',  summary: 'Rotate refresh token',                   auth: 'public' },
            { method: 'POST', path: '/auth/logout',   summary: 'Invalidate refresh token',               auth: 'public' },
            { method: 'GET',  path: '/auth/profile',  summary: 'Current authenticated user + license',   auth: 'session' },
        ],
    },
    {
        title: 'Forms + leads',
        description: 'Public submission. Rate-limited to 10 requests/min per IP.',
        endpoints: [
            { method: 'POST', path: '/public/leads',                summary: 'Lightweight lead capture',              auth: 'public' },
            { method: 'POST', path: '/public/forms/:id/submit',     summary: 'Submit through form-builder pipeline',  auth: 'public' },
        ],
    },
    {
        title: 'Navigation, SEO, redirects',
        description: 'CMS-managed nav menus, per-page SEO overrides, edge redirects.',
        endpoints: [
            { method: 'GET', path: '/menus/slug/:slug',          summary: 'Menu by slug (with nested children)', auth: 'public' },
            { method: 'GET', path: '/seo-meta/:pageType',        summary: 'List SEO overrides by page type',     auth: 'public' },
            { method: 'GET', path: '/seo-meta/:pageType/:pageId',summary: 'SEO override for a specific page',    auth: 'public' },
            { method: 'GET', path: '/redirects/check/:path',     summary: 'Redirect rule lookup',                auth: 'public' },
            { method: 'GET', path: '/categories',                summary: 'Blog categories',                     auth: 'public' },
        ],
    },
    {
        title: 'Theme manifest',
        description: 'Endpoints the admin uses to read theme configuration. Theme code rarely calls these.',
        endpoints: [
            { method: 'GET', path: '/themes/active',               summary: 'Currently-active theme slug',  auth: 'public' },
            { method: 'GET', path: '/themes/active/page-schema',   summary: 'Page + section structure',     auth: 'public' },
            { method: 'GET', path: '/themes/active/section-palette',summary: 'Flat section list',           auth: 'public' },
            { method: 'GET', path: '/themes/active/module-aliases',summary: 'Custom terminology overrides', auth: 'public' },
            { method: 'GET', path: '/themes/active/config',        summary: 'Full theme.json (no seedData)',auth: 'public' },
        ],
    },
];

const METHOD_COLOR: Record<Endpoint['method'], string> = {
    GET: '#1c7d4e',
    POST: '#1a3a7a',
    PUT: '#7a5e18',
    PATCH: '#7a5e18',
    DELETE: '#7a2918',
};

const AUTH_LABEL: Record<Endpoint['auth'], string> = {
    'public': 'PUBLIC',
    'session': 'SESSION',
    'api-key': 'API KEY',
};

/**
 * API reference index — endpoints grouped by resource. Each row shows
 * method, path, a one-line summary, and the auth requirement.
 *
 * For full detail (request/response shapes, examples) we'd link to
 * sub-pages at /docs/api/[group]; this page is the at-a-glance
 * overview that lets devs find the endpoint they need fast.
 */
export default function APIReferencePage() {
    return (
        <Reveal>
            <main>
                <PageHero
                    eyebrow="Documentation · API"
                    title={
                        <>
                            REST API{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                reference.
                            </span>
                        </>
                    }
                    subtitle="Every endpoint the Mero CMS backend exposes. Public endpoints power your theme; session-authenticated endpoints power the admin; api-key endpoints power your integrations."
                />

                <section className="section" style={{ paddingTop: 32 }}>
                    <div className="container" style={{ maxWidth: 920 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            {GROUPS.map(group => (
                                <div key={group.title}>
                                    <h2 className="display" style={{ fontSize: 24, letterSpacing: '-0.01em', marginBottom: 6 }}>
                                        {group.title}
                                    </h2>
                                    <p style={{ color: 'var(--ink-3)', fontSize: 15, marginBottom: 16, lineHeight: 1.55 }}>
                                        {group.description}
                                    </p>
                                    <ul
                                        style={{
                                            listStyle: 'none',
                                            padding: 0,
                                            background: '#fff',
                                            border: '1px solid var(--paper-3)',
                                            borderRadius: 'var(--r-md)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {group.endpoints.map((ep, i) => (
                                            <li
                                                key={ep.method + ep.path}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '70px 1fr auto',
                                                    gap: 16,
                                                    padding: '14px 18px',
                                                    borderTop: i === 0 ? 'none' : '1px solid var(--paper-3)',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        letterSpacing: '0.05em',
                                                        color: METHOD_COLOR[ep.method],
                                                    }}
                                                >
                                                    {ep.method}
                                                </span>
                                                <div>
                                                    <code style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--ink)' }}>
                                                        {ep.path}
                                                    </code>
                                                    <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 2 }}>{ep.summary}</div>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        letterSpacing: '0.08em',
                                                        color: 'var(--ink-4)',
                                                        background: 'var(--paper-2)',
                                                        padding: '3px 8px',
                                                        borderRadius: 100,
                                                    }}
                                                >
                                                    {AUTH_LABEL[ep.auth]}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 48 }}>
                            Need authentication details, request shapes, or example payloads?{' '}
                            <Link href="/docs/api/auth" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                                Start with auth →
                            </Link>
                        </p>
                    </div>
                </section>
            </main>
        </Reveal>
    );
}
