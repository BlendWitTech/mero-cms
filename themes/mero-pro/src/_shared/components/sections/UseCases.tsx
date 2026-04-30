import EmblemWatermark from '../../components/ui/EmblemWatermark';
import SectionHeader from '../../components/ui/SectionHeader';

export interface UseCase {
    title: string;
    body: string;
    /** Path to the character SVG in /public — full image (no crop) is rendered. */
    character: string;
    /** Optional viewBox crop "x y w h" if the source SVG has whitespace.
        Defaults to "0 30 W 240" — matches the stock vectorinkAI output. */
    crop?: { x: number; y: number; w: number; h: number };
    /** Natural width of the source SVG (for the inner <image>). */
    sourceWidth?: number;
}

export interface UseCasesData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    cases?: UseCase[];
}

const DEFAULTS: Required<UseCasesData> = {
    eyebrow: 'Built for every role',
    title: 'Three teams. One CMS.',
    subtitle:
        'Whether you’re shipping copy, designing variants, or wiring up webhooks — Mero CMS adapts to your role without forcing you into someone else’s workflow.',
    cases: [
        {
            title: 'For marketing teams',
            body:
                'Edit headlines, swap section variants, schedule launches, and check publish history — all without bothering engineering.',
            character: '/character-marketing-v2.svg',
            sourceWidth: 136.66,
        },
        {
            title: 'For content editors',
            body:
                'Drafts, scheduled posts, AI-assisted outlines, and a media library that doesn’t require dragging into 4 different folders.',
            character: '/character-marketing.svg',
            sourceWidth: 281.83,
        },
        {
            title: 'For developers',
            body:
                'REST + webhooks, theme manifests in theme.json, capability gates in code. Read the docs once, never read them again.',
            character: '/character-developer.svg',
            sourceWidth: 142,
        },
    ],
};

/**
 * Three-column grid of role-targeted cards. Each card contains a
 * character illustration sitting in a square pastel-paper backdrop,
 * a heading and a short paragraph. The character SVG is rendered via
 * an outer <svg viewBox> that crops the source's top/bottom whitespace
 * (effective y range 30..270 of a 0..300 source) so the figure fills
 * the card without floating in empty space.
 */
export default function UseCases({ data = {} }: { data?: UseCasesData }) {
    const d = { ...DEFAULTS, ...data };
    const cases = d.cases?.length ? d.cases : DEFAULTS.cases;

    return (
        <section
            data-section-id="use-cases"
            className="section has-watermark"
            style={{ background: 'var(--paper)' }}
            id="use-cases"
        >
            <EmblemWatermark position="tr" />
            <div className="container">
                <SectionHeader
                    eyebrow={d.eyebrow}
                    title={
                        <>
                            Three teams.{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                One CMS.
                            </span>
                        </>
                    }
                    subtitle={d.subtitle}
                />

                <div className="use-cases reveal-stagger">
                    {cases.map(uc => {
                        const sourceW = uc.sourceWidth ?? 281.83;
                        const crop = uc.crop ?? { x: 0, y: 30, w: sourceW, h: 240 };
                        return (
                            <div key={uc.title} className="use-case">
                                <div className="use-case-illo">
                                    <svg
                                        viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="use-case-character"
                                        preserveAspectRatio="xMidYMax meet"
                                        aria-hidden="true"
                                    >
                                        <image
                                            href={uc.character}
                                            x="0"
                                            y="0"
                                            width={sourceW}
                                            height={300}
                                        />
                                    </svg>
                                </div>
                                <h4>{uc.title}</h4>
                                <p>{uc.body}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
