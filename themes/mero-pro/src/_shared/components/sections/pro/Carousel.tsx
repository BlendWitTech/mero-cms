'use client';

import { useEffect, useState } from 'react';

export interface CarouselSlide {
    title?: string;
    body?: string;
    image?: string;
    imageAlt?: string;
    href?: string;
    cta?: string;
}

export interface CarouselData {
    eyebrow?: string;
    title?: string;
    slides?: CarouselSlide[];
    /** Auto-advance interval (ms). 0 disables auto-rotation. */
    interval?: number;
}

const DEFAULTS: Required<CarouselData> = {
    eyebrow: '',
    title: '',
    slides: [],
    interval: 5000,
};

/**
 * Carousel — Pro widget. Auto-rotating slides with prev/next + dots.
 * One slide visible at a time, soft fade transitions, keyboard arrows.
 *
 * Why this is Pro: it pulls in client-side state, an interval timer,
 * and key handlers — non-trivial JS the basic-tier widgets avoid. Tier
 * gating is enforced at the editor / palette level (premium: true on
 * the widget catalog entry); the renderer itself is permissive.
 */
export default function Carousel({ data = {} }: { data?: CarouselData }) {
    const d = { ...DEFAULTS, ...data, slides: data?.slides ?? DEFAULTS.slides };
    const slides = d.slides;
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!slides.length || !d.interval) return;
        const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), d.interval);
        return () => clearInterval(id);
    }, [slides.length, d.interval]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft')  setIndex((i) => (i - 1 + slides.length) % slides.length);
            if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % slides.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [slides.length]);

    if (!slides.length) return null;
    const slide = slides[index];

    return (
        <section
            data-section-id="carousel"
            data-section-type="Carousel"
            className="carousel"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                {(d.eyebrow || d.title) && (
                    <header style={{ marginBottom: 24, maxWidth: 720 }}>
                        {d.eyebrow && (
                            <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>
                                {d.eyebrow}
                            </div>
                        )}
                        {d.title && (
                            <h2 className="display" data-editable="title" style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                    </header>
                )}
                <div
                    style={{
                        position: 'relative',
                        borderRadius: 20,
                        overflow: 'hidden',
                        background: 'var(--ink-bg-2, #f7f7f7)',
                        aspectRatio: '16 / 9',
                    }}
                >
                    {slides.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                opacity: i === index ? 1 : 0,
                                transition: 'opacity 0.5s',
                                pointerEvents: i === index ? 'auto' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 'clamp(24px, 4vw, 48px)',
                                color: '#fff',
                                background: s.image
                                    ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.2)), url(${s.image}) center/cover`
                                    : 'var(--brand, #cb172b)',
                            }}
                        >
                            <div style={{ maxWidth: 560 }}>
                                {s.title && (
                                    <h3 style={{ fontSize: 'clamp(22px, 2.4vw, 32px)', fontWeight: 700, marginBottom: 12 }}>
                                        {s.title}
                                    </h3>
                                )}
                                {s.body && (
                                    <p style={{ fontSize: 16, lineHeight: 1.55, opacity: 0.92, marginBottom: 16 }}>
                                        {s.body}
                                    </p>
                                )}
                                {s.cta && s.href && (
                                    <a
                                        href={s.href}
                                        style={{
                                            display: 'inline-flex',
                                            background: '#fff',
                                            color: '#0d0e14',
                                            padding: '10px 18px',
                                            borderRadius: 999,
                                            fontWeight: 700,
                                            fontSize: 14,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {s.cta} →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
                        aria-label="Previous slide"
                        style={navBtnStyle('left')}
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => setIndex((i) => (i + 1) % slides.length)}
                        aria-label="Next slide"
                        style={navBtnStyle('right')}
                    >
                        ›
                    </button>
                    <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                aria-label={`Go to slide ${i + 1}`}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: i === index ? '#fff' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
    return {
        position: 'absolute',
        top: '50%',
        [side]: 16,
        transform: 'translateY(-50%)',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.85)',
        color: '#0d0e14',
        fontSize: 22,
        fontWeight: 700,
        cursor: 'pointer',
    };
}
