import type { ReactNode } from 'react';

/**
 * Reusable Mero CMS admin dashboard mockup.
 *
 * Three variants render different main-pane content; the chrome and
 * sidebar stay identical so the brand pattern is consistent across the
 * page (one admin app, multiple views).
 *
 *   "overview"          — Hero section. Shows KPI cards + status panels.
 *   "ai-studio"         — Feature row 2. Shows the AI Studio interface.
 *   "capability-matrix" — Feature row 3. Shows the 8-tier capability table.
 *
 * Active sidebar item is computed from the variant; the chrome URL also
 * varies so the mockup feels like the real admin's deep-link path.
 */
export type DashboardVariant = 'overview' | 'ai-studio' | 'capability-matrix';

interface Props {
    variant?: DashboardVariant;
}

const MENU = [
    'Dashboard',
    'Site Pages',
    'Content',
    'Blog',
    'Media',
    'Plugins',
    'AI Studio',
    'Settings',
] as const;

const VARIANT_TO_ACTIVE: Record<DashboardVariant, (typeof MENU)[number]> = {
    'overview': 'Dashboard',
    'ai-studio': 'AI Studio',
    'capability-matrix': 'Settings',
};

const VARIANT_TO_URL: Record<DashboardVariant, string> = {
    'overview': 'admin.merocms.com / dashboard',
    'ai-studio': 'admin.merocms.com / ai-studio',
    'capability-matrix': 'admin.merocms.com / settings / capabilities',
};

export default function DashboardMockup({ variant = 'overview' }: Props) {
    const active = VARIANT_TO_ACTIVE[variant];
    const url = VARIANT_TO_URL[variant];

    return (
        <>
            <div className="hd-chrome">
                <span className="hd-dot" style={{ background: '#ff5f57' }} />
                <span className="hd-dot" style={{ background: '#febc2e' }} />
                <span className="hd-dot" style={{ background: '#28c840' }} />
                <span className="hd-url">{url}</span>
            </div>
            <div className="hd-body">
                <aside className="hd-side">
                    <div className="hd-brand">
                        <span className="hd-brand-mark">M</span>
                        <span>
                            <span className="hd-brand-mero">MERO</span>{' '}
                            <span className="hd-brand-cms">CMS</span>
                        </span>
                    </div>
                    <div className="hd-menu-label">MENU</div>
                    {MENU.map(item => (
                        <div key={item} className={`hd-menu-item ${item === active ? 'active' : ''}`}>
                            <span className="pip" /> {item}
                        </div>
                    ))}
                    <div className="hd-license">
                        <small>LICENSE</small>
                        <b>ENTERPRISE</b>
                        <span className="v">✓ VERIFIED</span>
                    </div>
                </aside>
                <main className="hd-main">
                    {variant === 'overview' && <OverviewPane />}
                    {variant === 'ai-studio' && <AIStudioPane />}
                    {variant === 'capability-matrix' && <CapabilityMatrixPane />}
                </main>
            </div>
        </>
    );
}

/* ── Main-pane variants ───────────────────────────────────────── */

function OverviewPane() {
    return (
        <>
            <div className="hd-topbar">
                <div className="hd-search">🔍 Search…</div>
                <div className="hd-actions">
                    <span style={iconStyle}>🔔</span>
                    <span style={avatarPillStyle}>BL</span>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                    <div className="hd-greeting">GOOD AFTERNOON · APRIL 26, 2026</div>
                    <div className="hd-title">Dashboard Overview</div>
                    <div className="hd-subtitle">Here&apos;s what&apos;s happening with your CMS today.</div>
                </div>
                <div className="hd-actions">
                    <span className="hd-btn hd-btn-light">📊 Analytics</span>
                    <span className="hd-btn hd-btn-brand">+ New Post</span>
                </div>
            </div>
            <div className="hd-stats">
                {[
                    { label: 'TOTAL BLOGS', num: '0', meta: 'Published', icon: '📄', tone: 'b' },
                    { label: 'ACTIVE USERS', num: '1', meta: 'Registered', icon: '👥', tone: 'p' },
                    { label: 'MEDIA FILES', num: '0', meta: 'In library', icon: '🗂', tone: 's' },
                    { label: 'PAGE VIEWS', num: '0', meta: 'Today', icon: '📈', tone: 'g' },
                ].map(stat => (
                    <div key={stat.label} className="hd-stat">
                        <div className="hd-stat-l">
                            <span className="hd-stat-eyebrow">{stat.label}</span>
                            <span className="hd-stat-num">{stat.num}</span>
                            <span className="hd-stat-meta">{stat.meta}</span>
                        </div>
                        <span className={`hd-stat-icon ${stat.tone}`}>{stat.icon}</span>
                    </div>
                ))}
            </div>
            <div className="hd-panels">
                <div className="hd-panel">
                    <h6>Quick Actions</h6>
                    <small>Common tasks at a glance</small>
                </div>
                <div className="hd-panel">
                    <h6>Security Status</h6>
                    <small>System protection overview</small>
                </div>
                <div className="hd-panel">
                    <h6>Active Plan</h6>
                    <small style={{ color: 'var(--brand)', fontWeight: 700, letterSpacing: '0.06em' }}>ENTERPRISE</small>
                </div>
            </div>
        </>
    );
}

