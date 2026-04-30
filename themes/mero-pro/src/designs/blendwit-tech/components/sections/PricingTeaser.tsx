export interface BlendwitPricingTier {
    name?: string;
    price?: string;
    period?: string;
    description?: string;
    features?: string[];
    cta?: string;
    href?: string;
    /** When true, renders in lime accent. Use sparingly (one tier). */
    featured?: boolean;
}

export interface BlendwitPricingTeaserData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    tiers?: BlendwitPricingTier[];
}

const DEFAULTS: Required<BlendwitPricingTeaserData> = {
    eyebrow: '',
    title: 'Pricing',
    subtitle:
        'Pick the plan that matches the work. Switch any time — no contracts, no hidden fees.',
    tiers: [
        {
            name: 'Starter',
            price: '$0',
            period: '',
            description: 'For solo creators who want to test the waters.',
            features: ['1 project', '5 GB storage', 'Email support', 'Community access'],
            cta: 'Get started',
            href: '/signup',
        },
        {
            name: 'Growth',
            price: '$29',
            period: '/ mo',
            description: 'For teams shipping work every week.',
            features: [
                'Unlimited projects',
                '500 GB storage',
                'Priority support',
                'Custom workflows',
                'Analytics dashboard',
            ],
            cta: 'Start Growth',
            href: '/signup?plan=growth',
            featured: true,
        },
        {
            name: 'Scale',
            price: '$99',
            period: '/ mo',
            description: 'For agencies and orgs running parallel client work.',
            features: [
                'Unlimited projects',
                '5 TB storage',
                'Dedicated success manager',
                'SSO + audit log',
                'White-label reports',
            ],
            cta: 'Talk to sales',
            href: '/contact',
        },
    ],
};

/**
 * PricingTeaser — Positivus pricing block. Three chunky bordered
 * cards with offset shadows. The featured tier inverts to a lime
 * background; the others stay paper. Each card carries an oversized
 * price + a checked feature list + a black-pill CTA.
 */
export default function PricingTeaser({ data = {} }: { data?: BlendwitPricingTeaserData }) {
    const d = { ...DEFAULTS, ...data, tiers: data?.tiers ?? DEFAULTS.tiers };
    if (!d.tiers.length) return null;

    return (
        <section
            data-section-id="pricing"
            data-section-type="PricingTeaser"
            className="vv-section"
        >
            <div className="vv-container">
                {(d.title || d.subtitle) && (
                    <header
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 32,
                            flexWrap: 'wrap',
                            marginBottom: 56,
                        }}
                    >
                        {d.title && (
                            <h2 className="vv-section-tag" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                        {d.subtitle && (
                            <p style={{ flex: 1, minWidth: 280, fontSize: 18, lineHeight: 1.5, color: 'var(--vv-ink)' }}>
                                {d.subtitle}
                            </p>
                        )}
                    </header>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 32,
                        alignItems: 'stretch',
                    }}
                >
                    {d.tiers.map((t, i) => {
                        const featured = !!t.featured;
                        return (
                            <article
                                key={i}
                                className={featured ? 'vv-card vv-card-lime' : 'vv-card'}
                                style={{
                                    padding: 40,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        fontFamily: 'var(--vv-font-display)',
                                        fontSize: 22,
                                        fontWeight: 600,
                                        background: featured ? 'var(--vv-paper)' : 'var(--vv-lime)',
                                        color: 'var(--vv-ink)',
                                        padding: '4px 10px',
                                        marginBottom: 16,
                                        alignSelf: 'flex-start',
                                    }}
                                >
                                    {t.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
                                    <span
                                        style={{
                                            fontFamily: 'var(--vv-font-display)',
                                            fontSize: 56,
                                            fontWeight: 600,
                                            lineHeight: 1,
                                            color: 'var(--vv-ink)',
                                        }}
                                    >
                                        {t.price}
                                    </span>
                                    {t.period && (
                                        <span style={{ fontSize: 16, color: 'var(--vv-ink)', marginLeft: 6 }}>{t.period}</span>
                                    )}
                                </div>
                                {t.description && (
                                    <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--vv-ink)', marginBottom: 24, opacity: 0.8 }}>
                                        {t.description}
                                    </p>
                                )}
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                                    {(t.features || []).map((f, j) => (
                                        <li key={j} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--vv-ink)' }}>
                                            <span aria-hidden="true" style={{ fontWeight: 700 }}>✓</span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                {t.cta && t.href && (
                                    <a
                                        href={t.href}
                                        className="vv-btn vv-btn-primary"
                                        style={featured ? { background: 'var(--vv-ink)', color: 'var(--vv-ink-on-dark)' } : undefined}
                                    >
                                        {t.cta}
                                    </a>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
