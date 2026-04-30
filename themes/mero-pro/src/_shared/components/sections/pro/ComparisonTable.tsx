export interface ComparisonRow {
    feature?: string;
    description?: string;
    /** Same length as `columns`. Each cell is either a string label
        ("Yes" / "Coming soon" / "—") or a boolean — booleans render
        a checkmark / cross. */
    values?: Array<string | boolean>;
}

export interface ComparisonTableData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** Column headers — typically [your-product, competitor-1, competitor-2]. */
    columns?: string[];
    rows?: ComparisonRow[];
    /** Index of the "your product" column — gets the brand-coloured
        background highlight. Defaults to 0 (the first column). */
    highlightColumn?: number;
}

const DEFAULTS: Required<ComparisonTableData> = {
    eyebrow: '',
    title: 'How we compare',
    subtitle: '',
    columns: [],
    rows: [],
    highlightColumn: 0,
};

/**
 * ComparisonTable — Pro widget. Side-by-side feature comparison vs.
 * competitors. Booleans in `values` render check/cross glyphs; strings
 * render verbatim. The `highlightColumn` index gets a brand-soft
 * background to draw the eye.
 *
 * Use sparingly — comparison tables age fast and competitors don't
 * always appreciate being listed by name. Consider generic categories
 * ("Self-hosted CMS", "SaaS Builder") for safer evergreen content.
 */
export default function ComparisonTable({ data = {} }: { data?: ComparisonTableData }) {
    const d = { ...DEFAULTS, ...data, columns: data?.columns ?? DEFAULTS.columns, rows: data?.rows ?? DEFAULTS.rows };
    if (!d.columns.length || !d.rows.length) return null;

    return (
        <section
            data-section-id="comparison-table"
            data-section-type="ComparisonTable"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                {(d.eyebrow || d.title || d.subtitle) && (
                    <header style={{ marginBottom: 32, maxWidth: 640 }}>
                        {d.eyebrow && <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 8 }}>{d.eyebrow}</div>}
                        {d.title && (
                            <h2 className="display" data-editable="title" style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                                {d.title}
                            </h2>
                        )}
                        {d.subtitle && <p data-editable="subtitle" style={{ color: 'var(--ink-3)', marginTop: 12 }}>{d.subtitle}</p>}
                    </header>
                )}

                <div
                    style={{
                        overflowX: 'auto',
                        border: '1px solid var(--line, rgba(0,0,0,0.08))',
                        borderRadius: 16,
                        background: '#fff',
                    }}
                >
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 600,
                        }}
                    >
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--line, rgba(0,0,0,0.08))' }}>
                                <th style={cellStyle(true, false)}>Feature</th>
                                {d.columns.map((c, i) => (
                                    <th
                                        key={i}
                                        style={cellStyle(true, i === d.highlightColumn)}
                                    >
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {d.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri === d.rows.length - 1 ? 'none' : '1px solid var(--line, rgba(0,0,0,0.06))' }}>
                                    <td style={cellStyle(false, false)}>
                                        <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{row.feature}</div>
                                        {row.description && (
                                            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{row.description}</div>
                                        )}
                                    </td>
                                    {(row.values || []).map((v, ci) => (
                                        <td
                                            key={ci}
                                            style={cellStyle(false, ci === d.highlightColumn)}
                                        >
                                            {renderValue(v)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

function renderValue(v: string | boolean | undefined) {
    if (v === true)  return <span style={{ color: 'var(--brand, #cb172b)', fontWeight: 700 }}>✓</span>;
    if (v === false) return <span style={{ color: 'var(--ink-4, #9ca3af)' }}>—</span>;
    if (!v) return <span style={{ color: 'var(--ink-4, #9ca3af)' }}>—</span>;
    return <span style={{ fontSize: 14 }}>{String(v)}</span>;
}

function cellStyle(header: boolean, highlight: boolean): React.CSSProperties {
    return {
        padding: '14px 16px',
        textAlign: 'left',
        fontSize: header ? 13 : 14,
        fontWeight: header ? 700 : 400,
        color: header ? 'var(--ink-1)' : 'var(--ink-2)',
        background: highlight ? 'var(--brand-soft, rgba(203,23,43,0.04))' : undefined,
        textTransform: header ? 'uppercase' : 'none',
        letterSpacing: header ? '0.05em' : 'normal',
    };
}
