import Image from 'next/image';

export interface BlendwitHeroData {
    eyebrow?: string;
    /** The headline. Wrap a single token in `*asterisks*` to highlight
        it with the signature Whitepace yellow underline (e.g.
        `"Get More Done with *Blendwit*"`). One mark per headline reads
        cleanest — the parser only highlights the first match. */
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
    secondaryCta?: string;
    secondaryHref?: string;
    /** Right-column hero illustration. If empty, a soft blue placeholder
        renders so the layout doesn't collapse. */
    heroImage?: string;
    heroImageAlt?: string;
}

const DEFAULTS: Required<BlendwitHeroData> = {
    eyebrow: '',
    title: 'Get More Done with *Blendwit*',
    subtitle:
        'Project management software that lets you fast-track your projects, track progress, and collaborate without the busy-work.',
    primaryCta: 'Try Blendwit free',
    primaryHref: '/signup',
    secondaryCta: 'View pricing',
    secondaryHref: '/pricing',
    heroImage: '',
    heroImageAlt: 'Blendwit product illustration',
};

/** Tiny inline parser for the *highlight* token convention. Splits on
    the first `*…*` pair, returning [before, marked, after] as React
    nodes. Falls back to a single text node when no mark is present. */
function renderMarkedHeadline(title: string) {
    const idx = title.indexOf('*');
    if (idx === -1) return title;
    const close = title.indexOf('*', idx + 1);
    if (close === -1) return title;
    return (
        <>
            {title.slice(0, idx)}
            <span className="bw-mark">{title.slice(idx + 1, close)}</span>
            {title.slice(close + 1)}
        </>
    );
}

/**
 * Hero — Whitepace mould. Two-column layout on a deep-navy field:
 * eyebrow + headline + subtext + dual CTAs on the left, illustration
 * on the right. The heroImage falls back to a stylised placeholder
 * when not set so the section still has visual weight on a fresh
 * install. Editor markers (`data-editable`) cover every primitive
 * field so the visual editor can drive live in-iframe edits.
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
            className="bw-section bw-surface-navy"
            style={{ position: 'relative', overflow: 'hidden' }}
        >
            {/* Subtle topographic backdrop — the lines on the right of
                the Whitepace hero. Pure CSS so we don't add an SVG
                request just for ambience. */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 100% 20%, rgba(255, 255, 255, 0.04) 0, transparent 50%),' +
                        'radial-gradient(circle at 0% 80%, rgba(79, 156, 249, 0.08) 0, transparent 50%)',
                    pointerEvents: 'none',
                }}
            />
            <div className="bw-container" style={{ position: 'relative' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
                        gap: 'clamp(32px, 6vw, 80px)',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        {d.eyebrow && (
                            <div
                                data-editable="eyebrow"
                                style={{
                                    display: 'inline-block',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'var(--bw-yellow)',
                                    marginBottom: 16,
                                }}
                            >
                                {d.eyebrow}
                            </div>
                        )}
                        <h1
                            className="bw-headline"
                            data-editable="title"
                            style={{
                                fontSize: 'clamp(40px, 5.5vw, 72px)',
                                color: 'var(--bw-ink-on-navy)',
                                marginBottom: 20,
                            }}
                        >
                            {renderMarkedHeadline(d.title)}
                        </h1>
                        <p
                            data-editable="subtitle"
                            style={{
                                fontSize: 18,
                                lineHeight: 1.6,
                                color: 'rgba(255, 255, 255, 0.78)',
                                maxWidth: '52ch',
                                marginBottom: 32,
                            }}
                        >
                            {d.subtitle}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {d.primaryCta && (
                                <a href={d.primaryHref} className="bw-btn bw-btn-primary">
                                    <span data-editable="primaryCta">{d.primaryCta}</span>
                                    <span aria-hidden="true">→</span>
                                </a>
                            )}
                            {d.secondaryCta && (
                                <a href={d.secondaryHref} className="bw-btn bw-btn-ghost">
                                    <span data-editable="secondaryCta">{d.secondaryCta}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'relative',
                            aspectRatio: '4 / 3',
                            borderRadius: 'var(--bw-radius-lg)',
                            background: d.heroImage ? 'transparent' : 'var(--bw-blue-soft)',
                            overflow: 'hidden',
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
                            // Whitepace-style placeholder: blue panel with
                            // a tiny brand-yellow corner accent so it still
                            // feels intentional on a fresh install.
                            <div
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: 'rgba(4, 56, 115, 0.45)',
                                    fontFamily: 'var(--bw-font-body)',
                                    fontSize: 14,
                                    fontWeight: 600,
                                }}
                            >
                                Drop a hero illustration in the editor
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
