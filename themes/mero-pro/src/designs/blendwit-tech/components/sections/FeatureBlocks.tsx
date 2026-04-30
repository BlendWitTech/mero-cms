export interface BlendwitFeatureBlock {
    title?: string;
    body?: string;
    cta?: string;
    href?: string;
    /** Visual rotation: 'lime' / 'dark' / 'grey'. The default rotation
        is determined by the index, but authors can override per-block
        for emphasis. */
    tone?: 'lime' | 'dark' | 'grey';
}

export interface BlendwitFeatureBlocksData {
    eyebrow?: string;
    title?: string;
    description?: string;
    blocks?: BlendwitFeatureBlock[];
}

const DEFAULT_TONES: Array<NonNullable<BlendwitFeatureBlock['tone']>> = ['grey', 'lime', 'dark'];

const DEFAULTS: Required<BlendwitFeatureBlocksData> = {
    eyebrow: '',
    title: 'Services',
    description:
        'At our digital marketing agency, we offer a range of services to help businesses grow and succeed online. These services include:',
    blocks: [
        { title: 'Search engine optimization' },
        { title: 'Pay-per-click advertising' },
        { title: 'Social Media Marketing' },
        { title: 'Email Marketing' },
        { title: 'Content Creation' },
        { title: 'Analytics and Tracking' },
    ],
};

/**
 * FeatureBlocks — Positivus "services grid". Two-column grid of
 * chunky cards alternating across grey / lime / dark tones for visual
 * rhythm. Each card carries a hard-stamped offset shadow and a thick
 * "Learn more →" link in the bottom-left.
 *
 * Authors can override the tone per block via `tone: 'lime' | 'dark' |
 * 'grey'` if they want a specific card to pop; otherwise the
 * DEFAULT_TONES rotation drives the look automatically.
 */
export default function FeatureBlocks({ data = {} }: { data?: BlendwitFeatureBlocksData }) {
    const d = { ...DEFAULTS, ...data, blocks: data?.blocks ?? DEFAULTS.blocks };
    if (!d.blocks.length) return null;

    return (
        <section
            data-section-id="features"
            data-section-type="FeatureBlocks"
            className="vv-section"
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
                            <h2 className="vv-section-tag" data-editable="title" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                        {d.description && (
                            <p data-editable="description" style={{ flex: 1, minWidth: 280, fontSize: 18, lineHeight: 1.5, color: 'var(--vv-ink)' }}>
                                {d.description}
                            </p>
                        )}
                    </header>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: 40,
                    }}
                >
                    {d.blocks.map((b, i) => {
                        const tone = b.tone || DEFAULT_TONES[i % DEFAULT_TONES.length];
                        const cardClass =
                            tone === 'lime' ? 'vv-card vv-card-lime' :
                            tone === 'dark' ? 'vv-card vv-card-dark' :
                            'vv-card vv-card-grey';
                        const linkColor = tone === 'dark' ? 'var(--vv-ink-on-dark)' : 'var(--vv-ink)';
                        const titleBg   = tone === 'dark' ? 'var(--vv-paper)'     : 'var(--vv-lime)';
                        const titleColor= 'var(--vv-ink)';
                        return (
                            <article
                                key={i}
                                className={cardClass}
                                style={{
                                    minHeight: 310,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div>
                                    {b.title && (
                                        <h3
                                            style={{
                                                display: 'inline-block',
                                                fontFamily: 'var(--vv-font-display)',
                                                fontSize: 30,
                                                fontWeight: 500,
                                                lineHeight: 1.1,
                                                background: titleBg,
                                                color: titleColor,
                                                padding: '4px 8px',
                                                marginBottom: 12,
                                            }}
                                        >
                                            {b.title}
                                        </h3>
                                    )}
                                    {b.body && (
                                        <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 12, color: linkColor, opacity: 0.85 }}>
                                            {b.body}
                                        </p>
                                    )}
                                </div>
                                {b.cta && b.href && (
                                    <a
                                        href={b.href}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            color: linkColor,
                                            fontWeight: 600,
                                            fontSize: 16,
                                            textDecoration: 'none',
                                            marginTop: 32,
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: tone === 'dark' ? 'var(--vv-lime)' : 'var(--vv-ink)',
                                                color: tone === 'dark' ? 'var(--vv-ink)' : 'var(--vv-ink-on-dark)',
                                                display: 'grid',
                                                placeItems: 'center',
                                                fontSize: 18,
                                            }}
                                        >
                                            →
                                        </span>
                                        <span>{b.cta}</span>
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
