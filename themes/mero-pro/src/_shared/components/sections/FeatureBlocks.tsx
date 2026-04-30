import SectionHeader from '../../components/ui/SectionHeader';
import Image from 'next/image';
import Link from 'next/link';
// DashboardMockup intentionally not in the shared package — it's a
// Mero-specific illustration showing the CMS admin and would feel
// out of place in a portfolio / storefront / agency theme. The shared
// FeatureBlocks renders the per-block `image` field instead. Themes
// that want richer visuals can pass a custom `image` URL on each
// block (it accepts /uploads/... or any absolute URL).

export interface FeatureBlock {
    eyebrow: string;
    title: string;
    /** Optional accent — text inside the title that should render in the
        Instrument Serif italic. If omitted, the second half of the title
        after a comma or period is auto-styled. */
    accent?: string;
    body: string;
    bullets: string[];
    ctaText: string;
    ctaHref: string;
    /** Image URL shown in the visual column. Accepts /uploads/... or
        any absolute URL. Empty → renders an empty placeholder card so
        the layout still holds. */
    image?: string;
    /** Optional alt text for the per-block image. */
    imageAlt?: string;
    /** Pastel color (var name) used as the blob backdrop behind the card. */
    blob: string;
}

/** Three FeatureBlocks design presets. Same fields, three layouts. */
export type FeatureBlocksVariant = 'alternating' | 'grid-3up' | 'iconed-list';

export interface FeatureBlocksData {
    /** Layout preset. 'alternating' (default) — copy/visual rows that
        flip sides. 'grid-3up' — three feature cards in a row. 'iconed-
        list' — vertical list with small icon + title + body. */
    _variant?: FeatureBlocksVariant;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    blocks?: FeatureBlock[];
}

const DEFAULTS: Required<FeatureBlocksData> = {
    eyebrow: 'The product',
    title: 'Built for the people who actually edit the site.',
    subtitle:
        'Three core systems, all from a single admin. Each one designed so the marketer doesn’t need a developer to ship.',
    blocks: [
        {
            eyebrow: 'Visual editor',
            title: 'Click. Edit. Publish. No PR required.',
            accent: 'No PR required.',
            body:
                'Hover over any block in your published site, click, and edit the copy in place. The change goes live in 90\u00a0ms with optimistic preview. No rebuild, no developer, no Slack thread asking who can change a headline.',
            bullets: [
                '90ms publish-to-live for copy edits',
                'Section variants swappable from the canvas',
                'Audit log every change, attributed by editor',
            ],
            ctaText: 'See how it works →',
            ctaHref: '/features#visual-editor',
            image: '',
            imageAlt: '',
            blob: 'var(--pastel-coral)',
        },
        {
            eyebrow: 'AI Studio',
            title: 'A draft for every blank page. Never staring.',
            accent: 'Never staring.',
            body:
                'Built-in presets for blog drafts, meta descriptions, alt text, and translations. Rate-limited per-tier, never trained on your content, every output editable inline before it touches production.',
            bullets: [
                '12 presets, scoped per content type',
                'Token usage visible per editor',
                'Outputs are drafts, never auto-published',
            ],
            ctaText: 'Explore AI Studio →',
            ctaHref: '/features#ai-studio',
            image: '',
            imageAlt: '',
            blob: 'var(--pastel-lav)',
        },
        {
            eyebrow: 'Capability matrix',
            title: 'Twelve features. Eight tiers. Zero confusion.',
            accent: 'Zero confusion.',
            body:
                'Every feature gates through a single capability matrix in code. Upgrade your customer’s tier and the right features turn on — no migrations, no reinstall, no support ticket.',
            bullets: [
                'One source of truth for pricing logic',
                'Tier swap is a license update, never a redeploy',
                'Downgrade-safe: features hide, content stays',
            ],
            ctaText: 'See the full matrix →',
            ctaHref: '/features#capability-matrix',
            image: '',
            imageAlt: '',
            blob: 'var(--pastel-pist)',
        },
    ],
};

/**
 * FeatureBlocks — three design presets, same data:
 *   - 'alternating' (default): rows flip copy/visual side per index.
 *   - 'grid-3up': three feature cards in a row, no per-block visual column.
 *   - 'iconed-list': vertical list with title + body, compact and dense.
 *
 * Authors flip variants in the SectionEditor without re-entering content.
 */
export default function FeatureBlocks({ data = {} }: { data?: FeatureBlocksData }) {
    const d = { ...DEFAULTS, ...data };
    const variant = d._variant ?? 'alternating';
    const blocks = d.blocks?.length ? d.blocks : DEFAULTS.blocks;

    if (variant === 'grid-3up')    return <FeatureBlocksGrid d={d} blocks={blocks} />;
    if (variant === 'iconed-list') return <FeatureBlocksList d={d} blocks={blocks} />;
    return <FeatureBlocksAlternating d={d} blocks={blocks} />;
}

// ─── Variant: alternating (default) ──────────────────────────────────

function FeatureBlocksAlternating({
    d, blocks,
}: { d: Required<FeatureBlocksData>; blocks: FeatureBlock[] }) {
    return (
        <section
            className="section"
            id="features"
            data-section-id="features"
            data-section-type="FeatureBlocks"
            data-variant="alternating"
        >
            <div className="container">
                <SectionHeader eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
                {blocks.map((block, i) => (
                    <FeatureRow key={block.title || i} block={block} reversed={i % 2 === 1} />
                ))}
            </div>
        </section>
    );
}

// ─── Variant: grid-3up ───────────────────────────────────────────────

