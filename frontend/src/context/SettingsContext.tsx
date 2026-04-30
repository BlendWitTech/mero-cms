'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

interface SettingsContextType {
    settings: Record<string, string>;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = async () => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }
        // Guard 1: /settings is behind JwtAuthGuard + SETTINGS_VIEW. Skip
        // the fetch entirely on unauthenticated pages.
        if (!localStorage.getItem('token')) {
            setIsLoading(false);
            return;
        }
        // Guard 2: skip on routes that are explicitly public — login, setup,
        // reset-password, two-factor-setup. These mount the providers but
        // shouldn't trigger an authenticated fetch even if a (stale) token
        // is still in localStorage from a previous session.
        const path = window.location.pathname;
        const isPublicRoute = path === '/' || path.startsWith('/setup') ||
                              path.startsWith('/reset-password') || path.startsWith('/two-factor');
        if (isPublicRoute) {
            setIsLoading(false);
            return;
        }
        try {
            const data = await apiRequest('/settings', { skipNotification: true });
            if (data) {
                setSettings(data);
            }
        } catch (error: any) {
            // 401 = stale token from a previous session, almost always
            // because JWT_SECRET was rotated (e.g. secrets.json
            // regenerated on first boot). Clear the bad token so the
            // user lands on login cleanly instead of seeing the 401
            // every page load. Errors that aren't auth-related (5xx,
            // network) we just log and move on.
            const msg = String(error?.message || '');
            if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.includes('Session expired')) {
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
            } else {
                console.warn('[SettingsContext] Could not fetch settings:', msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!settings) return;
        const root = document.documentElement;

        // ── Public-site theme tokens ──────────────────────────────────────
        if (settings.primary_color) root.style.setProperty('--primary', settings.primary_color);
        if (settings.secondary_color) root.style.setProperty('--secondary', settings.secondary_color);
        if (settings.accent_color) root.style.setProperty('--accent', settings.accent_color);
        if (settings.heading_font) root.style.setProperty('--font-heading', settings.heading_font);
        if (settings.body_font) root.style.setProperty('--font-body', settings.body_font);

        // ── Global design tokens (Premium+ capability) ───────────────────
        // Typography scale — steps feed CSS vars --text-{sm,base,lg,xl,2xl,3xl}.
        // Units are px numbers in settings, rendered as px strings.
        const typeScale: Array<[string, string]> = [
            ['text_sm', '--text-sm'],
            ['text_base', '--text-base'],
            ['text_lg', '--text-lg'],
            ['text_xl', '--text-xl'],
            ['text_2xl', '--text-2xl'],
            ['text_3xl', '--text-3xl'],
        ];
        typeScale.forEach(([k, cssVar]) => {
            const v = (settings as any)[k];
            if (v !== undefined && v !== null && v !== '') {
                root.style.setProperty(cssVar, typeof v === 'number' ? `${v}px` : String(v));
            }
        });

        // Spacing scale — 8-step modular scale keyed --space-{1..8}.
        for (let i = 1; i <= 8; i++) {
            const v = (settings as any)[`space_${i}`];
            if (v !== undefined && v !== null && v !== '') {
                root.style.setProperty(`--space-${i}`, typeof v === 'number' ? `${v}px` : String(v));
            }
        }

        // ── Admin dashboard branding (Enterprise capability) ──────────────
        // Feature-gated server-side; client applies the vars whenever they
        // are present. Admin layout consumes via var(--admin-*).
        if (settings.admin_primary_color) {
            root.style.setProperty('--admin-primary', settings.admin_primary_color);
        }
        if (settings.admin_accent_color) {
            root.style.setProperty('--admin-accent', settings.admin_accent_color);
        }
        if (settings.admin_heading_font) {
            root.style.setProperty('--admin-heading-font', `'${settings.admin_heading_font}', system-ui, sans-serif`);
        }
        if (settings.admin_body_font) {
            root.style.setProperty('--admin-body-font', `'${settings.admin_body_font}', system-ui, sans-serif`);
        }

        // Dynamically load any admin Google Fonts that aren't already in the document.
        const fontsToLoad = [settings.admin_heading_font, settings.admin_body_font].filter(Boolean) as string[];
        for (const font of Array.from(new Set(fontsToLoad))) {
            const id = `admin-font-${font.replace(/\s+/g, '-')}`;
            if (document.getElementById(id)) continue;
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap`;
            document.head.appendChild(link);
        }
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
