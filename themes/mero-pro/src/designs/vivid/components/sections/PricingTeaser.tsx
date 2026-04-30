export interface BlendwitPricingTier {
    name?: string;
    price?: string;
    period?: string;
    description?: string;
    features?: string[];
    cta?: string;
    href?: string;
    /** When true, the tier renders inverted on the deep navy with the
        yellow CTA. Use sparingly — at most one tier per row. */
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
    title: 'Choose Your Plan',
    subtitle:
        'Whether you want to get organised, keep your personal life on track or boost workplace productivity, Blendwit has the right plan for you.',
    tiers: [
        {
            name: 'Free',
            price: '$0',
            period: '',
            description: 'Capture ideas and find them quickly.',
            features: [
                'Sync unlimited devices',
                '10 GB monthly uploads',
                '200 MB max. note size',
                'Customise Home dashboard and access extra widgets',
                'Connect primary Google Calendar account',
                'Add due dates, reminders, and notifications to your tasks',
            ],
            cta: 'Get Started',
            href: '/signup',
        },
        {
            name: 'Personal',
            price: '$11.99',
            period: ' / mo',
            description: 'Keep home and family on track.',
            features: [
                'Sync unlimited devices',
                '10 GB monthly uploads',
                '200 MB max. note size',
                'Customise Home dashboard and access extra widgets',
                'Connect primary Google Calendar account',
                'Add due dates, reminders, and notifications to your tasks',
            ],
            cta: 'Get Started',
            href: '/signup?plan=personal',
            featured: true,
        },
        {
            name: 'Organization',
            price: '$49.99',
            period: ' / mo',
            description: 'Bring your team’s work together in one place.',
            features: [
                'Sync unlimited devices',
                '10 GB monthly uploads',
                '200 MB max. note size',
                'Customise Home dashboard and access extra widgets',
                'Connect primary Google Calendar account',
                'Add due dates, reminders, and notifications to your tasks',
            ],
            cta: 'Get Started',
            href: '/signup?plan=org',
        },
    ],
};

/**
 * PricingTeaser — Whitepace pricing block. Three tier cards, the
 * middle one inverted on deep navy as the featured choice. Each card
 * carries name + price + description + a checked feature list + CTA.
 *
 * Distinct from the bundled Pro PricingTable widget — that's a long-
 * form comparison page; this one is a teaser meant to live above the
 * fold of the home or pricing page.
 */
export default function PricingTeaser({ data = {} }: { data?: BlendwitPricingTeaserData }) {
    const d = { ...DEFAULTS, ...data, tiers: data?.tiers ?? DEFAULTS.tiers };
    if (!d.tiers.length) return null;

    return (
        <section
            data-section-id="pricing"
            data-section-type="PricingTeaser"
            className="bw-section bw-surface-tint"
        >
            <div className="bw-container">
                {(d.eyebrow || d.title || d.subtitle) && (
                    <header style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
                        {d.eyebrow && (
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'var(--bw-blue)',
                                    marginBottom: 12,
                                }}
                            >
                                {d.eyebrow}
                            </div>
                        )}
                        {d.title && (
                            <h2 className="bw-headline" style={{ fontSize: 'clamp(32px, 4vw, 52px)', marginBottom: 16 }}>
                                {d.title}
                            </h2>
                        )}
                        {d.subtitle && (
                            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--bw-ink-3)' }}>{d.subtitle}</p>
                        )}
                    </header>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 24,
                        alignItems: 'stretch',
                    }}
                >
                    {d.tiers.map((t, i) => {
                        const featured = !!t.featured;
                        return (
                            <article
                                key={i}
                                style={{
                                    background: featured ? 'var(--bw-navy)' : '#ffffff',
                                    color: featured ? 'var(--bw-ink-on-navy)' : 'var(--bw-ink-2)',
                                    borderRadius: 'var(--bw-radius-lg)',
                                    padding: '32px 28px',
                                    boxShadow: featured ? '0 28px 56px rgba(4, 56, 115, 0.18)' : 'var(--bw-shadow-card)',
                                    transform: featured ? 'translateY(-12px)' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        color: featured ? 'var(--bw-yellow)' : 'var(--bw-blue)',
                                        marginBottom: 8,
                                    }}
                                >
                                    {t.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
                                    <span
                                        style={{
                                            fontFamily: 'var(--bw-font-display)',
                                            fontSize: 40,
                                            fontWeight: 700,
                                            color: featured ? 'var(--bw-ink-on-navy)' : 'var(--bw-ink-1)',
                                        }}
                                    >
                                        {t.price}
                                    </span>
                                    {t.period && (
                                        <span style={{ fontSize: 14, color: featured ? 'rgba(255,255,255,0.7)' : 'var(--bw-ink-3)', marginLeft: 4 }}>
                                            {t.period}
                                        </span>
                                    )}
                                </div>
                                {t.description && (
                                    <p
                                        style={{
                                            fontSize: 14,
                                            lineHeight: 1.55,
                                            color: featured ? 'rgba(255,255,255,0.8)' : 'var(--bw-ink-3)',
                                            marginBottom: 20,
                                        }}
                                    >
                                        {t.description}
                                    </p>
                                )}
                                {t.cta && t.href && (
                                    <a
                                        href={t.href}
                                        className={featured ? 'bw-btn bw-btn-primary' : 'bw-btn'}
                                        style={
                                            featured
                                                ? undefined
                                                : { background: 'var(--bw-navy)', color: 'var(--bw-ink-on-navy)' }
                                        }
                                    >
                                        {t.cta}
                                    </a>
                                )}
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: '24px 0 0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10,
                                        flex: 1,
                                    }}
                                >
                                    {(t.features || []).map((f, j) => (
                                        <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                                            <span aria-hidden="true" style={{ color: featured ? 'var(--bw-yellow)' : 'var(--bw-blue)', fontWeight: 700 }}>✓</span>
                                            <span style={{ color: featured ? 'rgba(255,255,255,0.85)' : 'var(--bw-ink-2)' }}>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
