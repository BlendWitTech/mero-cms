export interface StatsData {
    /** Each item is `{ num: string; label: string }`. `num` may include
        inline HTML for tiny suffixes ("ms", "/5"). Some seed conventions
        use `value` instead of `num` — both are accepted. */
    items?: Array<{ num?: string; value?: string; label?: string }>;
}

const DEFAULTS: Required<StatsData> = {
    items: [
        { num: '600+', label: 'Teams shipping content with Mero CMS' },
        { num: '90<span style="font-size:.5em">ms</span>', label: 'Publish-to-live for visual edits' },
        { num: '12', label: 'Capabilities, gated per tier' },
        { num: '4.9<span style="font-size:.5em">/5</span>', label: 'Average customer rating across reviews' },
    ],
};

/**
 * Stats band — four big chunky numbers with brand-red emphasis. Each
 * number's `num` field can include inline HTML for tiny suffixes (e.g.
 * "ms" or "/5") so CMS editors don't have to ship two fields per stat.
 * Sanitised at render time? — currently trusted, since the field is
 * authored in the admin and not user-supplied.
 */
export default function Stats({ data = {} }: { data?: StatsData }) {
    const items = data.items?.length ? data.items : DEFAULTS.items;

    return (
        <section
            data-section-id="stats"
            data-section-type="Stats"
            style={{ padding: 0, background: 'var(--paper)' }}
        >
            <div className="container">
                <div className="stats reveal-stagger">
                    {items.map((stat, i) => {
                        // Accept both `num` (canonical) and `value` (seed
                        // convention used elsewhere in the codebase).
                        // Coerce to a string so React doesn't choke on
                        // numeric inputs from JSON.
                        const numHtml = String(stat?.num ?? stat?.value ?? '');
                        return (
                            <div key={i} className="stat">
                                <div className="stat-num display">
                                    {/* dangerouslySetInnerHTML demands a
                                        defined string. Skip the <em> entirely
                                        when there's no value to avoid the
                                        "must be in the form { __html }" runtime. */}
                                    {numHtml ? (
                                        <em dangerouslySetInnerHTML={{ __html: numHtml }} />
                                    ) : null}
                                </div>
                                {stat?.label && <div className="stat-label">{stat.label}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
