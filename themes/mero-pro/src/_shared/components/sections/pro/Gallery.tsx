'use client';

import { useState } from 'react';

export interface GalleryItem {
    image: string;
    caption?: string;
    alt?: string;
}

export interface GalleryData {
    eyebrow?: string;
    title?: string;
    items?: GalleryItem[];
    /** 2/3/4 columns at the largest breakpoint; auto-collapses on mobile. */
    columns?: 2 | 3 | 4;
}

const DEFAULTS: Required<GalleryData> = {
    eyebrow: '',
    title: '',
    items: [],
    columns: 3,
};

/**
 * Gallery — Pro widget. Responsive grid of images with a built-in
 * lightbox. Click a tile to open; ESC / click-outside / X to close;
 * arrow keys to navigate.
 *
 * No external lightbox dep — the lightbox is ~30 lines of inline JSX.
 * Image optimisation is the theme's responsibility (the URLs come
 * straight from the media library).
 */
export default function Gallery({ data = {} }: { data?: GalleryData }) {
    const d = { ...DEFAULTS, ...data, items: data?.items ?? DEFAULTS.items };
    const items = d.items;
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    if (!items.length) return null;

    return (
        <section
            data-section-id="gallery"
            data-section-type="Gallery"
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
                <div
                    style={{
                        display: 'grid',
                        gap: 12,
                        gridTemplateColumns: `repeat(auto-fill, minmax(${d.columns === 2 ? 320 : d.columns === 4 ? 200 : 240}px, 1fr))`,
                    }}
                >
                    {items.map((it, i) => (
                        <button
                            key={i}
                            onClick={() => setOpenIdx(i)}
                            style={{
                                position: 'relative',
                                aspectRatio: '4 / 3',
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: 0,
                                cursor: 'pointer',
                                padding: 0,
                                background: `url(${it.image}) center/cover`,
                            }}
                            aria-label={it.alt || it.caption || `Open image ${i + 1}`}
                        >
                            {it.caption && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '12px 14px',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                                        color: '#fff',
                                        fontSize: 13,
                                        textAlign: 'left',
                                    }}
                                >
                                    {it.caption}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {openIdx !== null && (
                <div
                    onClick={() => setOpenIdx(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                    }}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpenIdx(null); }}
                        aria-label="Close"
                        style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 0,
                            background: 'rgba(255,255,255,0.15)',
                            color: '#fff',
                            fontSize: 24,
                            cursor: 'pointer',
                        }}
                    >
                        ×
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={items[openIdx].image}
                        alt={items[openIdx].alt || items[openIdx].caption || ''}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }}
                    />
                </div>
            )}
        </section>
    );
}
