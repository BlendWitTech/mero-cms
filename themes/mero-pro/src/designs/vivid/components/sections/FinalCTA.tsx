export interface BlendwitFinalCTAData {
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
    /** Three small platform glyphs under the CTA (Apple / Windows / Android),
        rendered as ASCII-style svg badges so we don't add external icon
        deps. Disable by setting `showPlatforms: false`. */
    showPlatforms?: boolean;
}

const DEFAULTS: Required<BlendwitFinalCTAData> = {
    title: 'Try Blendwit today',
    subtitle: 'Get started for free. Add your whole team as your needs grow.',
    primaryCta: 'Try Blendwit free',
    primaryHref: '/signup',
    showPlatforms: true,
};

/**
 * FinalCTA — Whitepace-style navy band sitting between the page body
 * and the footer. Dense headline + subtext + a single yellow CTA, with
 * an optional row of small platform glyphs to suggest "available on
 * iOS, Windows, Android".
 */
export default function FinalCTA({ data = {} }: { data?: BlendwitFinalCTAData }) {
    const d = { ...DEFAULTS, ...data };
    return (
        <section
            data-section-id="cta"
            data-section-type="FinalCTA"
            className="bw-section bw-surface-navy"
        >
            <div className="bw-container" style={{ textAlign: 'center', maxWidth: 720 }}>
                {d.title && (
                    <h2
                        className="bw-headline"
                        data-editable="title"
                        style={{
                            fontSize: 'clamp(32px, 4vw, 52px)',
                            color: 'var(--bw-ink-on-navy)',
                            marginBottom: 16,
                        }}
                    >
                        {d.title}
                    </h2>
                )}
                {d.subtitle && (
                    <p
                        data-editable="subtitle"
                        style={{
                            fontSize: 16,
                            lineHeight: 1.65,
                            color: 'rgba(255, 255, 255, 0.78)',
                            marginBottom: 32,
                        }}
                    >
                        {d.subtitle}
                    </p>
                )}
                {d.primaryCta && (
                    <a href={d.primaryHref} className="bw-btn bw-btn-primary">
                        <span data-editable="primaryCta">{d.primaryCta}</span>
                        <span aria-hidden="true">→</span>
                    </a>
                )}
                {d.showPlatforms && (
                    <div
                        aria-hidden="true"
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 18,
                            marginTop: 32,
                            color: 'rgba(255, 255, 255, 0.55)',
                            fontSize: 22,
                        }}
                    >
                        <Glyph label="Apple" path="M16.36 13.5c0-2.6 2.13-3.85 2.23-3.91-1.22-1.78-3.12-2.03-3.79-2.05-1.61-.16-3.15.95-3.97.95-.83 0-2.09-.93-3.45-.9-1.77.03-3.41 1.03-4.32 2.62-1.86 3.22-.47 7.97 1.32 10.59.88 1.28 1.92 2.71 3.27 2.66 1.32-.05 1.81-.85 3.4-.85 1.59 0 2.04.85 3.45.83 1.43-.03 2.33-1.3 3.2-2.59 1.04-1.5 1.46-2.97 1.48-3.05-.03-.01-2.81-1.07-2.84-4.3M13.51 5.27c.7-.85 1.18-2.04 1.05-3.21-1.02.04-2.25.69-2.97 1.55-.65.75-1.21 1.94-1.06 3.1 1.13.09 2.29-.58 2.98-1.44" />
                        <Glyph label="Windows" path="M3 5l8.5-1.2v8.7H3zm9.5-1.3L23 2v10.5H12.5zM3 14.5h8.5V23L3 21.7zm9.5 0H23V22l-10.5-1.4z" />
                        <Glyph label="Android" path="M5 8.5C5 7.7 5.7 7 6.5 7S8 7.7 8 8.5v6c0 .8-.7 1.5-1.5 1.5S5 15.3 5 14.5zM18 7c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-6c0-.8-.7-1.5-1.5-1.5M9 17v3.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V17zm4 0v3.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V17zM9.4 5.5l-.8-1.4c-.1-.2 0-.4.2-.5s.4 0 .5.2l.8 1.5c1.1-.5 2.4-.5 3.6 0l.8-1.5c.1-.2.3-.3.5-.2s.3.3.2.5l-.8 1.4c1.6.9 2.6 2.6 2.6 4.5H6.8c0-1.9 1-3.6 2.6-4.5M11 7.5c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5m4 0c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5" />
                    </div>
                )}
            </div>
        </section>
    );
}

function Glyph({ label, path }: { label: string; path: string }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label={label}>
            <path d={path} fill="currentColor" />
        </svg>
    );
}
