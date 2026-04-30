/**
 * @mero/theme-editor-bridge — public surface.
 *
 * Two flavours of import:
 *
 *   import EditorBridge from '@mero/theme-editor-bridge';
 *   // ↑ default export, drop into your root layout
 *
 *   import { MSG_FIELD_UPDATE } from '@mero/theme-editor-bridge/protocol';
 *   // ↑ wire-protocol constants, used by the admin host page
 */

export { default, default as EditorBridge } from './EditorBridge';
export type { EditorBridgeProps } from './EditorBridge';

export {
    MSG_READY,
    MSG_SECTION_CLICK,
    MSG_FIELD_CLICK,
    MSG_FIELD_UPDATE,
    MSG_NAVIGATE,
    MSG_HIGHLIGHT,
    MSG_CLEAR_HIGHLIGHTS,
    MSG_RELOAD,
    DATA_SECTION_ID,
    DATA_SECTION_TYPE,
    DATA_EDITABLE,
    type OutboundMessage,
    type InboundMessage,
    type ReadyMessage,
    type SectionClickMessage,
    type FieldClickMessage,
    type FieldUpdateMessage,
    type NavigateMessage,
    type HighlightMessage,
    type ClearHighlightsMessage,
    type ReloadMessage,
} from './protocol';
