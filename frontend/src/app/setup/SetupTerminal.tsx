/**
 * @deprecated The original SetupTerminal was promoted to a shared
 * admin component when the Danger Zone reset flow needed the same
 * streaming UX. This file remains as a re-export shim so any external
 * import (or stale local import path) continues to work.
 *
 * New code should import directly from
 * `@/components/admin/ProgressTerminal`.
 *
 * The shared component supports configurable `streamUrl`, `title`, and
 * `completionStage` props — the wizard passes setup-specific values,
 * the Danger Zone passes reset-specific values, but the rendering and
 * SSE plumbing are identical.
 */
export { default } from '@/components/admin/ProgressTerminal';
