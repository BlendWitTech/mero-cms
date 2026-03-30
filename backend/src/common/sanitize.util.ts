import * as sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
    ...sanitizeHtml.defaults.allowedTags,
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'figure', 'figcaption',
    'iframe', 'video', 'source',
    'del', 'ins', 'kbd', 'mark', 'sup', 'sub',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
    ...sanitizeHtml.defaults.allowedAttributes,
    'img': ['src', 'alt', 'width', 'height', 'class', 'loading'],
    'a': ['href', 'name', 'target', 'rel', 'class'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title'],
    'video': ['src', 'controls', 'width', 'height', 'poster'],
    'source': ['src', 'type'],
    'td': ['colspan', 'rowspan', 'align'],
    'th': ['colspan', 'rowspan', 'align'],
    '*': ['class', 'id'],
};

/**
 * Sanitize user-supplied HTML (e.g. rich text editor output) before persisting.
 * Strips XSS vectors while preserving all typical blog formatting.
 */
export function sanitizeContent(html: string): string {
    if (!html) return html;
    return sanitizeHtml(html, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'www.loom.com'],
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    });
}
