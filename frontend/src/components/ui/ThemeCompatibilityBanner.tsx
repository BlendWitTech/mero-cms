'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';

interface ThemeCompatibilityBannerProps {
    moduleName: string; // e.g., 'timeline', 'team', 'services', 'testimonials'
    displayName?: string; // e.g., 'Timeline'
}

export default function ThemeCompatibilityBanner({ moduleName, displayName }: ThemeCompatibilityBannerProps) {
    const { settings } = useSettings();
    const [themeConfig, setThemeConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const activeTheme = settings['active_theme'];
    const sectionName = displayName || moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

    useEffect(() => {
        const fetchThemeConfig = async () => {
            if (!activeTheme) return;
            try {
                const config = await apiRequest('/themes/active/config', { skipNotification: true });
                setThemeConfig(config);
            } catch (error) {
                console.error('Failed to fetch active theme config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchThemeConfig();
    }, [activeTheme]);

    if (isLoading || !themeConfig) return null;

    const supportedModules = themeConfig.modules || [];
    const isSupported = supportedModules.includes(moduleName);

    if (isSupported) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
            <div className="bg-amber-100 p-2.5 rounded-xl shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
                <h3 className="text-base font-bold text-amber-900 leading-none">Theme Compatibility Notice</h3>
                <p className="text-sm font-semibold text-amber-700 mt-2">
                    The currently active theme <span className="underline decoration-2 underline-offset-2 capitalize">"{activeTheme}"</span> does not support the <span className="font-bold underline">"{sectionName}"</span> module.
                </p>
                <p className="text-xs font-medium text-amber-600/80 mt-1">
                    Any content you create or edit here will not be visible on the live website while this theme is active.
                </p>
            </div>
        </div>
    );
}

// Helper hook to check compatibility and disable actions
export function useThemeCompatibility(moduleName: string) {
    const { settings } = useSettings();
    const [isSupported, setIsSupported] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const activeTheme = settings['active_theme'];

    useEffect(() => {
        const checkCompatibility = async () => {
            if (!activeTheme) {
                setIsLoading(false);
                return;
            }
            try {
                const config = await apiRequest('/themes/active/config', { skipNotification: true });
                const modules = config?.modules || [];
                setIsSupported(modules.includes(moduleName));
            } catch (error) {
                console.error('Failed to check theme compatibility:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkCompatibility();
    }, [activeTheme, moduleName]);

    return { isSupported, isLoading, activeTheme };
}
