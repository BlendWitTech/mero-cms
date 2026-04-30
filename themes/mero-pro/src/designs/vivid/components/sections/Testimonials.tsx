export interface BlendwitTestimonialCard {
    quote?: string;
    name?: string;
    role?: string;
    avatarUrl?: string;
}

export interface BlendwitTestimonialsData {
    eyebrow?: string;
    title?: string;
    testimonials?: BlendwitTestimonialCard[];
}

const DEFAULTS: Required<BlendwitTestimonialsData> = {
    eyebrow: '',
    title: 'What Our Clients Says',
    testimonials: [
        {
            quote: '“Blendwit cut our planning time in half. The shared workspace finally gave engineering and marketing one source of truth.”',
            name: 'Sherise Shaw',
            role: 'WCM',
        },
        {
            quote: '“We replaced three tools with Blendwit and our delivery cadence got faster, not slower.”',
            name: 'Sherise Shaw',
            role: 'WCM',
        },
        {
            quote: '“The customer support team understood what we needed and shipped it the same week. Worth the switch.”',
            name: 'Sherise Shaw',
            role: 'WCM',
        },
    ],
};

/**
 * Testimonials — Whitepace strip of three customer-quote cards in
 * pale blue with avatar + name + role at the bottom of each card.
 * Renders inside a white surface so the blue cards pop.
 */
export default function Testimonials({ data = {} }: { data?: BlendwitTestimonialsData }) {
    const d = { ...DEFAULTS, ...data, testimonials: data?.testimonials ?? DEFAULTS.testimonials };
    if (!d.testimonials.length) return null;

    return (
        <section
            data-section-id="testimonials"
            data-section-type="Testimonials"
            className="bw-section"
            style={{ background: '#ffffff' }}
        >
            <div className="bw-container">
                {(d.eyebrow || d.title) && (
                    <header style={{ textAlign: 'center', marginBottom: 48 }}>
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
                            <h2
                                className="bw-headline"
                                style={{ fontSize: 'clamp(28px, 3.4vw, 44px)' }}
                            >
                                {d.title}
                            </h2>
                        )}
                    </header>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 20,
                    }}
                >
                    {d.testimonials.map((t, i) => (
                        <article
                            key={i}
                            style={{
                                background: 'var(--bw-blue-tint)',
                                borderRadius: 'var(--bw-radius-lg)',
                                padding: '28px 24px',
                                color: 'var(--bw-ink-2)',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <span aria-hidden="true" style={{ fontSize: 36, lineHeight: 1, color: 'var(--bw-blue)' }}>“</span>
                            {t.quote && (
                                <p
                                    style={{
                                        fontSize: 16,
                                        lineHeight: 1.55,
                                        margin: '4px 0 24px',
                                        color: 'var(--bw-ink-2)',
                                        flex: 1,
                                    }}
                                >
                                    {t.quote.replace(/^["“]|["”]$/g, '')}
                                </p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: t.avatarUrl
                                            ? `url(${t.avatarUrl}) center/cover`
                                            : 'var(--bw-blue)',
                                        flex: 'none',
                                    }}
                                    aria-hidden="true"
                                />
                                <div>
                                    {t.name && (
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bw-ink-1)' }}>{t.name}</div>
                                    )}
                                    {t.role && (
                                        <div style={{ fontSize: 12, color: 'var(--bw-ink-3)' }}>{t.role}</div>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
