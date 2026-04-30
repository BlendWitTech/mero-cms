'use client';

import EmblemWatermark from '@/components/ui/EmblemWatermark';

export interface FAQData {
    title?: string;
    items?: { q: string; a: string }[];
}

const DEFAULTS: Required<FAQData> = {
    title: 'Everything you’d ask before buying.',
    items: [
        {
            q: 'Is Mero CMS a subscription?',
            a: 'No. Mero CMS is a one-time license per production deployment. You own the running code. Lifetime updates for the current major version, plus 12 months of support included.',
        },
        {
            q: 'Can we build our own theme?',
            a: 'Yes. Every theme is a Next.js project that declares sections and variants in theme.json. The admin adapts automatically — no extra CMS work to add new sections.',
        },
        {
            q: 'Does it work with our existing stack?',
            a: 'Mero CMS is a headless-ish Node + Postgres backend with REST endpoints. Themes are Next.js apps consuming those endpoints. API keys let mobile, native, or any other frontend pull the same content.',
        },
        {
            q: 'What about performance?',
            a: 'The theme is statically generated with ISR. The backend ships with helmet, rate limits, HMAC-signed webhooks, and a 2 MB JSON body cap. Private media goes through signed URLs.',
        },
        {
            q: 'How does upgrading tiers work?',
            a: "It's a license swap, not a reinstall. Capabilities gate via the matrix in code, so the right features turn on the moment your tier updates.",
        },
    ],
};

/**
 * Frequently asked questions — left rail with the headline + a "talk
 * to a human" link, right rail with native <details> accordion items.
 * Native <details>/<summary> means no JS state, instant interactivity,
 * works without the bundle loading. The expand/collapse styling lives
 * in globals.css under .faq-item.
 *
 * The 'use client' directive isn't strictly required for native
 * <details> but lets us add interactive enhancements later (analytics,
 * URL-based deep links) without restructuring.
 */
export default function FAQ({ data = {} }: { data?: FAQData }) {
    const title = data.title || DEFAULTS.title;
    const items = data.items?.length ? data.items : DEFAULTS.items;

    return (
        <section data-section-id="faq" className="section has-watermark" id="faq">
            <EmblemWatermark position="br" />
            <div className="container">
                <div className="faq-grid">
                    <div>
                        <div className="section-eyebrow">Questions</div>
                        <h2
                            className="display section-title"
                            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}
                        >
                            {title}
                        </h2>
                        <p className="section-sub">
                            Can&apos;t find the answer?{' '}
                            <a href="/contact" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                                Talk to a human →
                            </a>
                        </p>
                    </div>
                    <div className="faq-list reveal-stagger">
                        {items.map((item, i) => (
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
