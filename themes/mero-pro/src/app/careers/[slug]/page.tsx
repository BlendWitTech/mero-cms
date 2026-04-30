import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/ui/Reveal';
import Button from '@/components/ui/Button';
import { getJob, listJobs } from '@/lib/jobs';

export const revalidate = 600;

export async function generateStaticParams() {
    return listJobs().map(j => ({ slug: j.slug }));
}

export async function generateMetadata(props: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await props.params;
    const job = getJob(slug);
    if (!job) return { title: 'Role not found' };
    return {
        title: `${job.title} · Careers`,
        description: job.summary,
    };
}

/**
 * Single job page — header with role + team + location, summary, then
 * What you'll do / What we're looking for / Nice-to-have / Process,
 * each as a structured list. Apply CTA at the top and at the bottom.
 */
export default async function JobPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const job = getJob(slug);
    if (!job) notFound();

    return (
        <Reveal>
            <main style={{ maxWidth: 800, margin: '0 auto', padding: '160px 24px 80px' }}>
                <Link
                    href="/careers"
                    style={{ color: 'var(--ink-3)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                    ← All open roles
                </Link>

                <div style={{ marginTop: 24 }}>
                    <p
                        style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--brand)',
                            marginBottom: 12,
                        }}
                    >
                        {job.team} · {job.location} · {job.type}
                    </p>
                    <h1
                        className="display"
                        style={{
                            fontSize: 'clamp(36px, 5vw, 56px)',
                            lineHeight: 1.05,
                            marginBottom: 16,
                            letterSpacing: '-0.025em',
                        }}
                    >
                        {job.title}
                    </h1>
                    <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: 24 }}>
                        {job.summary}
                    </p>
                    <Button
                        href={`mailto:hiring@merocms.com?subject=Application: ${job.title}`}
                        variant="brand"
                        size="lg"
                    >
                        Apply for this role →
                    </Button>
                </div>

                <Section title="What you'll do" items={job.youll} kind="bullet" />
                <Section title="What we're looking for" items={job.youAre} kind="bullet" />
                <Section title="Nice to have" items={job.bonus} kind="bullet" />

                <div style={{ marginTop: 56 }}>
                    <h2 className="display" style={{ fontSize: 26, marginBottom: 16 }}>
                        Hiring process
                    </h2>
                    <ol
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            counterReset: 'step',
                        }}
                    >
                        {job.process.map((s, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    gap: 16,
                                    background: '#fff',
                                    border: '1px solid var(--paper-3)',
                                    borderRadius: 'var(--r-md)',
                                    padding: 18,
                                }}
                            >
                                <span
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: 'var(--brand)',
                                        color: '#fff',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        fontSize: 13,
                                    }}
                                >
                                    {i + 1}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.step}</div>
                                    <div style={{ color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.55 }}>{s.detail}</div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div
                    style={{
                        marginTop: 64,
                        padding: 32,
                        background: 'var(--paper-2)',
                        borderRadius: 'var(--r-lg)',
                        textAlign: 'center',
                    }}
                >
                    <h3 className="display" style={{ fontSize: 24, marginBottom: 8 }}>
                        Sound like you?
                    </h3>
                    <p style={{ color: 'var(--ink-3)', fontSize: 15, marginBottom: 20, maxWidth: '40ch', margin: '0 auto 20px' }}>
                        We read every application. Even short, scrappy notes — clarity beats polish.
                    </p>
                    <Button
                        href={`mailto:hiring@merocms.com?subject=Application: ${job.title}`}
                        variant="brand"
                        size="lg"
                    >
                        Apply now →
                    </Button>
                </div>
            </main>
        </Reveal>
    );
}

function Section({ title, items, kind }: { title: string; items: string[]; kind: 'bullet' | 'numbered' }) {
    return (
        <section style={{ marginTop: 56 }}>
            <h2 className="display" style={{ fontSize: 26, marginBottom: 16 }}>
                {title}
            </h2>
            <ul
                style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}
            >
                {items.map((item, i) => (
                    <li
                        key={i}
                        style={{
                            display: 'flex',
                            gap: 12,
                            fontSize: 16,
                            lineHeight: 1.6,
                            color: 'var(--ink-2)',
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: 'var(--brand)',
                                flexShrink: 0,
                                marginTop: 9,
                            }}
                        />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
            {/* `kind` arg accepted to keep the call site self-documenting,
                even though both lists currently share the same bullet style. */}
            {kind === 'numbered' && null}
        </section>
    );
}
