'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';

/**
 * Mirror of backend PackageCapabilities (backend/src/config/packages.ts).
 * Keep in sync when new capabilities are added.
 */
export interface Capabilities {
    themeCount: number; // -1 == unlimited
    pluginMarketplace: boolean;
    themeCodeEdit: boolean;
    visualThemeEditor: boolean;
    dashboardBranding: boolean;
    webhooks: boolean;
    collections: boolean;
    forms: boolean;
    analytics: boolean;
    auditLog: boolean;
    siteEditor: boolean;
    seoFull: boolean;
}

export interface PackageUsage {
    storageGB: number;
    teamMembers: number;
    activatedThemes?: number;
}

export interface PackageLimits {
    storageGB: number;
    teamMembers: number;
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    aiEnabled: boolean;
    themeCount: number;
}

export interface ActivePackage {
    id: string;
    name: string;
    tier: number;
    websiteType: 'personal' | 'organizational';
    supportLevel?: 'email' | 'priority' | 'dedicated';
}

interface CapabilitiesContextType {
    capabilities: Capabilities | null;
    usage: PackageUsage | null;
    limits: PackageLimits | null;
    activePackage: ActivePackage | null;
    isLoading: boolean;
    has: (cap: keyof Capabilities) => boolean;
    refresh: () => void;
}

const DEFAULT_CAPABILITIES: Capabilities = {
    themeCount: 1,
    pluginMarketplace: false,
    themeCodeEdit: false,
    visualThemeEditor: false,
    dashboardBranding: false,
    webhooks: false,
    collections: false,
    forms: false,
    analytics: false,
    auditLog: false,
    siteEditor: false,
    seoFull: false,
};

const CapabilitiesContext = createContext<CapabilitiesContextType>({
    capabilities: null,
    usage: null,
    limits: null,
    activePackage: null,
    isLoading: true,
    has: () => false,
    refresh: () => { },
});

export function CapabilitiesProvider({ children }: { children: React.ReactNode }) {
    const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
    const [usage, setUsage] = useState<PackageUsage | null>(null);
    const [limits, setLimits] = useState<PackageLimits | null>(null);
    const [activePackage, setActivePackage] = useState<ActivePackage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsage = useCallback(async () => {
        try {
            const data: any = await apiRequest('/packages/usage');
            if (data) {
                setCapabilities({ ...DEFAULT_CAPABILITIES, ...(data.capabilities ?? {}) });
                setUsage(data.usage ?? null);
                setLimits(data.limits ?? null);
                setActivePackage(data.package ?? null);
            }
        } catch {
            // Fail-closed: on error, show only default (Basic) capabilities.
            setCapabilities(DEFAULT_CAPABILITIES);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    const has = useCallback(
        (cap: keyof Capabilities): boolean => {
            // While loading, show items by default so the sidebar doesn't flash
            if (isLoading) return true;
            if (!capabilities) return false;
            const value = capabilities[cap];
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value === -1 || value > 0;
            return false;
        },
        [capabilities, isLoading],
    );

    return (
        <CapabilitiesContext.Provider
            value={{
                capabilities,
                usage,
                limits,
                activePackage,
                isLoading,
                has,
                refresh: fetchUsage,
            }}
        >
            {children}
        </CapabilitiesContext.Provider>
    );
}

export const useCapabilities = () => useContext(CapabilitiesContext);
