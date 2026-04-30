'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import ContractBrandingTab from '@/components/admin/ContractBrandingTab';

/**
 * Dashboard branding (Org Enterprise + Custom only). Customizes the *admin
 * UI* itself — primary/accent colors, heading/body fonts, logo. Distinct
 * from public-site branding (which lives at /dashboard/settings?tab=branding
 * and respects the active theme's contract).
 *
 * Why the rewrite
 *   • Previously this tab had its own custom layout (color preset chips,
 *     bespoke font dropdowns) that didn't match the rest of the admin's
 *     visual language. Now it runs through <ContractBrandingTab>, the
 *     same component used for site branding, so both share the same
 *     card layout, save/cancel UX, edit-mode toggle, and field renderer.
 *   • The contract is *defined inline* (not loaded from theme.json) since
 *     admin branding isn't theme-specific — it's a fixed set of admin keys
 *     that exist whether you have one theme or ten.
 *   • Saves go through /settings/admin-branding (the tier-gated endpoint)
 *     instead of the generic /settings, via the saveEndpoint prop.
 */

const FONT_OPTIONS = [
    'Inter',
    'Plus Jakarta Sans',
    'Manrope',
    'DM Sans',
    'Outfit',
    'Poppins',
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Nunito',
    'Raleway',
    'IBM Plex Sans',
    'Playfair Display',
    'Merriweather',
    'JetBrains Mono',
];

const ADMIN_BRANDING_CONTRACT = [
    {
        group: 'Identity',
        fields: [
            { key: 'admin_logo_url', label: 'Dashboard Logo', type: 'media' as const, fallback: null },
        ],
    },
    {
        group: 'Colors',
        fields: [
            { key: 'admin_primary_color', label: 'Primary Color', type: 'color' as const, fallback: '#2563eb', cssVar: '--admin-primary' },
            { key: 'admin_accent_color',  label: 'Accent Color',  type: 'color' as const, fallback: '#0ea5e9', cssVar: '--admin-accent'  },
        ],
    },
    {
        group: 'Typography',
        fields: [
            { key: 'admin_heading_font', label: 'Heading Font', type: 'font' as const, fallback: 'Plus Jakarta Sans', cssVar: '--admin-heading-font', options: FONT_OPTIONS },
            { key: 'admin_body_font',    label: 'Body Font',    type: 'font' as const, fallback: 'Inter',             cssVar: '--admin-body-font',    options: FONT_OPTIONS },
        ],
    },
];

export default function AdminBrandingTab() {
    const { settings, refreshSettings } = useSettings();
    const { has, isLoading: capsLoading } = useCapabilities();

    // Local mirror of admin branding keys so the contract component can
    // read/write without us forking SettingsContext. Sync from the global
    // settings once they load.
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!settings || Object.keys(settings).length === 0) return;
        setLocalSettings({
            admin_primary_color: settings.admin_primary_color,
            admin_accent_color:  settings.admin_accent_color,
            admin_heading_font:  settings.admin_heading_font,
            admin_body_font:     settings.admin_body_font,
            admin_logo_url:      settings.admin_logo_url,
        });
    }, [settings]);

    // While capabilities are loading, render nothing (avoid flash).
    if (capsLoading) return null;

    // Tier-gated: Org Enterprise + Custom only.
    if (!has('dashboardBranding')) {
        return (
            <div className="max-w-3xl mx-auto py-4">
                <UpgradePrompt
                    feature="dashboardBranding"
                    title="Brand the CMS dashboard"
                    description="Customize the admin dashboard's primary color, accent color, and heading/body fonts so the CMS matches your organization's brand. Available on the Organizational Enterprise plan."
                    minTier="Org Enterprise"
                />
            </div>
        );
    }

    return (
        <ContractBrandingTab
            settings={localSettings}
            setSettings={(updater) => {
                // Wrap updater so we trigger a settings refresh after save —
                // ContractBrandingTab calls setSettings on every keystroke,
                // but we only want to push to the global SettingsContext on
                // save (which it does internally via PATCH).
                setLocalSettings(prev => typeof updater === 'function' ? updater(prev) : updater);
            }}
            contract={ADMIN_BRANDING_CONTRACT}
            activeThemeName="dashboard"
            usage={null}
            saveEndpoint="/settings/admin-branding"
            bannerTitle="Dashboard branding"
            bannerSubtitle="Customize the admin UI itself — separate from your public-site branding."
            rightRail={
                <>
                    <div className="bg-emerald-50/50 dark:bg-emerald-500/[0.07] rounded-2xl p-8 relative overflow-hidden border border-emerald-100 dark:border-emerald-500/20 group">
                        <h4 className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">Enterprise feature</h4>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold font-display uppercase text-slate-900 dark:text-white">White-label dashboard</h3>
                        </div>
                        <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 leading-relaxed uppercase tracking-widest">
                            Match the admin dashboard to your organization's brand. Colors and fonts apply across every admin page.
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-8 relative overflow-hidden border border-slate-200 dark:border-white/[0.08]">
                        <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.2em] mb-3">Want full white-label?</h4>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Hide “Powered by Mero” too</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            White-label settings (footer text, hidden branding) live on the White Label tab.
                        </p>
                        <a
                            href="?tab=white-label"
                            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-slate-300 transition-colors"
                        >
                            White Label settings <ArrowUpRight className="h-3 w-3" />
                        </a>
                    </div>
                </>
            }
        />
    );
}
