/**
 * Compatibility shim — the actual implementation lives in the inlined
 * `_editor-bridge` package alongside this _shared bundle. Kept so any
 * legacy deep imports of `_shared/components/EditorBridge` keep
 * working without touching the public surface in `_shared/index.ts`.
 */
export { default, default as EditorBridge } from '../../_editor-bridge';
export type { EditorBridgeProps } from '../../_editor-bridge';
