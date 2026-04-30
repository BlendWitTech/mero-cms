import Image from 'next/image';
import Button from '@/components/ui/Button';
import DashboardMockup from '@/components/sections/DashboardMockup';

/** Three Hero design presets the editor can flip between without
    touching field-level content. Each variant is a different layout —
    same data, different presentation. Editors pick from a chip
    selector in the SectionEditor. */
export type HeroVariant = 'split' | 'centered' | 'minimal';

export interface HeroData {
    /** Which design variant to render. Defaults to 'split' (the
        signature two-column hero). New variants can be added without
        touching existing pages — they all read the same fields. */
    _variant?: HeroVariant;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
    secondaryCta?: string;
    secondaryHref?: string;
    trustText?: string;
    /** Character / illustration. Editable via SectionEditor's media
        picker; falls back to the bundled Mero character. */
    heroImage?: string;
    /** Decorative emblem watermark behind the character. Set to ''
        or 'none' to hide. */
    emblemImage?: string;
    /** Built-in admin dashboard mockup shown tilted behind the
        character (split variant only). One of:
          'overview'  — KPI cards + analytics chart
          'pages'     — content list with status badges
          'analytics' — large chart + breakdown table
          'none'      — hide the mockup entirely
        Authored from the Inspector's design picker. Defaults to
        'overview'. The mockup is purely decorative — alt text omitted
        and aria-hidden so it doesn't compete with the headline. */
    dashboardVariant?: 'overview' | 'pages' | 'analytics' | 'none';
    /** Optional custom dashboard screenshot. When set (and
        dashboardVariant !== 'none'), this image is rendered instead of
        the built-in mockup. Use it to show your customer's actual app
        in the hero when their product looks more interesting than a
        generic admin UI. */
    dashboardImage?: string;
}

const DEFAULTS: Required<HeroData> = {
    _variant: 'split',
    eyebrow: 'v1.5 just shipped — visual editor in beta',
    title: 'The CMS your team actually wants to use.',
    subtitle:
        'Mero CMS is the motion-first content platform for teams that treat content as a product. Visual editor, AI Studio, eight-tier capability matrix — all from one admin you’d recommend to a friend.',
    primaryCta: 'Start free →',
    primaryHref: '/signup',
    secondaryCta: 'Book a demo',
    secondaryHref: '/contact',
    trustText: '4.9 / 5 · 600+ teams shipping with Mero CMS',
    heroImage: '/character-hero.svg',
    emblemImage: '/emblem.svg',
    dashboardVariant: 'overview',
    dashboardImage: '',
};

/** Headline rendering helper — splits on the literal word "actually"
    and italicises that token in serif for the brand-accent feel.
    Falls through to plain text when the word isn't present. */
function renderHeadline(title: string) {
    const parts = title.split(/\b(actually)\b/i);
    return parts.map((part, i) =>
        part.toLowerCase() === 'actually' ? (
            <span key={i} className="serif-em" style={{ color: 'var(--brand)' }}>
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        ),
    );
}

/**
 * Hero — first impression. Three design variants share the same data
 * shape so authors can flip between them without re-entering content:
 *
 *   - 'split'    (default) — signature two-column layout with character
 *                            on right, dashboard mockup tilted behind,
 *                            emblem watermark. The original Mero hero.
 *   - 'centered' — single-column, everything centered, hero illustration
 *                  sits below the CTAs as a wide visual.
 *   - 'minimal'  — text-only, no illustration, generous breathing room.
 *                  For pages where the message is the design.
 *
 * The variant is stored on `data._variant` (the editor's convention for
 * non-content metadata) so editors can swap layouts without losing copy.
 */
