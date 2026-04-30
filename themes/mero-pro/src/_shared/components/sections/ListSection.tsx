import Link from 'next/link';

export interface ListSectionItem {
    title?: string;
    body?: string;
    /** Optional link — turns the whole card into a clickable surface
        when set. Internal paths use Next's <Link>; external URLs (http*)
        render as plain <a> with target="_blank" + rel="noopener". */
    href?: string;
    /** Optional small icon path or emoji. Lightweight intentionally —
        for richer per-item visuals use FeatureBlocks instead. */
    icon?: string;
}

export interface ListSectionData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    items?: ListSectionItem[];
    /** Layout mode. 'grid' (default) shows three cards across; 'list'
        stacks them vertically (better for longer items like changelog
        releases or roadmap rows). */
    layout?: 'grid' | 'list';
}

const DEFAULTS: Required<ListSectionData> = {
    eyebrow: '',
    title: 'Section title',
    subtitle: '',
    items: [],
    layout: 'grid',
};

/**
 * ListSection — header + a list of items. The most flexible "content"
 * widget in the catalog. Used for case studies, careers roles, doc tile
 * grids, changelog releases, roadmap columns. Each item can optionally
 * link to a deeper page, turning the section into a navigable index.
 *
 * Layout: 'grid' (3-up cards on desktop) or 'list' (stacked, full-
 * width). The grid scales down to 2-up at tablet and 1-up at mobile.
 */
export default function ListSection({ data = {} }: { data?: ListSectionData }) {
    const d = { ...DEFAULTS, ...data };
    const items = Array.isArray(d.items) ? d.items : [];
    const isList = d.layout === 'list';

    return (
        <section
            data-section-id="list-section"
            data-section-type="ListSection"
            className="list-section"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                {(d.eyebrow || d.title || d.subtitle) && (
                    <header style={{ marginBottom: 32, maxWidth: 720 }}>
                        {d.eyebrow && (
                            <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>
                                {d.eyebrow}
                            </div>
                        )}
                        {d.title && (
                            <h2
                                className="display"
                                data-editable="title"
                                style={{
                                    fontSize: 'clamp(28px, 3vw, 40px)',
                                    marginBottom: d.subtitle ? 12 : 0,
                                }}
                            >
                                {d.title}
                            </h2>
                        )}
                        {d.subtitle && (
                            <p data-editable="subtitle" style={{ color: 'var(--ink-3)', lineHeight: 1.55 }}>
                                {d.subtitle}
                            </p>
                        )}
                    </header>
                )}

                {items.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gap: 16,
                            gridTemplateColumns: isList
                                ? '1fr'
                                : 'repeat(auto-fill, minmax(280px, 1fr))',
                        }}
                    >
                        {items.map((item, i) => {
                            const card = (
                                <article
                                    style={{
                                        background: '#fff',
                                        border: '1px solid var(--line, rgba(0,0,0,0.08))',
                                        borderRadius: 16,
                                        padding: 20,
                                        height: '100%',
                                        transition: 'transform 0.2s, border-color 0.2s',
                                    }}
                                    className="list-section-card"
                                >
                                    {item?.icon && (
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                fontSize: 22,
                                                marginBottom: 8,
                                                opacity: 0.9,
                                            }}
                                        >
                                            {item.icon}
                                        </div>
                                    )}
                                    {item?.title && (
                                        <h3
                                            style={{
                                                fontSize: 17,
                                                fontWeight: 700,
                                                marginBottom: 6,
                                            }}
                                        >
                                            {item.title}
                                        </h3>
                                    )}
                                    {item?.body && (
                                        <p
                                            style={{
                                                color: 'var(--ink-3)',
                                                lineHeight: 1.55,
                                                fontSize: 14,
                                            }}
                                        >
                                            {item.body}
                                        </p>
                                    )}
                                </article>
                            );

                            if (!item?.href) {
                                return <div key={i}>{card}</div>;
                            }
                            const isExternal = /^https?:\/\//i.test(item.href);
                            if (isExternal) {
                                return (
                                    <a
                                        key={i}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        {card}
                                    </a>
                                );
                            }
                            return (
                                <Link
                                    key={i}
                                    href={item.href}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    {card}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
