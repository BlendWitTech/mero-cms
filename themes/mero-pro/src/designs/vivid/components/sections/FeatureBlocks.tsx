import Image from 'next/image';

export interface BlendwitFeatureBlock {
    eyebrow?: string;
    title?: string;
    body?: string;
    cta?: string;
    href?: string;
    image?: string;
    imageAlt?: string;
}

export interface BlendwitFeatureBlocksData {
    blocks?: BlendwitFeatureBlock[];
}

const DEFAULTS: Required<BlendwitFeatureBlocksData> = {
    blocks: [
        {
            eyebrow: 'Project Management',
            title: 'Images, Videos and More',
            body: 'Blendwit team Project Management feature provides an efficient way to plan, organise, and track your projects in one place — keeping everyone aligned without the meeting overhead.',
            cta: 'Get Started',
            href: '/features',
            image: '',
        },
        {
            eyebrow: 'Use as Extension',
            title: 'Add anywhere, instantly',
            body: 'Cut down on planning timeline and stay focused on what matters. Use Blendwit as your single source of truth across the tools you already love.',
            cta: 'Let’s go',
            href: '/features#extension',
            image: '',
        },
        {
            eyebrow: 'Customise it to your needs',
            title: 'Build the workflow your team needs',
            body: 'Customise to your specific needs to optimise the impact of your project. Standard templates available to all sizes of business.',
            cta: 'Try it now',
            href: '/features#custom',
            image: '',
        },
    ],
};

/**
 * FeatureBlocks — alternating two-column rows in the Whitepace mould.
 * Odd-indexed blocks flip the image to the left; even keep it on the
 * right. Each row is its own visually-distinct band so the page reads
 * as a downward scan of capabilities.
 *
 * Uses the surface-light → surface-tint → surface-light rhythm so the
 * eye has somewhere to rest between blocks.
 */
export default function FeatureBlocks({ data = {} }: { data?: BlendwitFeatureBlocksData }) {
    const d = { ...DEFAULTS, ...data, blocks: data?.blocks ?? DEFAULTS.blocks };
    if (!d.blocks.length) return null;

    return (
        <section
            data-section-id="features"
            data-section-type="FeatureBlocks"
            className="bw-section"
            style={{ background: 'var(--bw-paper)' }}
        >
            <div className="bw-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(48px, 7vw, 96px)' }}>
                    {d.blocks.map((b, i) => {
                        const reversed = i % 2 === 1;
                        return (
                            <article
                                key={i}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                                    gap: 'clamp(32px, 6vw, 80px)',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ order: reversed ? 2 : 1 }}>
                                    {b.eyebrow && (
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                                color: 'var(--bw-blue)',
                                                marginBottom: 12,
                                            }}
                                        >
                                            {b.eyebrow}
                                        </div>
                                    )}
                                    {b.title && (
                                        <h2
                                            className="bw-headline"
                                            style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', marginBottom: 16 }}
                                        >
                                            {b.title}
                                        </h2>
                                    )}
                                    {b.body && (
                                        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--bw-ink-3)', marginBottom: 24 }}>
                                            {b.body}
                                        </p>
                                    )}
                                    {b.cta && b.href && (
                                        <a href={b.href} className="bw-btn bw-btn-primary">
                                            {b.cta}
                                        </a>
                                    )}
                                </div>
                                <div
                                    style={{
                                        order: reversed ? 1 : 2,
                                        position: 'relative',
                                        aspectRatio: '4 / 3',
                                        borderRadius: 'var(--bw-radius-lg)',
                                        background: 'var(--bw-blue-tint)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {b.image ? (
                                        <Image
                                            src={b.image}
                                            alt={b.imageAlt || b.title || ''}
                                            fill
                                            unoptimized
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'grid',
                                                placeItems: 'center',
                                                color: 'rgba(4, 56, 115, 0.4)',
                                                fontSize: 13,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {b.eyebrow || 'Add an image'}
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
