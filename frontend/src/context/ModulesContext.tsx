'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ModulesContextType {
    enabledModules: string[];
    isModuleEnabled: (moduleName: string) => boolean;
    isLoading: boolean;
    refresh: () => void;
}

const ModulesContext = createContext<ModulesContextType>({
    enabledModules: [],
    isModuleEnabled: () => true,
    isLoading: true,
    refresh: () => { },
});

export function ModulesProvider({ children }: { children: React.ReactNode }) {
    const [enabledModules, setEnabledModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchModules = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/setup/enabled-modules`, { cache: 'no-store' });
            const data = await res.json();
            setEnabledModules(data.enabledModules || []);
        } catch {
            // If fetch fails, assume all modules enabled (graceful degradation)
            setEnabledModules([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    const isModuleEnabled = useCallback(
        (moduleName: string) => {
            // While loading, show everything (prevents flicker)
            if (isLoading) return true;
            return enabledModules.includes(moduleName);
        },
        [enabledModules, isLoading]
    );

    return (
        <ModulesContext.Provider
            value={{ enabledModules, isModuleEnabled, isLoading, refresh: fetchModules }}
        >
            {children}
        </ModulesContext.Provider>
    );
}

export const useModules = () => useContext(ModulesContext);