function FeatureBlocksGrid({
    d, blocks,
}: { d: Required<FeatureBlocksData>; blocks: FeatureBlock[] }) {
    return (
        <section
            className="section"
            id="features"
            data-section-id="features"
            data-section-type="FeatureBlocks"
            data-variant="grid-3up"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                <SectionHeader eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
                <div
                    style={{
                        display: 'grid',
                        gap: 16,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        marginTop: 32,
                    }}
                >
                    {blocks.map((block, i) => {
                        const bullets = Array.isArray(block?.bullets) ? block.bullets : [];
                        return (
                            <article
                                key={block.title || i}
                                style={{
                                    background: '#fff',
                                    border: '1px solid var(--line, rgba(0,0,0,0.08))',
                                    borderRadius: 16,
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                {block.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={block.image}
                                        alt={block.imageAlt || ''}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '16/10',
                                            objectFit: 'cover',
                                            borderRadius: 8,
                                        }}
                                    />
                                )}
                                {block.eyebrow && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: 'var(--brand)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                        }}
                                    >
                                        {block.eyebrow}
                                    </div>
                                )}
                                {block.title && (
                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{block.title}</h3>
                                )}
                                {block.body && (
                                    <p style={{ color: 'var(--ink-3)', lineHeight: 1.55, fontSize: 14 }}>
                                        {block.body}
                                    </p>
                                )}
                                {bullets.length > 0 && (
                                    <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--ink-3)' }}>
                                        {bullets.map((b, j) => <li key={j}>{b}</li>)}
                                    </ul>
                                )}
                                {block.ctaText && (
                                    <Link
                                        href={block.ctaHref || '#'}
                                        style={{
                                            color: 'var(--brand)',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            marginTop: 'auto',
                                        }}
                                    >
                                        {block.ctaText} →
                                    </Link>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Variant: iconed-list ────────────────────────────────────────────

function FeatureBlocksList({
    d, blocks,
}: { d: Required<FeatureBlocksData>; blocks: FeatureBlock[] }) {
    return (
        <section
            className="section"
            id="features"
            data-section-id="features"
            data-section-type="FeatureBlocks"
            data-variant="iconed-list"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container" style={{ maxWidth: 760 }}>
                <SectionHeader eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
                    {blocks.map((block, i) => (
                        <div
                            key={block.title || i}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '64px 1fr',
                                gap: 20,
                                alignItems: 'start',
                                paddingBottom: 24,
                                borderBottom:
                                    i < blocks.length - 1 ? '1px solid var(--line, rgba(0,0,0,0.08))' : 'none',
                            }}
                        >
                            {/* Icon block — uses the per-block image as a small thumbnail
                                if set, or a numbered marker as fallback. */}
                            <div
                                aria-hidden="true"
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 12,
                                    background: 'var(--paper-2, #f1f4f8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                {block.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={block.image}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                )}
                            </div>
                            <div>
                                {block.eyebrow && (
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: 'var(--brand)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            marginBottom: 4,
                                        }}
                                    >
                                        {block.eyebrow}
                                    </div>
                                )}
                                {block.title && (
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                                        {block.title}
                                    </h3>
                                )}
                                {block.body && (
                                    <p style={{ color: 'var(--ink-3)', lineHeight: 1.6, fontSize: 14 }}>
                                        {block.body}
                                    </p>
                                )}
                                {block.ctaText && (
                                    <Link
                                        href={block.ctaHref || '#'}
                                        style={{
                                            display: 'inline-block',
                                            marginTop: 8,
                                            color: 'var(--brand)',
                                            fontWeight: 700,
                                            fontSize: 13,
                                        }}
                                    >
                                        {block.ctaText} →
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureRow({ block, reversed }: { block: FeatureBlock; reversed: boolean }) {
    // Defensive destructure — admin-authored data may omit any field
    // (especially when the seed schema doesn't perfectly match the
    // component's expected shape). Defaults keep the component
    // rendering a useful row instead of throwing on undefined.access.
    const eyebrow = block?.eyebrow || '';
    const title   = block?.title   || '';
    const accent  = block?.accent;
    const body    = block?.body    || '';
    const bullets = Array.isArray(block?.bullets) ? block.bullets : [];
    const ctaText = block?.ctaText || '';
    const ctaHref = block?.ctaHref || '#';

    // Render the title with the accent word/phrase italicised in serif.
    const titleNode = accent && title.includes(accent) ? (
        <>
            {title.replace(accent, '').trim()}{' '}
            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                {accent}
            </span>
        </>
    ) : (
        title
    );

    return (
        <div className={`feature-row reveal-stagger ${reversed ? 'reversed' : ''}`}>
            <div className="feature-content">
                {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
                {title && <h3 className="display">{titleNode}</h3>}
                {body && <p>{body}</p>}
                {bullets.length > 0 && (
                    <ul className="feature-bullets">
                        {bullets.map(b => (
                            <li key={b}>
                                <span className="check">✓</span>
                                {b}
                            </li>
                        ))}
                    </ul>
                )}
                {ctaText && (
                    <Link href={ctaHref} className="feature-link">
                        {ctaText}
                    </Link>
                )}
            </div>

            <div className="feature-visual">
                <div className="feature-card">
                    {block?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={block.image}
                            alt={block.imageAlt || ''}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 12,
                                display: 'block',
                            }}
                        />
                    ) : (
                        // No image authored — render a neutral placeholder
                        // so the row layout stays balanced. Editors who
                        // pick an image via the SectionEditor swap this
                        // out without touching the theme code.
                        <div
                            aria-hidden="true"
                            style={{
                                width: '100%',
                                height: '100%',
                                background:
                                    'linear-gradient(135deg, var(--paper, #f8f9fa) 0%, var(--paper-2, #eef2f6) 100%)',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--ink-3, #94a3b8)',
                                fontSize: 13,
                                fontStyle: 'italic',
                            }}
                        >
                            Add an image to this feature
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
