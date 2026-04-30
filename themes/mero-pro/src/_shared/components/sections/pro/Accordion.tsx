'use client';

import { useState } from 'react';

export interface AccordionItem {
    title?: string;
    body?: string;
}

export interface AccordionData {
    eyebrow?: string;
    title?: string;
    items?: AccordionItem[];
    /** When true, opening one panel closes the others. Default false
        (multi-select) so authors can leave multiple panels open. */
    exclusive?: boolean;
}

const DEFAULTS: Required<AccordionData> = {
    eyebrow: '',
    title: '',
    items: [],
    exclusive: false,
};

/**
 * Accordion — Pro widget. Disclosure list with native <details> styling
 * + a controlled mode when `exclusive: true` (radio-group behaviour
 * where opening one closes the others).
 *
 * Distinct from FAQ: FAQ is short Q/A pairs styled as tiles; Accordion
 * is meant for longer-form disclosure (collapsible sections of body
 * copy, install steps, troubleshooting, etc.).
 */
export default function Accordion({ data = {} }: { data?: AccordionData }) {
    const d = { ...DEFAULTS, ...data, items: data?.items ?? DEFAULTS.items };
    const [openSet, setOpenSet] = useState<Set<number>>(new Set());

    if (!d.items.length) return null;

    const toggle = (i: number) => {
        setOpenSet((prev) => {
            const next = new Set(d.exclusive ? [] : prev);
            prev.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    return (
        <section
            data-section-id="accordion"
            data-section-type="Accordion"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container" style={{ maxWidth: 760 }}>
                {(d.eyebrow || d.title) && (
                    <header style={{ marginBottom: 24 }}>
                        {d.eyebrow && <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>{d.eyebrow}</div>}
                        {d.title && (
                            <h2 className="display" data-editable="title" style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                    </header>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {d.items.map((it, i) => {
                        const open = openSet.has(i);
                        return (
                            <div
                                key={i}
                                style={{
                                    border: '1px solid var(--line, rgba(0,0,0,0.08))',
                                    borderRadius: 14,
                                    background: '#fff',
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    onClick={() => toggle(i)}
                                    aria-expanded={open}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        padding: '16px 20px',
                                        background: 'transparent',
                                        border: 0,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        font: 'inherit',
                                        fontWeight: 700,
                                        fontSize: 16,
                                        color: 'var(--ink-1, #0d0e14)',
                                    }}
                                >
                                    <span>{it.title}</span>
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            transform: open ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s',
                                            color: 'var(--ink-3, #6b7280)',
                                            fontSize: 12,
                                        }}
                                    >
                                        ▼
                                    </span>
                                </button>
                                {open && it.body && (
                                    <div
                                        style={{
                                            padding: '0 20px 20px',
                                            color: 'var(--ink-2, #374151)',
                                            lineHeight: 1.65,
                                            fontSize: 15,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {it.body}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
