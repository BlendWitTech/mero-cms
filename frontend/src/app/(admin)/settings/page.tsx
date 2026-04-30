'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
    GlobeAltIcon,
    KeyIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';

type Tab = 'branding' | 'license';

interface LicenseStatus {
    valid: boolean;
    tier: string;
    domain: string | null;
    seats: number;
    expiresAt: string | null;
    daysRemaining: number | null;
    error?: string;
}

const TIER_COLORS: Record<string, string> = {
    Basic:      'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-white/10',
    Premium:    'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/20',
    Enterprise: 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-500/20',
    Custom:     'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20',
};

function LicenseTab() {
    const [status, setStatus] = useState<LicenseStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/license/status')
            .then(setStatus)
            .catch(() => setStatus(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="content-skeleton h-32 rounded-3xl" />
                <div className="content-skeleton h-48 rounded-3xl" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-white/10 text-center">
                <XCircleIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Could not load license status.</p>
            </div>
        );
    }

    const tierLabel = typeof status.tier === 'number'
        ? (['', 'Basic', 'Premium', 'Enterprise', 'Custom'][status.tier] ?? 'Basic')
        : status.tier;

    const tierColor = TIER_COLORS[tierLabel] ?? TIER_COLORS.Basic;
    const expiryDate = status.expiresAt ? new Date(status.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    const isExpiringSoon = status.daysRemaining !== null && status.daysRemaining <= 30;

    return (
        <div className="space-y-6">
            {/* Status banner */}
            <div className={`flex items-center gap-4 p-6 rounded-3xl border-2 ${
                status.valid
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
            }`}>
                {status.valid
                    ? <CheckCircleIcon className="h-8 w-8 text-emerald-500 shrink-0" />
                    : <XCircleIcon className="h-8 w-8 text-red-500 shrink-0" />}
                <div>
                    <p className={`text-sm font-bold ${status.valid ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>
                        {status.valid ? 'License Active' : 'License Invalid'}
                    </p>
                    {status.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{status.error}</p>
                    )}
                    {status.valid && isExpiringSoon && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                            Expires in {status.daysRemaining} days — renew soon
                        </p>
                    )}
                </div>
            </div>

            {/* License details */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-slate-900 dark:bg-white/10 rounded-2xl text-white shadow-xl shadow-slate-900/20 dark:shadow-none">
                        <KeyIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">License Details</h3>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Your Mero CMS deployment license.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Tier</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tierColor}`}>
                            {tierLabel}
                        </span>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Licensed Domain</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{status.domain ?? '—'}</p>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">User Seats</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{status.seats}</p>
                    </div>

                    <div className={`p-5 rounded-2xl border ${
                        isExpiringSoon
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'
                    }`}>
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Expires</p>
                        {expiryDate ? (
                            <>
                                <p className={`text-sm font-bold ${isExpiringSoon ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{expiryDate}</p>
                                {status.daysRemaining !== null && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{status.daysRemaining} days remaining</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No expiry</p>
                        )}
                    </div>
                </div>

                {!status.valid && (
                    <div className="mt-6 p-5 bg-slate-900 dark:bg-white/5 rounded-2xl text-white dark:text-slate-300 text-center border border-transparent dark:border-white/10">
                        <p className="text-xs font-semibold mb-2">Need a license key?</p>
                        <p className="text-[10px] text-slate-400">Contact Blendwit to obtain or renew your LICENSE_KEY and add it to your server environment variables.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('branding');
    const [settings, setSettings] = useState({
        cms_title: '',
        cms_subtitle: '',
        cms_login_avatar: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useNotification();

    useEffect(() => {
        setIsLoading(true);
        apiRequest('/settings')
            .then(setSettings)
            .catch((e) => console.error('Failed to fetch settings:', e))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiRequest('/settings', { method: 'PATCH', body: settings });
            showToast('CMS Global Settings synchronized successfully.', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-10">
                <div className="content-skeleton h-12 w-48 rounded-xl" />
                <div className="content-skeleton h-96 rounded-[3rem]" />
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'branding', label: 'Branding', icon: <GlobeAltIcon className="h-4 w-4" /> },
        { id: 'license', label: 'License', icon: <KeyIcon className="h-4 w-4" /> },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="px-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
                    CMS Global <span className="text-blue-600 dark:text-blue-400 font-bold">Settings</span>
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-tight">Configure the administrative interface and licensing.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 -mb-px ${
                            activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-500/10'
                                : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                {activeTab === 'branding' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-[3rem] p-5 sm:p-8 lg:p-12 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-white/10 space-y-10 relative group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                        <GlobeAltIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">Interface Branding</h3>
                                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Manage titles and visuals for the CMS login and dashboard.</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">CMS Master Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-sm py-4 px-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                                            value={settings.cms_title}
                                            onChange={(e) => setSettings({ ...settings, cms_title: e.target.value })}
                                            placeholder="MERO CMS"
                                        />
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">Appears on the login screen and sidebar.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">CMS Subtitle</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-sm py-4 px-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                                            value={settings.cms_subtitle}
                                            onChange={(e) => setSettings({ ...settings, cms_subtitle: e.target.value })}
                                            placeholder="Premium Management Console"
                                        />
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">Secondary title shown below the main title on login.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">Login Avatar Path</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-sm py-4 px-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                                            value={settings.cms_login_avatar}
                                            onChange={(e) => setSettings({ ...settings, cms_login_avatar: e.target.value })}
                                            placeholder="/assets/logo.png"
                                        />
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">Public path to the illustration/logo shown on the login page.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                                    >
                                        {isSaving ? 'Synchronizing…' : 'Save Global Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative shadow-2xl shadow-slate-900/40 dark:shadow-black/40 group">
                                <h3 className="text-xl font-bold font-display relative z-10">System Status</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-2 relative z-10 leading-relaxed mb-8">Global settings control the master identity of this administrative instance.</p>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Environment</span>
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Production</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'license' && (
                    <div className="max-w-2xl">
                        <LicenseTab />
                    </div>
                )}
            </div>
        </div>
    );
}
