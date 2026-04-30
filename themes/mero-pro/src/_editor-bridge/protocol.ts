/**
 * @mero/theme-editor-bridge — wire protocol.
 *
 * This file is the source-of-truth for the postMessage contract between
 * a theme rendered inside the admin's iframe and the visual editor host
 * page. Both sides import from here so there's no chance of one drifting
 * away from the other.
 *
 * Direction conventions:
 *   * "outbound"  — theme → admin   (window.parent.postMessage)
 *   * "inbound"   — admin → theme   (window.postMessage to the iframe)
 *
 * All messages share the namespace `mero-editor:*` and are tagged with
 * `source: 'mero-theme'` (outbound) so the admin can ignore noise from
 * other iframes / browser extensions.
 */

// ── Message type strings ─────────────────────────────────────────────

/** Outbound — theme has hydrated and the bridge is listening. */
export const MSG_READY = 'mero-editor:ready' as const;

/** Outbound — user clicked an element with `data-section-id` (no `data-editable`). */
export const MSG_SECTION_CLICK = 'mero-editor:section-click' as const;

/** Outbound — user clicked an element with `data-editable`. */
export const MSG_FIELD_CLICK = 'mero-editor:field-click' as const;

/** Inbound — admin updated a single primitive field; live-mutate the DOM. */
export const MSG_FIELD_UPDATE = 'mero-editor:field-update' as const;

/** Inbound — admin selected a different page; switch the iframe URL. */
export const MSG_NAVIGATE = 'mero-editor:navigate' as const;

/** Inbound — admin wants the theme to scroll a section into view + outline it. */
export const MSG_HIGHLIGHT = 'mero-editor:highlight' as const;

/** Inbound — admin closed the inspector; clear any active outline. */
export const MSG_CLEAR_HIGHLIGHTS = 'mero-editor:clear-highlights' as const;

/** Inbound — admin saved a non-primitive change; full reload required. */
export const MSG_RELOAD = 'mero-editor:reload' as const;

// ── Outbound payload shapes ──────────────────────────────────────────

export interface ReadyMessage {
    source: 'mero-theme';
    type: typeof MSG_READY;
    /** Current pathname so the admin can sync its page selector. */
    path: string;
}

export interface SectionClickMessage {
    source: 'mero-theme';
    type: typeof MSG_SECTION_CLICK;
    sectionId?: string;
    sectionType?: string;
}

export interface FieldClickMessage {
    source: 'mero-theme';
    type: typeof MSG_FIELD_CLICK;
    sectionId?: string;
    sectionType?: string;
    fieldId?: string;
}

export type OutboundMessage =
    | ReadyMessage
    | SectionClickMessage
    | FieldClickMessage;

// ── Inbound payload shapes ───────────────────────────────────────────

export interface FieldUpdateMessage {
    type: typeof MSG_FIELD_UPDATE;
    sectionId: string;
    fieldId: string;
    /** Always a string — admin coerces primitives before sending. */
    value: string;
}

export interface NavigateMessage {
    type: typeof MSG_NAVIGATE;
    /** Slug, not URL. `home` is special-cased to `/`. */
    slug: string;
}

export interface HighlightMessage {
    type: typeof MSG_HIGHLIGHT;
    sectionId: string;
}

export interface ClearHighlightsMessage {
    type: typeof MSG_CLEAR_HIGHLIGHTS;
}

export interface ReloadMessage {
    type: typeof MSG_RELOAD;
}

export type InboundMessage =
    | FieldUpdateMessage
    | NavigateMessage
    | HighlightMessage
    | ClearHighlightsMessage
    | ReloadMessage;

// ── DOM marker conventions ───────────────────────────────────────────

/**
 * The bridge looks for elements matching either of these data attributes
 * to wire up hover outlines and click handlers. Theme components opt in
 * by adding the attributes; everything else is ignored.
 */
export const DATA_SECTION_ID    = 'data-section-id';
export const DATA_SECTION_TYPE  = 'data-section-type';
export const DATA_EDITABLE      = 'data-editable';
