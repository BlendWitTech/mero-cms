'use client';

import { useEffect } from 'react';
import {
    MSG_READY,
    MSG_SECTION_CLICK,
    MSG_FIELD_CLICK,
    MSG_FIELD_UPDATE,
    MSG_NAVIGATE,
    MSG_HIGHLIGHT,
    MSG_CLEAR_HIGHLIGHTS,
    MSG_RELOAD,
    type InboundMessage,
} from './protocol';

/**
 * Visual editor bridge.
 *
 * When the theme is loaded inside the admin's iframe with a non-empty
 * `?editMode=` query param (the admin sends its REVALIDATE_SECRET so
 * we don't accidentally turn editing on for someone who guesses
 * `?editMode=1`), this component:
 *
 *   1. Sends a `mero-editor:ready` message to the parent so the admin
 *      knows the theme has hydrated.
 *   2. Adds a hover outline + click handler to every element marked
 *      with `data-section-id` (whole section) or `data-editable`
 *      (single field). Clicking either posts a message back to the
 *      admin so it can open the field editor.
 *   3. Listens for `mero-editor:*` messages from the admin —
 *      `field-update` live-mutates a field, `navigate` switches the
 *      iframe to a different slug, `highlight` scrolls + flashes a
 *      section, `reload` does a full page reload.
 *
 * Wire protocol lives in `./protocol.ts` and is exported as
 * `@mero/theme-editor-bridge/protocol` so the admin can import the same
 * type strings without duplicating them.
 */

const HOVER_OUTLINE_STYLE  = 'outline: 2px dashed var(--brand, #cb172b); outline-offset: 4px; cursor: pointer;';
const ACTIVE_OUTLINE_STYLE = 'outline: 3px solid var(--brand, #cb172b); outline-offset: 4px; cursor: pointer;';

export interface EditorBridgeProps {
    /**
     * Override the query-param check. Defaults to looking for a
     * non-empty `editMode` value on the current URL — the admin sends
     * its REVALIDATE_SECRET in the param so a stranger can't trip the
     * bridge by adding `?editMode=1` to a public page.
     */
    isEditMode?: () => boolean;
}

export default function EditorBridge({ isEditMode }: EditorBridgeProps = {}) {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params  = new URLSearchParams(window.location.search);
        const enabled = isEditMode ? isEditMode() : !!params.get('editMode');
        if (!enabled) return;

        let activeTarget: HTMLElement | null = null;

        const post = (msg: Record<string, unknown>) => {
            try {
                window.parent.postMessage({ source: 'mero-theme', ...msg }, '*');
            } catch {
                /* parent might be cross-origin; ignore */
            }
        };

        // Tell the admin we're ready, including the current path so it
        // can sync its page selector.
        post({ type: MSG_READY, path: window.location.pathname });

        // ── Hover outlines ─────────────────────────────────────────
        const onMouseOver = (e: MouseEvent) => {
            const el = (e.target as HTMLElement)?.closest?.<HTMLElement>(
                '[data-section-id], [data-editable]',
            );
            if (!el || el === activeTarget) return;
            el.style.cssText += HOVER_OUTLINE_STYLE;
        };
        const onMouseOut = (e: MouseEvent) => {
            const el = (e.target as HTMLElement)?.closest?.<HTMLElement>(
                '[data-section-id], [data-editable]',
            );
            if (!el || el === activeTarget) return;
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.cursor = '';
        };

        // ── Click → message ────────────────────────────────────────
        const onClick = (e: MouseEvent) => {
            const editable = (e.target as HTMLElement)?.closest?.<HTMLElement>('[data-editable]');
            const section  = (e.target as HTMLElement)?.closest?.<HTMLElement>('[data-section-id]');
            if (!editable && !section) return;

            // Block default link/form behaviour while editing so clicking a
            // CTA inside the editor doesn't navigate the iframe away.
            e.preventDefault();
            e.stopPropagation();

            // Clear previous active outline.
            if (activeTarget) {
                activeTarget.style.outline = '';
                activeTarget.style.outlineOffset = '';
                activeTarget.style.cursor = '';
            }
            const target = editable || section!;
            target.style.cssText += ACTIVE_OUTLINE_STYLE;
            activeTarget = target;

            // Walk up to find the enclosing section even when only a field
            // was clicked — the admin needs both IDs to scope the editor.
            const enclosingSection =
                section ?? editable?.closest<HTMLElement>('[data-section-id]') ?? null;

            post({
                type: editable ? MSG_FIELD_CLICK : MSG_SECTION_CLICK,
                sectionId:   enclosingSection?.dataset.sectionId,
                sectionType: enclosingSection?.dataset.sectionType,
                fieldId:     editable?.dataset.editable,
            });
        };

        document.addEventListener('mouseover', onMouseOver, true);
        document.addEventListener('mouseout',  onMouseOut,  true);
        document.addEventListener('click',     onClick,     true);

        // ── Inbound messages from admin ────────────────────────────
        const onMessage = (e: MessageEvent<InboundMessage>) => {
            const msg = e.data as InboundMessage | undefined;
            if (!msg || typeof msg !== 'object') return;

            switch (msg.type) {
                case MSG_FIELD_UPDATE:
                    // Admin edited a field — live-mutate the DOM so the
                    // editor sees the change instantly. The actual save
                    // happens on the admin side via PUT /pages/by-slug/:slug.
                    if (msg.sectionId && msg.fieldId && typeof msg.value === 'string') {
                        const sel =
                            `[data-section-id="${CSS.escape(msg.sectionId)}"] ` +
                            `[data-editable="${CSS.escape(msg.fieldId)}"]`;
                        const el = document.querySelector<HTMLElement>(sel);
                        if (el) el.textContent = msg.value;
                    }
                    break;

                case MSG_NAVIGATE:
                    if (msg.slug) {
                        const path   = msg.slug === 'home' ? '/' : `/${msg.slug}`;
                        const search = window.location.search; // preserve ?editMode=…
                        window.location.href = `${path}${search}`;
                    }
                    break;

                case MSG_HIGHLIGHT:
                    if (msg.sectionId) {
                        const el = document.querySelector<HTMLElement>(
                            `[data-section-id="${CSS.escape(msg.sectionId)}"]`,
                        );
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.cssText += ACTIVE_OUTLINE_STYLE;
                            if (activeTarget && activeTarget !== el) {
                                activeTarget.style.outline = '';
                                activeTarget.style.outlineOffset = '';
                            }
                            activeTarget = el;
                        }
                    }
                    break;

                case MSG_CLEAR_HIGHLIGHTS:
                    if (activeTarget) {
                        activeTarget.style.outline = '';
                        activeTarget.style.outlineOffset = '';
                        activeTarget.style.cursor = '';
                        activeTarget = null;
                    }
                    break;

                case MSG_RELOAD:
                    window.location.reload();
                    break;
            }
        };

        window.addEventListener('message', onMessage);

        return () => {
            document.removeEventListener('mouseover', onMouseOver, true);
            document.removeEventListener('mouseout',  onMouseOut,  true);
            document.removeEventListener('click',     onClick,     true);
            window.removeEventListener('message', onMessage);
            if (activeTarget) {
                activeTarget.style.outline = '';
                activeTarget.style.outlineOffset = '';
                activeTarget.style.cursor = '';
            }
        };
    }, [isEditMode]);

    return null;
}
