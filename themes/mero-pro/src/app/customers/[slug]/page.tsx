import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/ui/Reveal';
import FinalCTA from '@/components/sections/FinalCTA';
import { getCustomerStory, listCustomerStories } from '@/lib/customer-stories';

export const revalidate = 600;

export async function generateStaticParams() {
    return listCustomerStories().map(story => ({ slug: story.slug }));
}

export async function generateMetadata(props: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await props.params;
    const story = getCustomerStory(slug);
    if (!story) return { title: 'Customer story not found' };
    return {
        title: `${story.company} · Customer story`,
        description: story.subheading,
    };
}

/**
 * Single customer case study. Hero with the key metric, then a
 * three-block "Challenge / Approach / Outcomes" structure, plus a
 * pull quote and a sidebar of "Quick facts."
 */
export default async function CustomerStoryPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const story = getCustomerStory(slug);
    if (!story) notFound();

    return (
        <Reveal>
            <main>
                {/* Hero band — pastel background matching the company card */}
                <section
                    style={{
                        padding: '160px 0 64px',
                        background: `linear-gradient(180deg, ${story.color} 0%, var(--paper) 100%)`,
                    }}
                >
                    <div className="container" style={{ maxWidth: 880 }}>
                        <Link
                            href="/customers"
                            style={{ color: 'var(--ink-3)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                        >
                            ← All customer stories
                        </Link>
                        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'baseline' }}>
                            <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                                {story.company}
                            </h1>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(13,14,20,0.6)',
                                    background: 'rgba(255,255,255,0.6)',
                                    padding: '4px 10px',
                                    borderRadius: 100,
                                }}
                            >
                                {story.industry}
                            </span>
                        </div>
                        <h2
                            className="display"
                            style={{
                                fontSize: 'clamp(32px, 5vw, 56px)',
                                lineHeight: 1.05,
                                marginTop: 24,
                                marginBottom: 20,
                            }}
                        >
                            {story.headline}
                        </h2>
                        <p style={{ color: 'var(--ink-2)', fontSize: 18, lineHeight: 1.55, maxWidth: '60ch' }}>
                            {story.subheading}
                        </p>

                        <div
                            style={{
                                marginTop: 32,
                                background: 'rgba(255,255,255,0.6)',
                                padding: '20px 24px',
                                borderRadius: 'var(--r-md)',
                                display: 'inline-flex',
                                gap: 16,
                                alignItems: 'baseline',
                            }}
                        >
                            <div className="display" style={{ fontSize: 48, fontWeight: 800, color: 'var(--brand)' }}>
                                {story.metric}
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--ink-2)', maxWidth: '24ch' }}>
                                {story.metricLabel}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Body — Challenge / Approach / Outcomes + sidebar facts */}
                <section className="section" style={{ paddingTop: 32 }}>
                    <div className="container" style={{ maxWidth: 1080 }}>
                        <div className="story-grid">
                            <article style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                                <Block title="The challenge" items={story.challenge} />
                                <Block title="The approach" items={story.approach} />

                                <blockquote
                                    style={{
                                        background: '#fff',
                                        border: '1px solid var(--paper-3)',
                                        borderLeft: '4px solid var(--brand)',
                                        borderRadius: 'var(--r-md)',
                                        padding: 32,
                                        margin: 0,
                                    }}
                                >
                                    <p
                                        className="display"
                                        style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 500, marginBottom: 16 }}
                                    >
                                        {story.pullQuote.quote}
                                    </p>
                                    <footer style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                                        — <strong style={{ color: 'var(--ink-2)' }}>{story.pullQuote.name}</strong>,{' '}
                                        {story.pullQuote.role}
                                    </footer>
                                </blockquote>

                                <div>
                                    <h3 className="display" style={{ fontSize: 24, marginBottom: 16 }}>
                                        Outcomes
                                    </h3>
                                    <div className="outcomes-grid">
                                        {story.outcomes.map(o => (
                                            <div
                                                key={o.metric}
                                                style={{
                                                    background: '#fff',
                                                    border: '1px solid var(--paper-3)',
                                                    borderRadius: 'var(--r-md)',
                                                    padding: 20,
                                                }}
                                            >
                                                <div
                                                    className="display"
                                                    style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand)' }}
                                                >
                                                    {o.metric}
                                                </div>
                                                <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
                                                    {o.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </article>

                            <aside>
                                <div
                                    style={{
                                        background: '#fff',
                                        border: '1px solid var(--paper-3)',
                                        borderRadius: 'var(--r-md)',
                                        padding: 24,
                                        position: 'sticky',
                                        top: 96,
                                    }}
                                >
                                    <h4
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color: 'var(--ink-4)',
                                            marginBottom: 14,
                                        }}
                                    >
                                        Quick facts
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {story.facts.map(f => (
                                            <li key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                                <span style={{ color: 'var(--ink-3)' }}>{f.label}</span>
                                                <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{f.value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </aside>
                        </div>

                        <style>{`
                            .story-grid { display: grid; grid-template-columns: 1fr 280px; gap: 64px; align-items: start; }
                            .outcomes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                            @media (max-width: 900px) {
                                .story-grid { grid-template-columns: 1fr; gap: 32px; }
                                .outcomes-grid { grid-template-columns: 1fr; }
                            }
                        `}</style>
                    </div>
                </section>

                <FinalCTA />
            </main>
        </Reveal>
    );
}

function Block({ title, items }: { title: string; items: string[] }) {
    return (
        <div>
            <h3 className="display" style={{ fontSize: 24, marginBottom: 12 }}>
                {title}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item, i) => (
                    <li
                        key={i}
                        style={{ display: 'flex', gap: 12, fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)' }}
                    >
                        <span
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'rgba(203,23,43,0.1)',
                                color: 'var(--brand)',
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                                marginTop: 2,
                                fontWeight: 700,
                                fontSize: 12,
                            }}
                        >
                            {i + 1}
                        </span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
