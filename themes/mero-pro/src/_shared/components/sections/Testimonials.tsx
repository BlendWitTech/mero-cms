import SectionHeader from '../../components/ui/SectionHeader';

/** Three Testimonials design presets, all sharing the same data. */
export type TestimonialsVariant = 'carousel' | 'grid' | 'quote-tile';

export interface TestimonialCard {
    quote: string;
    name: string;
    role: string;
    /** CSS color for the card background; falls back to the cycle below. */
    color?: string;
    /** Avatar style key — picks one of the inline portrait SVGs.
        If `avatarUrl` is set it wins over this. */
    avatar?: 'curls' | 'beard' | 'long' | 'cap' | 'glasses' | 'bangs';
    /** Custom avatar image URL — editable via the SectionEditor's media
        picker. Falls back to the inline portrait when empty. Use
        /uploads/... or any absolute URL. */
    avatarUrl?: string;
}

export interface TestimonialsData {
    /** Layout preset — 'carousel' (default, horizontal scroll), 'grid'
        (3-up cards), 'quote-tile' (single featured quote). */
    _variant?: TestimonialsVariant;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    testimonials?: TestimonialCard[];
}

const PASTEL_CYCLE = [
    'var(--pastel-pist)',
    'var(--pastel-sky)',
    'var(--pastel-coral)',
    'var(--pastel-butter)',
    'var(--pastel-lav)',
    'var(--pastel-pink)',
];

const DEFAULTS: Required<TestimonialsData> = {
    eyebrow: 'Voices',
    title: 'Teams that picked Mero CMS and stayed.',
    subtitle:
        'Real quotes from people who edit, ship, and maintain sites built on Mero CMS every week.',
    testimonials: [
        {
            quote:
                '"We replaced three tools with Mero CMS. Marketing edits live, devs never touch the admin, the audit log keeps the lawyers happy."',
            name: 'Elise Wendel',
            role: 'Head of Marketing · Northwind',
            avatar: 'curls',
        },
        {
            quote:
                '"The visual editor is the first one I’ve shown a marketer where they didn’t immediately ask for help. That’s the bar."',
            name: 'Raj Joshi',
            role: 'Staff Engineer · Toolfolio',
            avatar: 'beard',
        },
        {
            quote:
                '"AI Studio drafts our meta descriptions in a tone that matches our brand. We’ve stopped writing them from scratch."',
            name: 'Mira Calder',
            role: 'Content Director · Lenis',
            avatar: 'long',
        },
        {
            quote:
                '"Eight tiers sounded like overkill. Then we needed exactly tier 6 and didn’t have to re-architect anything to get there."',
            name: 'Daniel Kovac',
            role: 'VP Engineering · Jitter',
            avatar: 'cap',
        },
        {
            quote:
                '"The webhook system is HMAC-signed and rate-limited out of the box. That’s two days of plumbing we didn’t write."',
            name: 'Sasha Park',
            role: 'Platform Lead · Blendwit',
            avatar: 'glasses',
        },
        {
            quote:
                '"Onboarding a new editor takes 20 minutes. The audit log handles the rest of the trust conversation for us."',
            name: 'Nadia Rezvani',
            role: 'Operations · Nimble',
            avatar: 'bangs',
        },
    ],
};

/**
 * Testimonials — three design presets, same data shape:
 *   - 'carousel' (default): horizontally scrolling pastel cards.
 *   - 'grid': three columns of quote cards.
 *   - 'quote-tile': single featured quote, large display, attribution row.
 *
 * Each TestimonialCard supports a custom `avatarUrl` via the SectionEditor's
 * media picker; falls back to the inline portrait SVGs (curls / beard /
 * long / cap / glasses / bangs) when no URL is set.
 */
export default function Testimonials({ data = {} }: { data?: TestimonialsData }) {
    const d = { ...DEFAULTS, ...data };
    const variant = d._variant ?? 'carousel';
    const items = d.testimonials?.length ? d.testimonials : DEFAULTS.testimonials;

    if (variant === 'grid')        return <TestimonialsGrid d={d} items={items} />;
    if (variant === 'quote-tile')  return <TestimonialsQuoteTile d={d} items={items} />;
    return <TestimonialsCarousel d={d} items={items} />;
}

/** Avatar block — either a user-supplied image URL OR the bundled
    inline SVG portrait. Reused by all three variants. */
function AvatarBlock({ t, bg, size = 48 }: { t: TestimonialCard; bg: string; size?: number }) {
    if (t.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={t.avatarUrl}
                alt={t.name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    display: 'block',
                }}
            />
        );
    }
    return <Avatar kind={t.avatar || 'curls'} bg={bg} />;
}

// ─── Variant: carousel (default) ─────────────────────────────────────

