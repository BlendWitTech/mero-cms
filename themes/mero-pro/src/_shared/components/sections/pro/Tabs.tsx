'use client';

import { useState } from 'react';

export interface TabsItem {
    label?: string;
    body?: string;
    image?: string;
}

export interface TabsData {
    eyebrow?: string;
    title?: string;
    tabs?: TabsItem[];
}

const DEFAULTS: Required<TabsData> = {
    eyebrow: '',
    title: '',
    tabs: [],
};

/**
 * Tabs — Pro widget. Horizontal tab bar + content panes. Useful for
 * "How it works" walkthroughs, feature deep-dives, role-based content.
 *
 * Single-tab-active model. Body supports plain text + an optional
 * image rendered to the right on desktop (stacked on mobile).
 */
export default function Tabs({ data = {} }: { data?: TabsData }) {
    const d = { ...DEFAULTS, ...data, tabs: data?.tabs ?? DEFAULTS.tabs };
    const [active, setActive] = useState(0);

    if (!d.tabs.length) return null;
    const current = d.tabs[active] || d.tabs[0];

    return (
        <section
            data-section-id="tabs"
            data-section-type="Tabs"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                {(d.eyebrow || d.title) && (
                    <header style={{ marginBottom: 24, maxWidth: 720 }}>
                        {d.eyebrow && <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>{d.eyebrow}</div>}
                        {d.title && (
                            <h2 className="display" data-editable="title" style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                    </header>
                )}

                <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: '1px solid var(--line, rgba(0,0,0,0.08))', marginBottom: 24 }}>
                    {d.tabs.map((t, i) => {
                        const isActive = i === active;
                        return (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActive(i)}
                                style={{
                                    padding: '10px 16px',
                                    border: 0,
                                    background: 'transparent',
                                    color: isActive ? 'var(--brand, #cb172b)' : 'var(--ink-3, #6b7280)',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    borderBottom: `2px solid ${isActive ? 'var(--brand, #cb172b)' : 'transparent'}`,
                                    marginBottom: -1,
                                    transition: 'color 0.15s, border-color 0.15s',
                                }}
                            >
                                {t.label || `Tab ${i + 1}`}
                            </button>
                        );
                    })}
                </div>

                <div
                    role="tabpanel"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: current.image ? '1fr 1fr' : '1fr',
                        gap: 'clamp(24px, 3vw, 48px)',
                        alignItems: 'center',
                    }}
                >
                    {current.body && (
                        <div style={{ color: 'var(--ink-2, #374151)', lineHeight: 1.7, fontSize: 16, whiteSpace: 'pre-wrap' }}>
                            {current.body}
                        </div>
                    )}
                    {current.image && (
                        <div
                            style={{
                                aspectRatio: '4 / 3',
                                borderRadius: 16,
                                background: `url(${current.image}) center/cover`,
                            }}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
