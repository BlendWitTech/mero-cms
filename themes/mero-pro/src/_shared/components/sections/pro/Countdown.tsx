'use client';

import { useEffect, useState } from 'react';

export interface CountdownData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** ISO timestamp. Empty / past dates render the `expiredText`. */
    targetDate?: string;
    /** Copy shown after the deadline passes. */
    expiredText?: string;
}

const DEFAULTS: Required<CountdownData> = {
    eyebrow: '',
    title: 'Time left to act',
    subtitle: '',
    targetDate: '',
    expiredText: 'This offer has ended.',
};

/**
 * Countdown — Pro widget. Live-updating timer to a target date.
 * Days / hours / minutes / seconds, all in their own tiles. After the
 * deadline passes the tiles collapse into the `expiredText`.
 *
 * Hydrates safely: server renders zeroes (no flash of placeholder),
 * the client-side useEffect kicks in and starts ticking. No timezone
 * surprises — JS Date parses ISO strings as UTC.
 */
export default function Countdown({ data = {} }: { data?: CountdownData }) {
    const d = { ...DEFAULTS, ...data };
    const target = d.targetDate ? new Date(d.targetDate).getTime() : 0;
    const [now, setNow] = useState(() => target ? Date.now() : 0);

    useEffect(() => {
        if (!target) return;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [target]);

    const remaining = target ? Math.max(0, target - now) : 0;
    const expired = target > 0 && remaining === 0;

    const days    = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);

    return (
        <section
            data-section-id="countdown"
            data-section-type="Countdown"
            style={{
                padding: 'clamp(48px, 6vw, 96px) 0',
                background: 'var(--brand-soft, rgba(203,23,43,0.04))',
            }}
        >
            <div className="container" style={{ textAlign: 'center', maxWidth: 720 }}>
                {d.eyebrow && <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>{d.eyebrow}</div>}
                {d.title && (
                    <h2 className="display" data-editable="title" style={{ fontSize: 'clamp(28px, 3vw, 40px)', marginBottom: 12 }}>
                        {d.title}
                    </h2>
                )}
                {d.subtitle && (
                    <p data-editable="subtitle" style={{ color: 'var(--ink-3)', marginBottom: 32, fontSize: 16 }}>
                        {d.subtitle}
                    </p>
                )}
                {!target ? (
                    <p style={{ color: 'var(--ink-3)' }}>Set a target date in the editor to start the countdown.</p>
                ) : expired ? (
                    <p style={{ fontSize: 18, color: 'var(--ink-2)', fontWeight: 600 }}>{d.expiredText}</p>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 12,
                            maxWidth: 480,
                            margin: '0 auto',
                        }}
                    >
                        <Tile label="days"    value={days} />
                        <Tile label="hours"   value={hours} />
                        <Tile label="minutes" value={minutes} />
                        <Tile label="seconds" value={seconds} />
                    </div>
                )}
            </div>
        </section>
    );
}

function Tile({ label, value }: { label: string; value: number }) {
    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid var(--line, rgba(0,0,0,0.08))',
                borderRadius: 14,
                padding: '20px 8px',
            }}
        >
            <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--ink-1)', fontVariantNumeric: 'tabular-nums' }}>
                {String(value).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
            </div>
        </div>
    );
}
