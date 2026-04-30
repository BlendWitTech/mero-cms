export interface BlendwitTestimonialCard {
    quote?: string;
    name?: string;
    role?: string;
}

export interface BlendwitTestimonialsData {
    eyebrow?: string;
    title?: string;
    description?: string;
    testimonials?: BlendwitTestimonialCard[];
}

const DEFAULTS: Required<BlendwitTestimonialsData> = {
    eyebrow: '',
    title: 'Testimonials',
    description: 'Hear from our happy clients about their experience working with us.',
    testimonials: [
        {
            quote: 'We saw 3x revenue growth in the first quarter. The team here actually moves at the pace we needed.',
            name: 'John Smith',
            role: 'Marketing Director, XYZ Corp',
        },
        {
            quote: 'Replaced two retainers with one. Faster turnaround, better creative, no committee approvals.',
            name: 'Maria Lopez',
            role: 'Founder, Nimble Studio',
        },
        {
            quote: 'Honestly the most fun engagement we’ve had in years. Real partners, real outcomes.',
            name: 'Devesh Patel',
            role: 'COO, Atlas Logistics',
        },
    ],
};

/**
 * Testimonials — Positivus dark band. Three quote cards laid horizontally,
 * each with a chunky lime-bordered speech-bubble shape in pure CSS
 * (no SVG asset). Authors swap names + quotes via the inspector;
 * everything else (background, typography rhythm, the bottom triangle
 * "tail" on each bubble) is design-locked.
 */
export default function Testimonials({ data = {} }: { data?: BlendwitTestimonialsData }) {
    const d = { ...DEFAULTS, ...data, testimonials: data?.testimonials ?? DEFAULTS.testimonials };
    if (!d.testimonials.length) return null;

    return (
        <section
            data-section-id="testimonials"
            data-section-type="Testimonials"
            className="vv-section vv-surface-dark"
            style={{ borderRadius: 'var(--vv-radius-card)' }}
        >
            <div className="vv-container">
                {(d.title || d.description) && (
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
                        {d.description && (
                            <p style={{ flex: 1, minWidth: 280, fontSize: 18, lineHeight: 1.5, color: 'var(--vv-ink-on-dark)' }}>
                                {d.description}
                            </p>
                        )}
                    </header>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 32,
                    }}
                >
                    {d.testimonials.map((t, i) => (
                        <article
                            key={i}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--vv-lime)',
                                borderRadius: 45,
                                padding: '40px 36px',
                                color: 'var(--vv-ink-on-dark)',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                            }}
                        >
                            {t.quote && (
                                <p
                                    style={{
                                        fontSize: 16,
                                        lineHeight: 1.6,
                                        margin: '0 0 28px',
                                        flex: 1,
                                    }}
                                >
                                    “{t.quote}”
                                </p>
                            )}
                            {(t.name || t.role) && (
                                <div style={{ marginTop: 'auto' }}>
                                    {t.name && (
                                        <div style={{ color: 'var(--vv-lime)', fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
                                            {t.name}
                                        </div>
                                    )}
                                    {t.role && (
                                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                                            {t.role}
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
