'use client';

import EmblemWatermark from '../../components/ui/EmblemWatermark';

/** Three FAQ design presets. Same data fields across all variants —
    switching is non-destructive. */
export type FAQVariant = 'accordion' | 'two-column' | 'inline';

export interface FAQData {
    /** Layout preset. 'accordion' (default) shows expandable items;
        'two-column' shows Q on left, A on right (no toggling); 'inline'
        shows a flat list of Q + A pairs. */
    _variant?: FAQVariant;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    items?: { q: string; a: string }[];
}

const DEFAULTS: Required<FAQData> = {
    _variant: 'accordion',
    eyebrow: 'Questions',
    title: 'Everything you’d ask before buying.',
    subtitle: '',
    items: [
        {
            q: 'How does pricing work?',
            a: 'A short, friendly answer that sets expectations and addresses the buyer’s primary concern.',
        },
        {
            q: 'Can we customise the design?',
            a: 'Another short answer. Edit these in your CMS — no code changes needed.',
        },
        {
            q: 'How do we get help?',
            a: 'Email support and a help center. Premium tiers add live chat and a dedicated point of contact.',
        },
        {
            q: 'Is there a refund policy?',
            a: 'Yes — 14-day money-back, no questions asked. After that, you keep what you’ve paid for.',
        },
    ],
};

/**
 * FAQ section with three design variants:
 *   - 'accordion' (default) — expandable Q&A list with native <details>.
 *   - 'two-column' — Q on left, A on right, no toggling. Best when
 *                    answers are short and you want everything visible.
 *   - 'inline' — flat list of Q + A pairs. For dense, scannable layout.
 *
 * All variants share the same `items[]` data — switching variants in
 * the SectionEditor is non-destructive.
 */
export default function FAQ({ data = {} }: { data?: FAQData }) {
    const d = { ...DEFAULTS, ...data };
    const variant = d._variant ?? 'accordion';
    const items = d.items?.length ? d.items : DEFAULTS.items;

    if (variant === 'two-column') return <FAQTwoColumn d={d} items={items} />;
    if (variant === 'inline')      return <FAQInline d={d} items={items} />;
    return <FAQAccordion d={d} items={items} />;
}

// ─── Variant: accordion (default) ────────────────────────────────────

function FAQAccordion({ d, items }: { d: Required<FAQData>; items: FAQData['items'] }) {
    return (
        <section
            data-section-id="faq"
            data-section-type="FAQ"
            data-variant="accordion"
            className="section has-watermark"
            id="faq"
        >
            <EmblemWatermark position="br" />
            <div className="container">
                <div className="faq-grid">
                    <div>
                        {d.eyebrow && <div className="section-eyebrow">{d.eyebrow}</div>}
                        <h2 className="display section-title" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
                            {d.title}
                        </h2>
                        <p className="section-sub">
                            Can&apos;t find the answer?{' '}
                            <a href="/contact" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                                Talk to a human →
                            </a>
                        </p>
                    </div>
                    <div className="faq-list reveal-stagger">
                        {items?.map((item, i) => (
                            <details key={i} className="faq-item" open={i === 0}>
                                <summary>
                                    {item.q}
                                    <span className="faq-toggle">+</span>
                                </summary>
                                <div className="faq-a">{item.a}</div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Variant: two-column ─────────────────────────────────────────────

function FAQTwoColumn({ d, items }: { d: Required<FAQData>; items: FAQData['items'] }) {
    return (
        <section
            data-section-id="faq"
            data-section-type="FAQ"
            data-variant="two-column"
            className="section"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                <header style={{ maxWidth: 720, marginBottom: 48 }}>
                    {d.eyebrow && <div className="section-eyebrow" style={{ marginBottom: 8 }}>{d.eyebrow}</div>}
                    <h2 className="display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', marginBottom: 12 }}>
                        {d.title}
                    </h2>
                    {d.subtitle && (
                        <p style={{ color: 'var(--ink-3)', lineHeight: 1.55 }}>{d.subtitle}</p>
                    )}
                </header>
                <div
                    style={{
                        display: 'grid',
                        gap: '32px 48px',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
                    }}
                >
                    {items?.map((item, i) => [
                        <h3
                            key={`q-${i}`}
                            style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: 'var(--ink)' }}
                        >
                            {item.q}
                        </h3>,
                        <p
                            key={`a-${i}`}
                            style={{ color: 'var(--ink-3)', lineHeight: 1.65, fontSize: 15 }}
                        >
                            {item.a}
                        </p>,
                    ])}
                </div>
            </div>
        </section>
    );
}

// ─── Variant: inline ─────────────────────────────────────────────────

function FAQInline({ d, items }: { d: Required<FAQData>; items: FAQData['items'] }) {
    return (
        <section
            data-section-id="faq"
            data-section-type="FAQ"
            data-variant="inline"
            className="section"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container" style={{ maxWidth: 760 }}>
                <header style={{ marginBottom: 40, textAlign: 'center' }}>
                    {d.eyebrow && (
                        <div
                            className="section-eyebrow"
                            style={{ marginBottom: 8, justifyContent: 'center', display: 'inline-flex' }}
                        >
                            {d.eyebrow}
                        </div>
                    )}
                    <h2 className="display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
                        {d.title}
                    </h2>
                </header>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {items?.map((item, i) => (
                        <div key={i} style={{
                            paddingBottom: 24,
                            borderBottom: i < (items.length - 1) ? '1px solid var(--line, rgba(0,0,0,0.08))' : 'none',
                        }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.q}</h3>
                            <p style={{ color: 'var(--ink-3)', lineHeight: 1.65 }}>{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