export default function Hero({ data = {} }: { data?: HeroData }) {
    // Custom merge for image fields: an empty string in `data` (set by
    // the SectionEditor when the user clicks the "clear" button on an
    // image picker) is treated the same as a missing field and falls
    // back to DEFAULTS. This way the Hero never renders a broken/empty
    // image slot — clearing requires explicitly setting `heroImage` to
    // 'none', mirroring the emblem's hide-pattern. Plain spread
    // (`{ ...DEFAULTS, ...data }`) would let '' override the defaults
    // and produce a blank Hero, which is what users were reporting.
    const d: Required<HeroData> = {
        ...DEFAULTS,
        ...data,
        heroImage:   data?.heroImage   || DEFAULTS.heroImage,
        emblemImage: data?.emblemImage || DEFAULTS.emblemImage,
    } as Required<HeroData>;

    const variant = d._variant ?? 'split';

    if (variant === 'centered') return <HeroCentered d={d} />;
    if (variant === 'minimal')  return <HeroMinimal d={d} />;
    return <HeroSplit d={d} />;
}

// ─── Variant: split (default) ────────────────────────────────────────

function HeroSplit({ d }: { d: Required<HeroData> }) {
    return (
        <section
            data-section-id="hero"
            data-section-type="Hero"
            data-variant="split"
            className="hero"
        >
            <div className="container hero-grid">
                <div>
                    <span className="hero-eyebrow">
                        <span className="hero-eyebrow-dot" />
                        {d.eyebrow}
                    </span>
                    <h1 className="display">{renderHeadline(d.title)}</h1>
                    <p className="hero-sub">{d.subtitle}</p>
                    <div className="hero-ctas">
                        {d.primaryCta && (
                            <Button href={d.primaryHref} variant="brand" size="lg">
                                {d.primaryCta}
                            </Button>
                        )}
                        {d.secondaryCta && (
                            <Button href={d.secondaryHref} variant="light" size="lg">
                                {d.secondaryCta}
                            </Button>
                        )}
                    </div>
                    {d.trustText && (
                        <div className="hero-trust">
                            <span className="hero-trust-stars">★★★★★</span>
                            <span>{d.trustText}</span>
                        </div>
                    )}
                </div>

                <div className="hero-visual">
                    <div className="hero-halo" aria-hidden="true" />
                    {d.emblemImage && d.emblemImage !== 'none' && (
                        <div className="hero-emblem-bg" aria-hidden="true">
                            <Image
                                src={d.emblemImage}
                                alt=""
                                width={247}
                                height={300}
                                unoptimized
                                style={{ width: '95%', height: 'auto', opacity: 0.07 }}
                            />
                        </div>
                    )}
                    {d.dashboardVariant !== 'none' && (
                        <div className="hero-dashboard-wrap" aria-hidden="true">
                            {d.dashboardImage ? (
                                // Custom screenshot wins over the built-in
                                // mockup so customers can swap in their
                                // actual product UI without forking the
                                // theme.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={d.dashboardImage}
                                    alt=""
                                    style={{ width: '100%', height: 'auto', borderRadius: 12 }}
                                />
                            ) : (
                                <DashboardMockup variant={d.dashboardVariant} />
                            )}
                        </div>
                    )}
                    {d.heroImage && (
                        <div className="hero-mockup">
                            <Image
                                src={d.heroImage}
                                alt=""
                                width={282}
                                height={300}
                                unoptimized
                                className="hero-character"
                                draggable={false}
                                priority
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ─── Variant: centered ───────────────────────────────────────────────

function HeroCentered({ d }: { d: Required<HeroData> }) {
    return (
        <section
            data-section-id="hero"
            data-section-type="Hero"
            data-variant="centered"
            className="hero hero-centered"
            style={{
                paddingTop: 'clamp(96px, 12vw, 160px)',
                paddingBottom: 'clamp(64px, 8vw, 120px)',
                textAlign: 'center',
            }}
        >
            <div className="container" style={{ maxWidth: 880 }}>
                {d.eyebrow && (
                    <span
                        className="hero-eyebrow"
                        style={{ marginInline: 'auto', display: 'inline-flex' }}
                    >
                        <span className="hero-eyebrow-dot" />
                        {d.eyebrow}
                    </span>
                )}
                <h1 className="display" style={{ marginTop: 16, marginBottom: 16 }}>
                    {renderHeadline(d.title)}
                </h1>
                {d.subtitle && (
                    <p
                        className="hero-sub"
                        style={{ maxWidth: 640, margin: '0 auto 24px' }}
                    >
                        {d.subtitle}
                    </p>
                )}
                {(d.primaryCta || d.secondaryCta) && (
                    <div
                        className="hero-ctas"
                        style={{ justifyContent: 'center', marginBottom: 32 }}
                    >
                        {d.primaryCta && (
                            <Button href={d.primaryHref} variant="brand" size="lg">
                                {d.primaryCta}
                            </Button>
                        )}
                        {d.secondaryCta && (
                            <Button href={d.secondaryHref} variant="light" size="lg">
                                {d.secondaryCta}
                            </Button>
                        )}
                    </div>
                )}
                {d.trustText && (
                    <div
                        className="hero-trust"
                        style={{ justifyContent: 'center', marginBottom: 48 }}
                    >
                        <span className="hero-trust-stars">★★★★★</span>
                        <span>{d.trustText}</span>
                    </div>
                )}

                {/* Hero illustration — wide, sits below the copy. The
                    centered variant deliberately doesn't show the
                    dashboard mockup behind it; the visual is the
                    illustration alone for cleaner focus. */}
                {d.heroImage && (
                    <div
                        style={{
                            position: 'relative',
                            margin: '0 auto',
                            maxWidth: 720,
                        }}
                    >
                        {d.emblemImage && d.emblemImage !== 'none' && (
                            <Image
                                src={d.emblemImage}
                                alt=""
                                width={500}
                                height={500}
                                unoptimized
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '120%',
                                    height: 'auto',
                                    opacity: 0.05,
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                        <Image
                            src={d.heroImage}
                            alt=""
                            width={720}
                            height={420}
                            unoptimized
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                position: 'relative',
                            }}
                            priority
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

// ─── Variant: minimal ────────────────────────────────────────────────

function HeroMinimal({ d }: { d: Required<HeroData> }) {
    return (
        <section
            data-section-id="hero"
            data-section-type="Hero"
            data-variant="minimal"
            className="hero hero-minimal"
            style={{
                paddingTop: 'clamp(120px, 14vw, 200px)',
                paddingBottom: 'clamp(80px, 10vw, 140px)',
                background: 'var(--paper)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle emblem in the background corner — gives the page
                a brand anchor without an illustration. */}
            {d.emblemImage && d.emblemImage !== 'none' && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 480,
                        height: 480,
                        opacity: 0.04,
                        pointerEvents: 'none',
                    }}
                >
                    <Image
                        src={d.emblemImage}
                        alt=""
                        width={480}
                        height={480}
                        unoptimized
                        style={{ width: '100%', height: 'auto' }}
                    />
                </div>
            )}

            <div
                className="container"
                style={{
                    maxWidth: 880,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {d.eyebrow && (
                    <span className="hero-eyebrow" style={{ marginBottom: 24 }}>
                        <span className="hero-eyebrow-dot" />
                        {d.eyebrow}
                    </span>
                )}
                <h1
                    className="display"
                    style={{
                        fontSize: 'clamp(40px, 6vw, 88px)',
                        lineHeight: 1.05,
                        marginTop: d.eyebrow ? 24 : 0,
                        marginBottom: 24,
                    }}
                >
                    {renderHeadline(d.title)}
                </h1>
                {d.subtitle && (
                    <p
                        className="hero-sub"
                        style={{ maxWidth: 640, marginBottom: 32 }}
                    >
                        {d.subtitle}
                    </p>
                )}
                {(d.primaryCta || d.secondaryCta) && (
                    <div className="hero-ctas">
                        {d.primaryCta && (
                            <Button href={d.primaryHref} variant="brand" size="lg">
                                {d.primaryCta}
                            </Button>
                        )}
                        {d.secondaryCta && (
                            <Button href={d.secondaryHref} variant="light" size="lg">
                                {d.secondaryCta}
                            </Button>
                        )}
                    </div>
                )}
                {d.trustText && (
                    <div className="hero-trust" style={{ marginTop: 24 }}>
                        <span className="hero-trust-stars">★★★★★</span>
                        <span>{d.trustText}</span>
                    </div>
                )}
            </div>
        </section>
    );
}