function TestimonialsCarousel({
    d, items,
}: { d: Required<TestimonialsData>; items: TestimonialCard[] }) {
    return (
        <section
            data-section-id="testimonials"
            data-section-type="Testimonials"
            data-variant="carousel"
            className="testimonials"
            id="testimonials"
        >
            <div className="container">
                <SectionHeader eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
            </div>
            <div className="testimonial-track reveal-stagger">
                {items.map((t, i) => (
                    <div
                        key={i}
                        className="t-card"
                        style={{ background: t.color || PASTEL_CYCLE[i % PASTEL_CYCLE.length] }}
                    >
                        <p className="t-quote">{t.quote}</p>
                        <div className="t-attribution">
                            <div className="t-avatar">
                                <AvatarBlock t={t} bg={t.color || PASTEL_CYCLE[i % PASTEL_CYCLE.length]} />
                            </div>
                            <div>
                                <div className="t-name">{t.name}</div>
                                <div className="t-role">{t.role}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Variant: grid ───────────────────────────────────────────────────

function TestimonialsGrid({
    d, items,
}: { d: Required<TestimonialsData>; items: TestimonialCard[] }) {
    return (
        <section
            data-section-id="testimonials"
            data-section-type="Testimonials"
            data-variant="grid"
            className="section"
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
                    {items.map((t, i) => (
                        <article
                            key={i}
                            style={{
                                background: '#fff',
                                border: '1px solid var(--line, rgba(0,0,0,0.08))',
                                borderRadius: 16,
                                padding: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                            }}
                        >
                            <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                                {t.quote}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                                <AvatarBlock t={t} bg={PASTEL_CYCLE[i % PASTEL_CYCLE.length]} size={40} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.role}</div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Variant: quote-tile (single featured) ───────────────────────────

function TestimonialsQuoteTile({
    d, items,
}: { d: Required<TestimonialsData>; items: TestimonialCard[] }) {
    const featured = items[0];
    if (!featured) return null;
    return (
        <section
            data-section-id="testimonials"
            data-section-type="Testimonials"
            data-variant="quote-tile"
            className="section"
            style={{ padding: 'clamp(64px, 8vw, 120px) 0', background: 'var(--paper)' }}
        >
            <div className="container" style={{ maxWidth: 880, textAlign: 'center' }}>
                {d.eyebrow && (
                    <div className="section-eyebrow" style={{ marginBottom: 16, justifyContent: 'center', display: 'inline-flex' }}>
                        {d.eyebrow}
                    </div>
                )}
                <p
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(24px, 3vw, 40px)',
                        lineHeight: 1.3,
                        marginBottom: 32,
                        color: 'var(--ink)',
                    }}
                >
                    {featured.quote}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                    <AvatarBlock t={featured} bg={PASTEL_CYCLE[0]} size={48} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{featured.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{featured.role}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── Inline avatar portraits — six distinct styles ────────────── */

function Avatar({
    kind,
    bg,
}: {
    kind: NonNullable<TestimonialCard['avatar']>;
    bg: string;
}) {
    return (
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill={bg} />
            <ellipse cx="24" cy={kind === 'cap' ? 28 : 26} rx="13" ry="14" fill="#f5cdb3" />
            {kind === 'curls' && (
                <>
                    <path
                        d="M9 18 Q 12 6 24 6 Q 36 6 39 18 Q 41 22 38 24 Q 35 18 24 18 Q 13 18 10 24 Q 7 22 9 18 Z"
                        fill="#0d0e14"
                    />
                    <circle cx="11" cy="14" r="4" fill="#0d0e14" />
                    <circle cx="24" cy="8" r="4" fill="#0d0e14" />
                    <circle cx="37" cy="14" r="4" fill="#0d0e14" />
                </>
            )}
            {kind === 'beard' && (
                <>
                    <path
                        d="M14 18 Q 16 12 24 12 Q 32 12 34 18 L 33 22 Q 30 18 24 18 Q 18 18 15 22 Z"
                        fill="#0d0e14"
                    />
                    <path
                        d="M14 32 Q 14 38 24 40 Q 34 38 34 32 L 32 30 Q 28 32 24 32 Q 20 32 16 30 Z"
                        fill="#0d0e14"
                    />
                </>
            )}
            {kind === 'long' && (
                <path
                    d="M9 16 Q 12 4 24 4 Q 36 4 39 16 L 38 32 Q 36 28 33 26 L 33 16 Q 30 12 24 12 Q 18 12 15 16 L 15 26 Q 12 28 10 32 Z"
                    fill="#0d0e14"
                />
            )}
            {kind === 'cap' && (
                <>
                    <path
                        d="M10 20 L 38 20 Q 41 20 41 18 Q 38 8 24 8 Q 10 8 7 18 Q 7 20 10 20 Z"
                        fill="#cb172b"
                    />
                    <rect x="6" y="19" width="36" height="3" rx="1.5" fill="#0d0e14" />
                </>
            )}
            {kind === 'glasses' && (
                <>
                    <path
                        d="M11 20 Q 14 8 24 8 Q 34 8 37 20 Q 38 24 35 24 Q 32 18 24 18 Q 16 18 13 24 Q 10 24 11 20 Z"
                        fill="#0d0e14"
                    />
                    <circle cx="18" cy="25" r="4" fill="none" stroke="#0d0e14" strokeWidth="1.6" />
                    <circle cx="30" cy="25" r="4" fill="none" stroke="#0d0e14" strokeWidth="1.6" />
                    <line x1="22" y1="25" x2="26" y2="25" stroke="#0d0e14" strokeWidth="1.6" />
                </>
            )}
            {kind === 'bangs' && (
                <>
                    <path
                        d="M10 16 Q 13 4 24 4 Q 35 4 38 16 L 38 38 Q 36 32 35 28 L 35 18 L 24 14 L 13 18 L 13 28 Q 12 32 10 38 Z"
                        fill="#0d0e14"
                    />
                    <rect x="14" y="14" width="20" height="6" rx="1" fill="#0d0e14" />
                </>
            )}
            <circle cx="20" cy={kind === 'cap' ? 28 : 26} r="1.3" fill="#0d0e14" />
            <circle cx="28" cy={kind === 'cap' ? 28 : 26} r="1.3" fill="#0d0e14" />
            <path
                d={`M21 ${kind === 'cap' ? 33 : 32} Q 24 ${kind === 'cap' ? 35 : 34} 27 ${kind === 'cap' ? 33 : 32}`}
                stroke="#0d0e14"
                strokeWidth="1.3"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
}
