'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCheck, ShieldCheck, Calendar, Sparkles, AlertTriangle, ArrowUpRight, Key, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useCapabilities } from '@/context/CapabilitiesContext';

/**
 * License management — paste, view, and replace the customer's CMS
 * license key. Drives /packages/license (read) and /packages/activate
 * (write). Persists via the same backend pipeline that the setup wizard
 * uses, so changing the key here updates setup.json + LICENSE_KEY env
 * for the running process.
 *
 * What the customer sees
 *   • Current tier, expiry date, days remaining
 *   • Capabilities currently unlocked (visual checklist)
 *   • A paste-in field to replace the key
 *   • A clear "what unlocks at the next tier" preview
 *
 * What's intentionally not here
 *   • Payment flow — that lives elsewhere (marketing site checkout or
 *     Stripe Customer Portal). This page only handles activation of an
 *     already-purchased key.
 */

interface LicenseInfo {
    valid: boolean;
    tier: number;
    domain: string | null;
    seats: number;
    expiresAt: string | null;
    daysRemaining: number | null;
    error?: string;
}

const TIER_NAMES: Record<number, string> = {
    1: 'Basic',
    2: 'Premium',
    3: 'Enterprise',
    4: 'Custom',
};

// Capability labels keyed by the same names used in CapabilitiesContext.
// Source of truth: backend/src/config/packages.ts.
const CAPABILITY_LABELS: Record<string, { label: string; minTier: number }> = {
    forms:             { label: 'Contact form + lead inbox',         minTier: 1 },
    pluginMarketplace: { label: 'Plugin marketplace',                  minTier: 2 },
    themeCodeEdit:     { label: 'Code-level theme editing',            minTier: 2 },
    webhooks:          { label: 'Webhooks',                            minTier: 2 },
    analytics:         { label: 'Analytics + dashboard charts',        minTier: 2 },
    auditLog:          { label: 'Audit log',                           minTier: 2 },
    siteEditor:        { label: 'Full site editor',                    minTier: 2 },
    seoFull:           { label: 'Full SEO suite',                      minTier: 2 },
    visualThemeEditor: { label: 'Visual theme editor',                 minTier: 3 },
    collections:       { label: 'Collections (custom content types)',  minTier: 3 },
    dashboardBranding: { label: 'Dashboard branding (white-label UI)', minTier: 3 },
};

export default function LicenseSettingsTab() {
    const { showToast } = useNotification();
    const { capabilities, refresh: refreshCaps } = useCapabilities();
    const [info, setInfo] = useState<LicenseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [keyInput, setKeyInput] = useState('');
    const [showReplace, setShowReplace] = useState(false);

    const fetchLicense = async () => {
        try {
            const data = await apiRequest('/packages/license', { skipNotification: true });
            setInfo(data);
        } catch {
            // No license endpoint or unauthenticated — leave info null.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLicense(); }, []);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyInput.trim()) {
            showToast('Paste a license key first.', 'error');
            return;
        }
        setActivating(true);
        try {
            const res = await apiRequest('/packages/activate', {
                method: 'POST',
                body: { key: keyInput.trim() },
            });
            showToast(res.message || 'License activated.', 'success');
            setKeyInput('');
            setShowReplace(false);
            await Promise.all([fetchLicense(), refreshCaps()]);
        } catch (err: any) {
            showToast(err?.message || 'Could not activate this key.', 'error');
        } finally {
            setActivating(false);
        }
    };

    const tier = info?.tier ?? 1;
    const tierName = TIER_NAMES[tier] ?? 'Basic';
    const expiresAt = info?.expiresAt ? new Date(info.expiresAt) : null;
    const daysRemaining = info?.daysRemaining;

    if (loading) {
        return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current tier + status */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-white/[0.06] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                <BadgeCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest">Active license</p>
                                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{tierName}</h2>
                            </div>
                        </div>
                        {info?.valid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck className="h-3 w-3" /> Valid
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
                                <AlertTriangle className="h-3 w-3" /> Free tier
                            </span>
                        )}
                    </div>

                    {/* Expiry strip */}
                    {expiresAt && (
                        <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expires</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{expiresAt.toLocaleDateString()}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Days remaining</p>
                                <p className={`text-sm font-bold ${(daysRemaining ?? 0) < 30 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                                    {daysRemaining ?? '—'}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Seats</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{info?.seats || '—'}</p>
                            </div>
                        </div>
                    )}

                    {/* Capabilities checklist */}
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">What you have access to</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(CAPABILITY_LABELS).map(([key, meta]) => {
                                const has = capabilities && (capabilities as any)[key];
                                return (
                                    <li
                                        key={key}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs ${
                                            has
                                                ? 'bg-emerald-50/60 dark:bg-emerald-500/5 text-emerald-800 dark:text-emerald-300'
                                                : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400'
                                        }`}
                                    >
                                        {has ? (
                                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                        ) : (
                                            <Lock className="h-3.5 w-3.5 shrink-0" />
                                        )}
                                        <span className="font-semibold">{meta.label}</span>
                                        {!has && (
                                            <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                {TIER_NAMES[meta.minTier]}+
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Activate / replace key */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Key className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {info?.valid ? 'Replace your license key' : 'Activate a license'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Paste the JWT-format license key you received after purchase. Verifies, persists to setup.json, and unlocks features without a restart.
                            </p>
                        </div>
                    </div>

                    {info?.valid && !showReplace ? (
                        <button
                            onClick={() => setShowReplace(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:border-indigo-400 transition-colors"
                        >
                            Replace key
                        </button>
                    ) : (
                        <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                className="flex-1 font-mono text-xs px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                                spellCheck={false}
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                disabled={activating}
                                className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-60"
                            >
                                {activating ? 'Activating…' : 'Activate'}
                            </button>
                            {showReplace && info?.valid && (
                                <button
                                    type="button"
                                    onClick={() => { setShowReplace(false); setKeyInput(''); }}
                                    disabled={activating}
                                    className="px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>

            {/* Right rail: upgrade nudge + receipts */}
            <div className="space-y-6">
                {tier < 4 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl p-7">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Upgrade to {TIER_NAMES[Math.min(tier + 1, 4)]}</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                            Unlocks{' '}
                            {Object.entries(CAPABILITY_LABELS)
                                .filter(([, meta]) => meta.minTier === tier + 1)
                                .map(([, meta]) => meta.label.toLowerCase())
                                .join(', ') || 'everything'}.
                        </p>
                        <a
                            href="https://mero.cms/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                        >
                            See pricing <ArrowUpRight className="h-3 w-3" />
                        </a>
                    </div>
                )}

                <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-7 border border-slate-200 dark:border-white/[0.08]">
                    <div className="flex items-center gap-3 mb-3">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maintenance</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Annual maintenance covers security patches and version upgrades. Without it, your CMS keeps running on the version you bought; only future updates are gated.
                    </p>
                </div>
            </div>
        </div>
    );
}
