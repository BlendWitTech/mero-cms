export interface BlendwitFinalCTAData {
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
}

const DEFAULTS: Required<BlendwitFinalCTAData> = {
    title: 'Let’s make things happen',
    subtitle:
        'Contact us today to learn more about how our digital marketing services can help your business grow online.',
    primaryCta: 'Get your free proposal',
    primaryHref: '/contact',
};

/**
 * FinalCTA — Positivus closing card. A dark, rounded, oversized panel
 * sitting one container-wide with a left text column + a right
 * decorative cluster (lime star + black scribble shape). Everything
 * is rendered in CSS — no asset request just for ambience.
 */
export default function FinalCTA({ data = {} }: { data?: BlendwitFinalCTAData }) {
    const d = { ...DEFAULTS, ...data };
    return (
        <section
            data-section-id="cta"
            data-section-type="FinalCTA"
            className="vv-section"
        >
            <div className="vv-container">
                <div
                    style={{
                        background: 'var(--vv-grey-tint)',
                        borderRadius: 'var(--vv-radius-card)',
                        padding: 'clamp(40px, 6vw, 80px)',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                        gap: 32,
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div>
                        {d.title && (
                            <h2
                                className="vv-headline"
                                data-editable="title"
                                style={{ fontSize: 'clamp(32px, 4vw, 56px)', marginBottom: 20, fontWeight: 500 }}
                            >
                                {d.title}
                            </h2>
                        )}
                        {d.subtitle && (
                            <p
                                data-editable="subtitle"
                                style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--vv-ink)', marginBottom: 28, maxWidth: '52ch' }}
                            >
                                {d.subtitle}
                            </p>
                        )}
                        {d.primaryCta && (
                            <a href={d.primaryHref} className="vv-btn vv-btn-primary">
                                <span data-editable="primaryCta">{d.primaryCta}</span>
                            </a>
                        )}
                    </div>
                    {/* Decorative right-hand cluster — pure CSS, no asset.
                        A black "globe" disc with a lime star floating
                        top-right. Mirrors the placeholder in the Hero so
                        the page reads as a coherent visual system. */}
                    <div aria-hidden="true" style={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
                        <div
                            style={{
                                width: 180,
                                aspectRatio: '1',
                                borderRadius: '50%',
                                background: 'var(--vv-ink)',
                                position: 'relative',
                            }}
                        >
                            <div className="vv-star" style={{ position: 'absolute', top: -28, right: -28, width: 80, height: 80 }} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
