export interface VideoEmbedData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** YouTube / Vimeo URL OR a direct .mp4. The component normalises
        common share-link forms into the iframe-embed equivalent. */
    url?: string;
    /** Optional poster image shown until the user clicks. Skipped for
        provider-side embeds where the player has its own thumbnail. */
    poster?: string;
    aspectRatio?: '16 / 9' | '4 / 3' | '1 / 1' | '21 / 9';
}

const DEFAULTS: Required<VideoEmbedData> = {
    eyebrow: '',
    title: '',
    subtitle: '',
    url: '',
    poster: '',
    aspectRatio: '16 / 9',
};

/**
 * VideoEmbed — Pro widget. Drops in a YouTube / Vimeo / MP4 video.
 * Pure server component — no client JS needed; the iframe handles all
 * playback. Accepts the URL forms editors actually paste (watch?v=…,
 * youtu.be/…, vimeo.com/<id>) and normalises them to the embed form.
 */
export default function VideoEmbed({ data = {} }: { data?: VideoEmbedData }) {
    const d = { ...DEFAULTS, ...data };
    const embedUrl = toEmbedUrl(d.url);
    if (!embedUrl) {
        return (
            <section
                data-section-id="video"
                data-section-type="VideoEmbed"
                style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
            >
                <div className="container">
                    <p style={{ color: 'var(--ink-3)' }}>Add a video URL in the editor to render this section.</p>
                </div>
            </section>
        );
    }
    const isMp4 = /\.mp4($|\?)/i.test(embedUrl);

    return (
        <section
            data-section-id="video"
            data-section-type="VideoEmbed"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div className="container">
                {(d.eyebrow || d.title || d.subtitle) && (
                    <header style={{ marginBottom: 24, maxWidth: 720 }}>
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
                        position: 'relative',
                        aspectRatio: d.aspectRatio,
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: '#000',
                    }}
                >
                    {isMp4 ? (
                        <video
                            src={embedUrl}
                            poster={d.poster || undefined}
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <iframe
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{ width: '100%', height: '100%', border: 0 }}
                            loading="lazy"
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

function toEmbedUrl(raw: string): string {
    if (!raw) return '';
    // YouTube — watch?v= / youtu.be / shorts/
    const ytMatch = raw.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{6,})/);
    if (ytMatch && /youtu/.test(raw)) {
        return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }
    // Vimeo — vimeo.com/<id>
    const vmMatch = raw.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) {
        return `https://player.vimeo.com/video/${vmMatch[1]}`;
    }
    // Direct file or already-embed form
    return raw;
}
