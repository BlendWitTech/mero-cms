'use client';

import { useEffect, useState } from 'react';
import { Lock, Sparkles, Save, RotateCcw, Eye } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import { useNotification } from '@/context/NotificationContext';
import PoweredByBadge from '@/components/ui/PoweredByBadge';

interface WhiteLabelValues {
    whitelabel_hide_powered_by: string; // "true" | "false" stored as string in the KV
    whitelabel_footer_text: string;
}

const DEFAULTS: WhiteLabelValues = {
    whitelabel_hide_powered_by: 'false',
    whitelabel_footer_text: '',
};

/**
 * Settings → White Label tab.
 *
 * Visible on every tier but the form is only interactive for plans that
 * include `hasWhiteLabel`. Lower tiers see an upsell card — consistent with
 * how UpgradePrompt handles other gated features.
 */
export default function WhiteLabelTab() {
    const { settings, refreshSettings } = useSettings();
    const { limits, activePackage, isLoading: capsLoading } = useCapabilities();
    const { showToast } = useNotification();

    const [values, setValues] = useState<WhiteLabelValues>(DEFAULTS);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Hydrate from backend once settings arrive
    useEffect(() => {
        if (!settings || Object.keys(settings).length === 0) return;
        setValues({
            whitelabel_hide_powered_by: settings.whitelabel_hide_powered_by || 'false',
            whitelabel_footer_text: settings.whitelabel_footer_text || '',
        });
        setDirty(false);
    }, [settings]);

    const canUseFeature = limits?.hasWhiteLabel === true;

    const patch = (key: keyof WhiteLabelValues, value: string) => {
        setValues((v) => ({ ...v, [key]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!canUseFeature) return;
        setSaving(true);
        try {
            await apiRequest('/settings', { method: 'PATCH', body: values });
            await refreshSettings();
            setDirty(false);
            showToast('White-label settings saved.', 'success');
        } catch (err: any) {
            showToast(err?.message || 'Failed to save white-label settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setValues(DEFAULTS);
        setDirty(true);
    };

    // ─── Upsell for lower tiers ───────────────────────────────────────────────
    if (!capsLoading && !canUseFeature) {
        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                                    Enterprise / Custom only
                                </span>
                            </div>
                            <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                                Remove Mero CMS branding
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Hide the “Powered by Mero CMS” footer across the admin, login, and registration
                                screens, and optionally replace it with your own copy. Available on Personal
                                Custom, Org Enterprise, and Org Custom plans.
                            </p>
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                                Not available on {activePackage?.name ?? 'your current'} plan.
                            </p>
                            <div className="mt-5">
                                <Link
                                    href="/dashboard/settings?tab=billing"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition"
                                >
                                    View plans →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Form (Enterprise / Custom tiers) ─────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06] space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 dark:bg-white rounded-xl text-white dark:text-slate-900">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">White Label</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Own the attribution. Hide our badge or replace it with yours.
                        </p>
                    </div>
                </div>

                {/* Hide Powered By toggle */}
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-white/[0.06] cursor-pointer hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                    <div className="relative mt-0.5">
                        <input
                            type="checkbox"
                            checked={values.whitelabel_hide_powered_by === 'true'}
                            onChange={(e) =>
                                patch('whitelabel_hide_powered_by', e.target.checked ? 'true' : 'false')
                            }
                            className="peer sr-only"
                        />
                        <div className="w-10 h-6 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-blue-600 transition-colors relative">
                            <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white peer-checked:translate-x-4 transition-transform" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="font-black text-sm text-slate-900 dark:text-white">
                            Hide “Powered by Mero CMS”
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Removes the attribution badge from the admin footer, login, register, and
                            password-reset screens.
                        </div>
                    </div>
                </label>

                {/* Custom footer text */}
                <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                        Custom footer text
                    </label>
                    <input
                        type="text"
                        value={values.whitelabel_footer_text}
                        onChange={(e) => patch('whitelabel_footer_text', e.target.value)}
                        placeholder="© 2026 Your Company. All rights reserved."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.07] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Optional. Shown where the Mero badge would be. Leave empty to just hide the badge.
                    </p>
                </div>

                {/* Live preview */}
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                        <Eye className="w-3 h-3" />
                        Live preview
                    </div>
                    {/* This preview reads directly from local form state so the user sees the change
                        before they hit Save. We fake it via inline logic — PoweredByBadge reads from
                        persisted settings, which haven't been updated yet. */}
                    <div className="py-4 px-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/[0.06]">
                        {values.whitelabel_footer_text.trim() ? (
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                {values.whitelabel_footer_text.trim()}
                            </p>
                        ) : values.whitelabel_hide_powered_by === 'true' ? (
                            <p className="text-[11px] font-medium text-slate-300 dark:text-slate-600 italic">
                                (badge hidden)
                            </p>
                        ) : (
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                Powered by{' '}
                                <span className="text-slate-500 dark:text-slate-400 font-bold">Mero CMS</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        className="btn-primary flex-1 py-2.5 text-sm gap-2"
                    >
                        {saving ? (
                            <RotateCcw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        className="btn-outline px-5 py-2.5 text-sm"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Quiet demonstration of what the real badge looks like right now */}
            <div className="text-center py-4">
                <PoweredByBadge />
            </div>
        </div>
    );
}