function AIStudioPane() {
    return (
        <>
            <div className="hd-greeting">AI STUDIO · 12 PRESETS</div>
            <div className="hd-title">Generate</div>
            <div className="hd-subtitle">Drafts that match your brand voice in seconds.</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="hd-btn hd-btn-brand">Blog outline</span>
                <span className="hd-btn hd-btn-light">Meta description</span>
                <span className="hd-btn hd-btn-light">Alt text</span>
                <span className="hd-btn hd-btn-light">Translate</span>
            </div>
            <div className="hd-panel" style={{ padding: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-4)', marginBottom: 6 }}>
                    PROMPT
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--ink)', marginBottom: 10 }}>
                    Outline a post about why our customers ship faster with Mero CMS.
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 9, color: 'var(--ink-3)' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--brand)',
                            animation: 'pulse 1.4s infinite',
                        }}
                    />
                    Generating outline · 78%
                </div>
                <div style={{ height: 5, borderRadius: 100, background: 'rgba(13,14,20,.06)', marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, var(--brand), var(--navy))' }} />
                </div>
            </div>
        </>
    );
}

function CapabilityMatrixPane() {
    const rows: { feat: string; tiers: [boolean, boolean, boolean, boolean] }[] = [
        { feat: 'Visual editor',         tiers: [false, true,  true,  true] },
        { feat: 'AI Studio',             tiers: [false, false, true,  true] },
        { feat: 'Webhooks (HMAC)',       tiers: [false, true,  true,  true] },
        { feat: 'Custom collections',    tiers: [false, false, true,  true] },
        { feat: 'White-label admin',     tiers: [false, false, false, true] },
        { feat: 'SLA & priority support',tiers: [false, false, false, true] },
    ];
    return (
        <>
            <div className="hd-greeting">SETTINGS · CAPABILITY MATRIX</div>
            <div className="hd-title">8-tier matrix</div>
            <div className="hd-subtitle">Twelve features. Eight tiers. One source of truth.</div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr repeat(4, 1fr)',
                    gap: 8,
                    fontSize: 8,
                    color: 'var(--ink-4)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--paper-3)',
                }}
            >
                <span>Capability</span>
                <span>Free</span>
                <span>Studio</span>
                <span>Pro</span>
                <span>Ent</span>
            </div>
            {rows.map(row => (
                <div
                    key={row.feat}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.4fr repeat(4, 1fr)',
                        gap: 8,
                        fontSize: 12,
                        alignItems: 'center',
                        padding: '6px 0',
                    }}
                >
                    <span style={{ fontWeight: 600 }}>{row.feat}</span>
                    {row.tiers.map((on, i) => (
                        <span key={i} style={{ color: on ? '#2a8e3f' : 'var(--ink-4)' }}>{on ? '●' : '—'}</span>
                    ))}
                </div>
            ))}
        </>
    );
}

const iconStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#fff',
    border: '1px solid #ebe8df',
    display: 'grid',
    placeItems: 'center',
    fontSize: 8,
};

const avatarPillStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2557e8, #8344e8)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 7,
    fontWeight: 700,
};

// `ReactNode` import keeps types valid without lint warning when the
// file is evaluated on its own.
export type _typeAnchor = ReactNode;
