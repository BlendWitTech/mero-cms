import SectionHeader from '@/components/ui/SectionHeader';
import DashboardMockup, { type DashboardVariant } from '@/components/sections/DashboardMockup';
import Image from 'next/image';
import Link from 'next/link';

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
    /** Which mockup to display in the visual column.
        - 'visual-editor': site-preview style with an "Edit headline" tooltip
        - 'ai-studio':     Mero CMS admin showing AI Studio
        - 'capability-matrix': Mero CMS admin showing the tier matrix */
    mockup: 'visual-editor' | DashboardVariant;
    /** Pastel color (var name) used as the blob backdrop behind the card. */
    blob: string;
}

export interface FeatureBlocksData {
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
            mockup: 'visual-editor',
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
            mockup: 'ai-studio',
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
            mockup: 'capability-matrix',
            blob: 'var(--pastel-pist)',
        },
    ],
};

/**
 * Three alternating feature rows. Odd rows have copy-on-left, even rows
 * have copy-on-right (via the .reversed modifier). Each row's visual
 * column shows either a Mero CMS dashboard mockup (DashboardMockup
 * variant) or a website-preview mockup (visual-editor variant).
 */
export default function FeatureBlocks({ data = {} }: { data?: FeatureBlocksData }) {
    const d = { ...DEFAULTS, ...data };
    const blocks = d.blocks?.length ? d.blocks : DEFAULTS.blocks;

    return (
        <section className="section" id="features" data-section-id="features">
            <div className="container">
                <SectionHeader
                    eyebrow={d.eyebrow}
                    title={d.title}
                    subtitle={d.subtitle}
                />

                {blocks.map((block, i) => (
                    <FeatureRow key={block.title} block={block} reversed={i % 2 === 1} />
                ))}
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
    const mockup  = block?.mockup;

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
                {/* Pastel blob backdrop removed — the dashboard card sits
                    cleanly on the page background now. */}
                <div className="feature-card">
                    {mockup === 'visual-editor' ? (
                        <VisualEditorMockup />
                    ) : (
                        <DashboardMockup variant={mockup} />
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Website-preview style mockup for the "Visual editor" feature row.
 * Shows the user's published site with an Edit-headline tooltip
 * overlaid — illustrates the click-to-edit experience.
 */
function VisualEditorMockup() {
    return (
        <>
            <div className="hd-chrome">
                <span className="hd-dot" style={{ background: '#ff5f57' }} />
                <span className="hd-dot" style={{ background: '#febc2e' }} />
                <span className="hd-dot" style={{ background: '#28c840' }} />
                <span className="hd-url">yoursite.com</span>
            </div>
            <div
                style={{
                    padding: 32,
                    height: 'calc(100% - 28px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 16,
                    position: 'relative',
                    background: '#fff',
                }}
            >
                <div
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 36,
                        lineHeight: 1,
                        letterSpacing: '-.02em',
                        color: 'var(--ink)',
                        textAlign: 'center',
                        maxWidth: '12ch',
                        outline: '2px dashed var(--brand)',
                        outlineOffset: 8,
                        padding: 4,
                    }}
                >
                    Where motion meets meaning.
                </div>
                <div
                    style={{
                        position: 'absolute',
                        top: 90,
                        right: 60,
                        background: 'var(--ink)',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 100,
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                    }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pastel-pist)' }} />
                    Edit headline
                </div>
                <p
                    style={{
                        color: 'var(--ink-3)',
                        fontSize: 14,
                        maxWidth: '30ch',
                        textAlign: 'center',
                        marginTop: 8,
                    }}
                >
                    A CMS that respects your designer’s typography decisions.
                </p>
                <button
                    style={{
                        background: 'var(--brand)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: 100,
                        fontWeight: 600,
                        fontSize: 13,
                        border: 'none',
                    }}
                >
                    Save & publish
                </button>
            </div>
        </>
    );
}

// Suppress unused-import warning in some lint configs
export type _img = typeof Image;
