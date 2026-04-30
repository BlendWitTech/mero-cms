export interface LogoStripData {
    eyebrow?: string;
    /** Comma- OR newline-separated. URL → image, otherwise rendered as
        a typographic mark. The editor accepts both forms because
        marketing teams paste from spreadsheets (commas) or write
        line-by-line (newlines) and we shouldn't punish either. */
    logos?: string;
    /** Render mode. 'static' shows logos in a single centred row.
        'scroller' (the default) renders an infinite horizontal marquee —
        feels modern and handles long logo lists gracefully. */
    mode?: 'static' | 'scroller';
}

const DEFAULT_LOGOS = ['Blendwit', 'Nimble', 'Toolfolio', 'Northwind', 'Lenis', 'Jitter'];

/**
 * Calm white band of partner logos under the hero.
 *
 * - Each logo line is either a URL (rendered as <img>) or a brand name
 *   (rendered as a typographic mark in Bricolage Grotesque).
 * - Input accepts comma OR newline as a separator so authors can paste
 *   "Blendwit, Nimble, Toolfolio" or write each on its own line.
 * - Default `mode: 'scroller'` renders an infinite marquee for that
 *   modern "logos crawling sideways" effect. Authors can flip to
 *   `static` for a centred non-moving row.
 *
 * Falls back to DEFAULT_LOGOS when no data is authored — the strip
 * stays interesting even on a fresh install.
 */
export default function LogoStrip({ data = {} }: { data?: LogoStripData }) {
    // Split on either commas or newlines (or both). This is the simplest
    // way to be lenient without confusing the parser — no escape syntax,
    // no quoting, just two natural separators.
    const list = (data.logos || '')
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);
    const logos = list.length ? list : DEFAULT_LOGOS;
    const eyebrow = data.eyebrow || 'Trusted by teams shipping content with motion';
    const mode = data.mode || 'scroller';

    if (mode === 'static') {
        return (
            <section data-section-id="logos" className="logos">
                <div className="container">
                    <div className="logos-eyebrow">{eyebrow}</div>
                    <div className="logos-row">
                        {logos.map((logo, i) => (
                            <LogoItem key={i} logo={logo} />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Scroller mode — duplicate the list so the marquee loops seamlessly.
    // The CSS animation translates the inner track by 50% (one full copy
    // width) so the second copy slides into where the first one was, and
    // the keyframe loops without a visible jump.
    const doubled = [...logos, ...logos];

    return (
        <section data-section-id="logos" className="logos logos-scroller">
            <div className="container">
                <div className="logos-eyebrow">{eyebrow}</div>
            </div>
            <div className="logos-marquee" aria-hidden={false}>
                {/* Edge fade masks — soft fade-out at left/right edges so
                    logos appear/disappear gracefully instead of clipping. */}
                <div className="logos-fade logos-fade-left" />
                <div className="logos-fade logos-fade-right" />
                <div className="logos-track">
                    {doubled.map((logo, i) => (
                        <LogoItem key={i} logo={logo} />
                    ))}
                </div>
            </div>
            <style>{`
                .logos-scroller .logos-marquee {
                    position: relative;
                    overflow: hidden;
                    padding: 12px 0;
                }
                .logos-scroller .logos-track {
                    display: flex;
                    align-items: center;
                    gap: 56px;
                    width: max-content;
                    animation: mero-logos-marquee 32s linear infinite;
                    will-change: transform;
                }
                .logos-scroller .logos-marquee:hover .logos-track {
                    animation-play-state: paused;
                }
                .logos-scroller .logos-fade {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 80px;
                    pointer-events: none;
                    z-index: 2;
                }
                .logos-scroller .logos-fade-left {
                    left: 0;
                    background: linear-gradient(to right, var(--paper, #fff), transparent);
                }
                .logos-scroller .logos-fade-right {
                    right: 0;
                    background: linear-gradient(to left, var(--paper, #fff), transparent);
                }
                @keyframes mero-logos-marquee {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .logos-scroller .logos-track { animation: none; }
                }
            `}</style>
        </section>
    );
}

/** A single logo entry — auto-detects URL vs brand name. */
function LogoItem({ logo }: { logo: string }) {
    if (/^https?:\/\//i.test(logo) || logo.startsWith('/')) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            // height fixed at 28px; width:auto preserves aspect ratio
            // (Next.js logs a warning when only one dimension is set).
            <img
                src={logo}
                alt=""
                style={{
                    height: 28,
                    width: 'auto',
                    display: 'block',
                    flex: '0 0 auto',
                    opacity: 0.75,
                }}
            />
        );
    }
    return (
        <div className="logo-item" style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
            {logo}
        </div>
    );
}
