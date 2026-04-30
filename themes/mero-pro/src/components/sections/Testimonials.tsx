import SectionHeader from '@/components/ui/SectionHeader';

export interface TestimonialCard {
    quote: string;
    name: string;
    role: string;
    /** CSS color for the card background; falls back to the cycle below. */
    color?: string;
    /** Avatar style key — picks one of the inline portrait SVGs. */
    avatar?: 'curls' | 'beard' | 'long' | 'cap' | 'glasses' | 'bangs';
}

export interface TestimonialsData {
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
 * Workleap-inspired testimonial carousel. Horizontally scrolling row of
 * pastel-coloured cards, each with a chunky display quote, a circular
 * character avatar, and a name + role line. Hides the scrollbar in
 * webkit + firefox; users scroll via trackpad/swipe/wheel.
 */
export default function Testimonials({ data = {} }: { data?: TestimonialsData }) {
    const d = { ...DEFAULTS, ...data };
    const items = d.testimonials?.length ? d.testimonials : DEFAULTS.testimonials;

    return (
        <section data-section-id="testimonials" className="testimonials" id="testimonials">
            <div className="container">
                <SectionHeader
                    eyebrow={d.eyebrow}
                    title={
                        <>
                            Teams that picked Mero CMS{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                and stayed.
                            </span>
                        </>
                    }
                    subtitle={d.subtitle}
                />
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
                                <Avatar kind={t.avatar || 'curls'} bg={t.color || PASTEL_CYCLE[i % PASTEL_CYCLE.length]} />
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
