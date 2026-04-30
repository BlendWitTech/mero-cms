import Image from 'next/image';
import Button from '@/components/ui/Button';

export interface FinalCTAData {
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
    secondaryCta?: string;
    secondaryHref?: string;
    trustText?: string;
    /** Decorative emblem on the right side of the CTA band. Authored
        via the SectionEditor's media picker; defaults to the Mero
        emblem when empty. Set to 'none' to hide. */
    emblemImage?: string;
}

const DEFAULTS: Required<FinalCTAData> = {
    title: 'Where motion meets meaning.',
    subtitle:
        'Spin up a free workspace in 90 seconds. No card, no email wall, no demo gate.',
    primaryCta: 'Start free →',
    primaryHref: '/signup',
    secondaryCta: 'Talk to sales',
    secondaryHref: '/contact',
    trustText: 'Joined by 600+ teams already shipping with Mero CMS.',
    emblemImage: '/emblem.svg',
};

/**
 * Compact two-column CTA band that sits between FAQ and the footer.
 * Left column: headline + subhead + two CTAs.
 * Right column: emblem badge on a cream disc + overlapping team avatar
 *               row + trust line.
 *
 * The dark slab has two radial-gradient blooms (brand red top-right,
 * navy bottom-left) for warmth — set up via the ::before/::after rules
 * in globals.css. Padding wrap pulls the band 80px in from FAQ above
 * and pushes it 80px down from the footer below.
 */
export default function FinalCTA({ data = {} }: { data?: FinalCTAData }) {
    // Same empty-string-coalesce pattern as Hero: editors clearing the
    // emblem image set it to '' which would override DEFAULTS but
    // render nothing. Treat '' as "use default"; explicit hide is
    // 'none'. See Hero.tsx for the full rationale.
    const d: Required<FinalCTAData> = {
        ...DEFAULTS,
        ...data,
        emblemImage: data?.emblemImage || DEFAULTS.emblemImage,
    } as Required<FinalCTAData>;

    return (
        <section data-section-id="cta" className="final-cta-wrap">
            <div className="final-cta reveal-scale">
                <div className="final-cta-content">
                    <h2 className="display">{d.title}</h2>
                    <p>{d.subtitle}</p>
                    <div className="final-cta-actions">
                        <Button href={d.primaryHref} variant="brand">
                            {d.primaryCta}
                        </Button>
                        <Button
                            href={d.secondaryHref}
                            variant="light"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.18)',
                            }}
                        >
                            {d.secondaryCta}
                        </Button>
                    </div>
                </div>

                <div className="final-cta-aside" aria-hidden="true">
                    {d.emblemImage && d.emblemImage !== 'none' && (
                        <div className="final-cta-emblem">
                            <Image
                                src={d.emblemImage}
                                alt=""
                                width={64}
                                height={64}
                                unoptimized
                                style={{ width: '70%', height: '70%' }}
                            />
                        </div>
                    )}
                    <TeamAvatars />
                    <p className="cta-team-label">{d.trustText}</p>
                </div>
            </div>
        </section>
    );
}

/** Five overlapping character-head avatars + a brand-red "+600" badge. */
function TeamAvatars() {
    return (
        <div className="cta-team">
            <Avatar bg="#dbf3b9">
                <path
                    d="M9 18 Q 12 6 24 6 Q 36 6 39 18 Q 41 22 38 24 Q 35 18 24 18 Q 13 18 10 24 Q 7 22 9 18 Z"
                    fill="#0d0e14"
                />
                <circle cx="11" cy="14" r="4" fill="#0d0e14" />
                <circle cx="24" cy="8" r="4" fill="#0d0e14" />
                <circle cx="37" cy="14" r="4" fill="#0d0e14" />
            </Avatar>
            <Avatar bg="#c6daff">
                <path
                    d="M14 18 Q 16 12 24 12 Q 32 12 34 18 L 33 22 Q 30 18 24 18 Q 18 18 15 22 Z"
                    fill="#0d0e14"
                />
                <path
                    d="M14 32 Q 14 38 24 40 Q 34 38 34 32 L 32 30 Q 28 32 24 32 Q 20 32 16 30 Z"
                    fill="#0d0e14"
                />
            </Avatar>
            <Avatar bg="#ffc9b8">
                <path
                    d="M9 16 Q 12 4 24 4 Q 36 4 39 16 L 38 32 Q 36 28 33 26 L 33 16 Q 30 12 24 12 Q 18 12 15 16 L 15 26 Q 12 28 10 32 Z"
                    fill="#0d0e14"
                />
            </Avatar>
            <Avatar bg="#ffe6b0">
                <path
                    d="M10 20 L 38 20 Q 41 20 41 18 Q 38 8 24 8 Q 10 8 7 18 Q 7 20 10 20 Z"
                    fill="#cb172b"
                />
                <rect x="6" y="19" width="36" height="3" rx="1.5" fill="#0d0e14" />
            </Avatar>
            <div className="cta-team-count">+600</div>
        </div>
    );
}

/** Single circular avatar — colored bg + skin oval + custom hair. */
function Avatar({ bg, children }: { bg: string; children: React.ReactNode }) {
    return (
        <div className="cta-team-avatar">
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill={bg} />
                <ellipse cx="24" cy="26" rx="13" ry="14" fill="#f5cdb3" />
                {children}
                <circle cx="20" cy="26" r="1.3" fill="#0d0e14" />
                <circle cx="28" cy="26" r="1.3" fill="#0d0e14" />
            </svg>
        </div>
    );
}
