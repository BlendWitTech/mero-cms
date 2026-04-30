export interface RichContentData {
    eyebrow?: string;
    title?: string;
    /** Body text. Supports a tiny subset of Markdown: lines starting
        with `## ` become h2s, blank lines split paragraphs, `**bold**`
        becomes <strong>, `[label](url)` becomes a link. Anything fancier
        (tables, code blocks, images) should live in a custom widget. */
    body?: string;
}

const DEFAULTS: Required<RichContentData> = {
    eyebrow: '',
    title: '',
    body: 'Tell your story here. Use blank lines between paragraphs, `## ` for headings, **double-asterisks** for bold, and `[label](url)` for links.',
};

/**
 * Lightweight Markdown-ish renderer. We deliberately don't pull in a
 * full Markdown lib — it's overkill for the legal-page / about-page /
 * docs-blurb use case, and adds 30kB of JS to every page that ships
 * this widget. The grammar is small enough to maintain inline.
 */
function renderMarkdownish(src: string): React.ReactNode {
    if (!src) return null;
    // Split into "blocks" separated by blank lines.
    const blocks = src.split(/\n\s*\n+/);
    return blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        // ## heading
        if (trimmed.startsWith('## ')) {
            return (
                <h2 key={i} style={{ marginTop: 32, marginBottom: 12, fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 700 }}>
                    {renderInline(trimmed.slice(3))}
                </h2>
            );
        }
        // # heading (rare in body, but support it)
        if (trimmed.startsWith('# ')) {
            return (
                <h1 key={i} style={{ marginTop: 24, marginBottom: 12 }}>
                    {renderInline(trimmed.slice(2))}
                </h1>
            );
        }
        // - / * bullet list
        if (/^[-*] /m.test(trimmed)) {
            const items = trimmed.split(/\n/).map((l) => l.replace(/^[-*]\s*/, ''));
            return (
                <ul key={i} style={{ paddingLeft: 24, margin: '12px 0', listStyle: 'disc' }}>
                    {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
                </ul>
            );
        }
        // Paragraph
        return (
            <p key={i} style={{ marginBottom: 16, color: 'var(--ink-2)', lineHeight: 1.65 }}>
                {renderInline(trimmed)}
            </p>
        );
    });
}

/** Inline parsing for **bold** and [label](url). */
function renderInline(s: string): React.ReactNode {
    // Tokenize: split on bold and link patterns simultaneously.
    const tokens: React.ReactNode[] = [];
    let rest = s;
    let key = 0;
    // Process **bold** first because the regex for links shouldn't
    // match inside ** markers.
    while (rest.length) {
        const boldMatch = rest.match(/\*\*([^*]+)\*\*/);
        const linkMatch = rest.match(/\[([^\]]+)\]\(([^)]+)\)/);
        const boldIdx = boldMatch?.index ?? Infinity;
        const linkIdx = linkMatch?.index ?? Infinity;
        const next = Math.min(boldIdx, linkIdx);
        if (next === Infinity) {
            tokens.push(rest);
            break;
        }
        if (next > 0) tokens.push(rest.slice(0, next));
        if (boldIdx <= linkIdx && boldMatch) {
            tokens.push(<strong key={key++}>{boldMatch[1]}</strong>);
            rest = rest.slice(boldIdx + boldMatch[0].length);
        } else if (linkMatch) {
            tokens.push(
                <a key={key++} href={linkMatch[2]} style={{ color: 'var(--link)', textDecoration: 'underline' }}>
                    {linkMatch[1]}
                </a>,
            );
            rest = rest.slice(linkIdx + linkMatch[0].length);
        }
    }
    return tokens;
}

/**
 * RichContent — long-form prose section. Used for legal pages, about-
 * page intros, doc blurbs. The grammar is intentionally tiny (paragraphs,
 * `##` headings, bullet lists, **bold**, links) so it stays editor-
 * friendly without a full Markdown toolbar.
 */
export default function RichContent({ data = {} }: { data?: RichContentData }) {
    const d = { ...DEFAULTS, ...data };

    return (
        <section
            data-section-id="rich-content"
            data-section-type="RichContent"
            className="rich-content"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container" style={{ maxWidth: 720 }}>
                {d.eyebrow && (
                    <div className="section-eyebrow" data-editable="eyebrow" style={{ marginBottom: 12 }}>
                        {d.eyebrow}
                    </div>
                )}
                {d.title && (
                    <h2
                        className="display"
                        data-editable="title"
                        style={{
                            fontSize: 'clamp(28px, 3vw, 40px)',
                            marginBottom: 24,
                        }}
                    >
                        {d.title}
                    </h2>
                )}
                <div style={{ fontSize: 16 }}>
                    {renderMarkdownish(d.body)}
                </div>
            </div>
        </section>
    );
}
