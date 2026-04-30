import Button from '../../components/ui/Button';

export interface PageHeroData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryHref?: string;
    secondaryCta?: string;
    secondaryHref?: string;
    /** Optional alignment — left or center. Defaults to center for
        inner pages because they're typically narrower than the home
        hero. Authored as a select in the SectionEditor (when the
        schema declares the options). */
    align?: 'left' | 'center';
}

const DEFAULTS: Required<PageHeroData> = {
    eyebrow: '',
    title: 'Hello, world.',
    subtitle: 'A subhead that earns the page.',
    primaryCta: '',
    primaryHref: '',
    secondaryCta: '',
    secondaryHref: '',
    align: 'center',
};

/**
 * PageHero — compact hero used on inner pages (about, contact, careers,
 * legal, etc.). Lighter than the home Hero: no character image, no
 * dashboard mockup, no decorative emblem. Just eyebrow + title +
 * subtitle + optional CTAs. Defaults to center-aligned because most
 * inner pages benefit from the symmetry; the SectionEditor's `align`
 * field lets authors flip to left when needed.
 */
export default function PageHero({ data = {} }: { data?: PageHeroData }) {
    const d = { ...DEFAULTS, ...data };
    const isCenter = d.align !== 'left';

    return (
        <section
            data-section-id="page-hero"
            data-section-type="PageHero"
            className="page-hero"
            style={{
                paddingTop: 'clamp(96px, 12vw, 160px)',
                paddingBottom: 'clamp(48px, 6vw, 96px)',
                background: 'var(--paper)',
            }}
        >
            <div
                className="container"
                style={{
                    textAlign: isCenter ? 'center' : 'left',
                    maxWidth: 720,
                }}
            >
                {d.eyebrow && (
                    <div
                        className="section-eyebrow"
                        data-editable="eyebrow"
                        style={{
                            marginBottom: 16,
                            justifyContent: isCenter ? 'center' : 'flex-start',
                            display: 'inline-flex',
                        }}
                    >
                        {d.eyebrow}
                    </div>
                )}
                {d.title && (
                    <h1
                        className="display"
                        data-editable="title"
                        style={{ marginBottom: 16 }}
                    >
                        {d.title}
                    </h1>
                )}
                {d.subtitle && (
                    <p
                        data-editable="subtitle"
                        style={{
                            color: 'var(--ink-3)',
                            fontSize: 'clamp(16px, 1.5vw, 19px)',
                            lineHeight: 1.55,
                            margin: isCenter ? '0 auto' : '0',
                            maxWidth: 600,
                        }}
                    >
                        {d.subtitle}
                    </p>
                )}
                {(d.primaryCta || d.secondaryCta) && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            marginTop: 28,
                            flexWrap: 'wrap',
                            justifyContent: isCenter ? 'center' : 'flex-start',
                        }}
                    >
                        {d.primaryCta && (
                            <Button href={d.primaryHref || '#'} variant="brand">
                                <span data-editable="primaryCta">{d.primaryCta}</span>
                            </Button>
                        )}
                        {d.secondaryCta && (
                            <Button href={d.secondaryHref || '#'} variant="light">
                                <span data-editable="secondaryCta">{d.secondaryCta}</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
