'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CapabilityMap } from '../lib/api';

/**
 * Capability provider — server-fetched, client-readable.
 *
 * Pattern: a Server Component (likely app/layout.tsx) fetches the
 * capabilities map via `getCapabilities()`, passes it as a prop into
 * this provider, and any Client Component below the tree can read it
 * with `useCapabilities()`. Server Components don't need this — they
 * can call `getCapabilities()` directly.
 *
 * The provider exposes a tiny API:
 *   - `caps.has(name)`    — boolean check on a specific capability
 *   - `caps.limit(key)`   — read a numeric/boolean limit
 *   - `caps.tier`         — package tier (1–5) for tier-comparison
 *   - `caps.plugins`      — list of installed plugin slugs
 *   - `caps.raw`          — full CapabilityMap if a component needs more
 *
 * Returns sensible defaults (all capabilities false, tier 0, no
 * plugins) when no provider is mounted, so components can safely
 * call `useCapabilities()` without crashing in test contexts.
 */
interface CapabilitiesAPI {
    has: (capability: string) => boolean;
    limit: <K extends keyof CapabilityMap['limits']>(key: K) => CapabilityMap['limits'][K];
    tier: number;
    plugins: string[];
    raw: CapabilityMap | null;
}

const DEFAULT_LIMITS: CapabilityMap['limits'] = {
    storageGB: 0,
    teamMembers: 1,
    hasWhiteLabel: false,
    hasApiAccess: false,
    aiEnabled: false,
    themeCount: 1,
};

const DEFAULT_API: CapabilitiesAPI = {
    has: () => false,
    limit: <K extends keyof CapabilityMap['limits']>(key: K): CapabilityMap['limits'][K] => DEFAULT_LIMITS[key],
    tier: 0,
    plugins: [],
    raw: null,
};

const CapabilitiesContext = createContext<CapabilitiesAPI>(DEFAULT_API);

export function CapabilitiesProvider({
    capabilities,
    children,
}: {
    capabilities: CapabilityMap | null;
    children: ReactNode;
}) {
    const api: CapabilitiesAPI = capabilities
        ? {
              has: (cap) => Boolean(capabilities.capabilities?.[cap]),
              limit: <K extends keyof CapabilityMap['limits']>(key: K): CapabilityMap['limits'][K] =>
                  (capabilities.limits?.[key] ?? DEFAULT_LIMITS[key]) as CapabilityMap['limits'][K],
              tier: capabilities.package?.tier ?? 0,
              plugins: capabilities.installedPlugins || [],
              raw: capabilities,
          }
        : DEFAULT_API;

    return <CapabilitiesContext.Provider value={api}>{children}</CapabilitiesContext.Provider>;
}

export function useCapabilities(): CapabilitiesAPI {
    return useContext(CapabilitiesContext);
}

/**
 * Convenience: gate a render on a capability flag. Renders children
 * when the flag is true; renders `fallback` (default null) otherwise.
 */
export function CapabilityGate({
    capability,
    children,
    fallback = null,
}: {
    capability: string;
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const caps = useCapabilities();
    return caps.has(capability) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Convenience: gate on tier. Renders children when the active tier
 * is at least `min`; renders `fallback` otherwise.
 */
export function TierGate({
    min,
    children,
    fallback = null,
}: {
    min: number;
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const caps = useCapabilities();
    return caps.tier >= min ? <>{children}</> : <>{fallback}</>;
}
