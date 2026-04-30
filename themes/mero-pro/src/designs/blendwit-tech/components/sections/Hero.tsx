import Image from 'next/image';

export interface BlendwitHeroData {
    /** Headline. Wrap a token in `*asterisks*` to apply the lime
        block highlight (e.g. `"Navigating the *digital* landscape"`).
        Multiple marks supported (unlike blendwit-tech, which only
        highlights the first). */
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
    /** Right-column illustration. Falls back to a stylised placeholder
        with the signature lime "star" + a black globe shape if not
        set, so the hero never collapses. */
    heroImage?: string;
    heroImageAlt?: string;
}

const DEFAULTS: Required<BlendwitHeroData> = {
    title: 'Navigating the *digital* landscape for success',
    subtitle:
        'Our digital marketing agency helps businesses grow and succeed online through a range of services including SEO, PPC, social media marketing, and content creation.',
    primaryCta: 'Book a consultation',
    primaryHref: '/contact',
    heroImage: '',
    heroImageAlt: 'Vivid hero illustration',
};

/** Lime-highlight parser supporting multiple `*token*` marks. */
function renderMarkedHeadline(title: string) {
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let key = 0;
    while (cursor < title.length) {
        const open = title.indexOf('*', cursor);
        if (open === -1) {
            parts.push(title.slice(cursor));
            break;
        }
        const close = title.indexOf('*', open + 1);
        if (close === -1) {
            parts.push(title.slice(cursor));
            break;
        }
        if (open > cursor) parts.push(title.slice(cursor, open));
        parts.push(<span key={key++} className="vv-mark">{title.slice(open + 1, close)}</span>);
        cursor = close + 1;
    }
    return parts;
}

/**
 * Hero — Positivus mould. Bold left text + right illustration on a
 * white canvas. The headline is the dominant visual element; CTA is
 * a chunky black-pill primary. No subtle gradients, no soft shadows —
 * everything is deliberately stamp-like.
 */
export default function Hero({ data = {} }: { data?: BlendwitHeroData }) {
    const d: Required<BlendwitHeroData> = {
        ...DEFAULTS,
        ...data,
        heroImage: data?.heroImage || DEFAULTS.heroImage,
    } as Required<BlendwitHeroData>;

    return (
        <section
            data-section-id="hero"
            data-section-type="Hero"
            className="vv-section"
        >
            <div className="vv-container">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
                        gap: 'clamp(32px, 5vw, 64px)',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <h1
                            className="vv-headline"
                            data-editable="title"
                            style={{
                                fontSize: 'clamp(44px, 6vw, 84px)',
                                marginBottom: 28,
                                fontWeight: 500,
                            }}
                        >
                            {renderMarkedHeadline(d.title)}
                        </h1>
                        <p
                            data-editable="subtitle"
                            style={{
                                fontSize: 18,
                                lineHeight: 1.55,
                                color: 'var(--vv-ink)',
                                maxWidth: '52ch',
                                marginBottom: 32,
                            }}
                        >
                            {d.subtitle}
                        </p>
                        {d.primaryCta && (
                            <a href={d.primaryHref} className="vv-btn vv-btn-primary">
                                <span data-editable="primaryCta">{d.primaryCta}</span>
                            </a>
                        )}
                    </div>

                    <div
                        style={{
                            position: 'relative',
                            aspectRatio: '4 / 4',
                            borderRadius: 'var(--vv-radius-tile)',
                            overflow: 'hidden',
                            background: 'transparent',
                        }}
                    >
                        {d.heroImage ? (
                            <Image
                                src={d.heroImage}
                                alt={d.heroImageAlt}
                                fill
                                unoptimized
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            // Pure-CSS placeholder: a black "globe" disc
                            // with a chunky lime star floating top-right.
                            // Reads as Positivus-ish without an asset.
                            <div
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        width: '60%',
                                        aspectRatio: '1',
                                        borderRadius: '50%',
                                        background: 'var(--vv-ink)',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-10%',
                                            right: '-15%',
                                            width: 90,
                                            height: 90,
                                        }}
                                        className="vv-star"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
