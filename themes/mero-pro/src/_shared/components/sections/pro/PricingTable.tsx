export interface PricingTableTier {
    name?: string;
    price?: string;
    period?: string;
    description?: string;
    features?: string[];
    cta?: string;
    href?: string;
    /** When true, the tier renders with a brand-coloured ring + a
        "Most popular" badge. Use sparingly — at most one tier. */
    featured?: boolean;
}

export interface PricingTableData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    tiers?: PricingTableTier[];
    /** Footer note (compliance, money-back, etc). */
    footnote?: string;
}

const DEFAULTS: Required<PricingTableData> = {
    eyebrow: '',
    title: 'Pricing',
    subtitle: '',
    tiers: [],
    footnote: '',
};

/**
 * PricingTable — Pro widget. Full pricing comparison: 2-4 tiers in
 * a row with a feature checklist per tier and a featured-tier ring.
 *
 * Distinct from PricingTeaser: PricingTeaser is a 3-up summary that
 * links to a full pricing page. PricingTable IS the full pricing
 * page's centrepiece — long feature lists, big CTAs, footnote.
 */
export default function PricingTable({ data = {} }: { data?: PricingTableData }) {
    const d = { ...DEFAULTS, ...data, tiers: data?.tiers ?? DEFAULTS.tiers };
    if (!d.tiers.length) return null;

    return (
        <section
            data-section-id="pricing-table"
            data-section-type="PricingTable"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                {(d.eyebrow || d.title || d.subtitle) && (
                    <header style={{ marginBottom: 40, textAlign: 'center', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
                        {d.eyebrow && <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>{d.eyebrow}</div>}
                        {d.title && (
                            <h2 className="display" data-editable="title" style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                        {d.subtitle && <p data-editable="subtitle" style={{ color: 'var(--ink-3)', marginTop: 12 }}>{d.subtitle}</p>}
                    </header>
                )}

                <div
                    style={{
                        display: 'grid',
                        gap: 20,
                        gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
                    }}
                >
                    {d.tiers.map((tier, i) => (
                        <article
                            key={i}
                            style={{
                                position: 'relative',
                                background: '#fff',
                                border: tier.featured
                                    ? '2px solid var(--brand, #cb172b)'
                                    : '1px solid var(--line, rgba(0,0,0,0.08))',
                                borderRadius: 18,
                                padding: '28px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {tier.featured && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: -10,
                                        left: 24,
                                        background: 'var(--brand, #cb172b)',
                                        color: '#fff',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                    }}
                                >
                                    Most popular
                                </span>
                            )}
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{tier.name}</h3>
                            {tier.description && (
                                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18, minHeight: 36 }}>
                                    {tier.description}
                                </p>
                            )}
                            <div style={{ marginBottom: 20 }}>
                                <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink-1)' }}>{tier.price}</span>
                                {tier.period && (
                                    <span style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 6 }}>{tier.period}</span>
                                )}
                            </div>
                            {tier.cta && tier.href && (
                                <a
                                    href={tier.href}
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        background: tier.featured ? 'var(--brand, #cb172b)' : 'var(--ink-1, #0d0e14)',
                                        color: '#fff',
                                        padding: '12px 16px',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        marginBottom: 20,
                                    }}
                                >
                                    {tier.cta}
                                </a>
                            )}
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(tier.features || []).map((f, j) => (
                                    <li key={j} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--ink-2)' }}>
                                        <span aria-hidden="true" style={{ color: 'var(--brand, #cb172b)', fontWeight: 700 }}>✓</span>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>

                {d.footnote && (
                    <p style={{ marginTop: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                        {d.footnote}
                    </p>
                )}
            </div>
        </section>
    );
}
