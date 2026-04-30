'use client';

import React, { useState, useEffect } from 'react';
import {
    Zap,
    Shield,
    Check,
    ShieldCheck,
    History,
    ArrowUpRight,
    ArrowRight,
    Key,
    Info,
    Smartphone,
    Users,
    Tag,
    Pencil,
    X,
    Plus,
    Trash2,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

// ── Package editing types ────────────────────────────────────────────────────
interface Package {
    id: string;
    name: string;
    websiteType: 'personal' | 'organizational';
    tier: number;
    aiEnabled: boolean;
    priceNPR: number | { min: number; max: number } | 'custom';
    tagline: string;
    features: string[];
    comingSoon: string[];
    supportLevel: string;
    highlighted: boolean;
    storageLimitGB: number;
    teamLimit: number;
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    isActive: boolean;
}

type PriceType = 'flat' | 'range' | 'custom';

function getPriceType(p: Package['priceNPR']): PriceType {
    if (p === 'custom') return 'custom';
    if (typeof p === 'object') return 'range';
    return 'flat';
}

function formatPrice(p: Package['priceNPR']): string {
    if (p === 'custom') return 'Custom';
    if (typeof p === 'object') return `Rs ${p.min.toLocaleString()}–${p.max.toLocaleString()}`;
    if (p === 0) return 'Free';
    return `Rs ${(p as number).toLocaleString()}`;
}

const TIER_LABELS: Record<number, string> = { 1: 'Basic', 2: 'Premium', 3: 'Professional', 4: 'Custom' };

export default function BillingPage() {
    const [activeTab, setActiveTab] = useState<'plan' | 'packages'>('plan');
    const [usage, setUsage] = useState<any>(null);
    const [licenseInfo, setLicenseInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activationKey, setActivationKey] = useState('');
    const [isActivating, setIsActivating] = useState(false);

    // Package management state
    const [packages, setPackages] = useState<Package[]>([]);
    const [pkgLoading, setPkgLoading] = useState(false);
    const [pkgType, setPkgType] = useState<'personal' | 'organizational'>('personal');
    const [editingPkg, setEditingPkg] = useState<Package | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [newFeature, setNewFeature] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const { showToast } = useNotification();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usageData, licenseData] = await Promise.all([
                apiRequest('/packages/usage'),
                apiRequest('/packages/license').catch(() => null)
            ]);
            setUsage(usageData);
            setLicenseInfo(licenseData);
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        setPkgLoading(true);
        try {
            const data = await apiRequest('/packages');
            setPackages(Array.isArray(data) ? data : []);
        } catch { showToast('Failed to load packages', 'error'); }
        finally { setPkgLoading(false); }
    };

    useEffect(() => {
        fetchData();
        fetchPackages();
    }, []);

    function openEdit(pkg: Package) {
        const pt = getPriceType(pkg.priceNPR);
        setEditForm({
            name: pkg.name,
            tagline: pkg.tagline,
            priceType: pt,
            priceFlat: pt === 'flat' ? (pkg.priceNPR as number) : 0,
            priceMin: pt === 'range' ? (pkg.priceNPR as any).min : 0,
            priceMax: pt === 'range' ? (pkg.priceNPR as any).max : 0,
            aiEnabled: pkg.aiEnabled,
            highlighted: pkg.highlighted,
            isActive: pkg.isActive,
            supportLevel: pkg.supportLevel,
            storageLimitGB: pkg.storageLimitGB,
            teamLimit: pkg.teamLimit,
            hasWhiteLabel: pkg.hasWhiteLabel,
            hasApiAccess: pkg.hasApiAccess,
            features: [...pkg.features],
            comingSoon: [...(pkg.comingSoon || [])],
        });
        setEditingPkg(pkg);
    }

    function buildPriceNPR(): Package['priceNPR'] {
        if (editForm.priceType === 'custom') return 'custom';
        if (editForm.priceType === 'range') return { min: editForm.priceMin, max: editForm.priceMax };
        return editForm.priceFlat;
    }

    async function handleSavePkg() {
        if (!editingPkg) return;
        setIsSaving(true);
        try {
            await apiRequest(`/packages/${editingPkg.id}`, {
                method: 'PATCH',
                body: {
                    name: editForm.name, tagline: editForm.tagline,
                    priceNPR: buildPriceNPR(),
                    aiEnabled: editForm.aiEnabled, highlighted: editForm.highlighted,
                    isActive: editForm.isActive, supportLevel: editForm.supportLevel,
                    storageLimitGB: editForm.storageLimitGB, teamLimit: editForm.teamLimit,
                    hasWhiteLabel: editForm.hasWhiteLabel, hasApiAccess: editForm.hasApiAccess,
                    features: editForm.features, comingSoon: editForm.comingSoon,
                },
            });
            showToast('Package updated', 'success');
            setEditingPkg(null);
            fetchPackages();
        } catch (err: any) { showToast(err?.message || 'Save failed', 'error'); }
        finally { setIsSaving(false); }
    }

    async function handleResetPackages() {
        if (!confirm('Reset all packages to defaults? This cannot be undone.')) return;
        setIsResetting(true);
        try {
            await apiRequest('/packages/reset-defaults', { method: 'POST' });
            showToast('Packages reset to defaults', 'success');
            fetchPackages();
        } catch { showToast('Reset failed', 'error'); }
        finally { setIsResetting(false); }
    }

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activationKey) return;

        setIsActivating(true);
        try {
            const res = await apiRequest('/packages/activate', {
                method: 'POST',
                body: { key: activationKey },
            });
            showToast(res.message || 'License activated successfully!', 'success');
            setActivationKey('');
            fetchData(); // Refresh plan data
        } catch (error: any) {
            showToast(error.message || 'Invalid or expired license key.', 'error');
        } finally {
            setIsActivating(false);
        }
    };

    if (loading) return (
        <div className="space-y-10 animate-pulse p-10">
            <div className="h-12 w-48 bg-slate-100 dark:bg-white/5 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 h-96 bg-slate-100 dark:bg-white/5 rounded-2xl" />
                <div className="h-96 bg-slate-100 dark:bg-white/5 rounded-2xl" />
            </div>
        </div>
    );

    const storagePercent = usage ? Math.min(100, (usage.usage.storageGB / usage.limits.storageGB) * 100) : 0;
    const teamPercent = usage ? Math.min(100, (usage.usage.teamMembers / usage.limits.teamMembers) * 100) : 0;
    const filteredPkgs = packages.filter(p => p.websiteType === pkgType);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header + Tab switcher */}
            <div className="px-5 sm:px-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter font-display uppercase">
                        Plan & <span className="text-blue-600">Infrastructure</span>
                    </h1>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.25em] opacity-60">Resource Quotas / Subscription Management</p>
                </div>
                <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 self-start sm:self-auto">
                    {([['plan', 'Plan & Usage'], ['packages', 'Manage Pricing']] as const).map(([t, label]) => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── MANAGE PRICING TAB ─────────────────────────────────────────── */}
            {activeTab === 'packages' && (
                <div className="px-5 sm:px-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                            {(['personal', 'organizational'] as const).map(t => (
                                <button key={t} onClick={() => setPkgType(t)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${pkgType === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                    {t === 'personal' ? '👤 Individual' : '🏢 Organization'}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleResetPackages} disabled={isResetting}
                            className="btn-outline flex items-center gap-2 px-3 py-1.5 text-xs"
                        >
                            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                            Reset to Defaults
                        </button>
                    </div>

                    {pkgLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px] text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                            <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Package Tier</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price (NPR)</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Storage & Team Limits</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                            <th className="pr-10 py-5 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {filteredPkgs.map(pkg => (
                                            <tr key={pkg.id} className={`group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${!pkg.isActive ? 'opacity-50' : ''}`}>
                                                <td className="pl-10 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${usage?.package?.id === pkg.id ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : pkg.highlighted ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                            {usage?.package?.id === pkg.id ? <Check className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{pkg.name}</h3>
                                                                {pkg.aiEnabled && <Sparkles className="h-3 w-3 text-amber-500" />}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                                                                    {TIER_LABELS[pkg.tier]}
                                                                </span>
                                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{pkg.tagline}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-[13px] font-black text-blue-600 dark:text-blue-400">{formatPrice(pkg.priceNPR)}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                        Storage: <span className="font-bold text-slate-700 dark:text-slate-300">{pkg.storageLimitGB === -1 ? '∞' : `${pkg.storageLimitGB}GB`}</span>
                                                        <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                                                        Team: <span className="font-bold text-slate-700 dark:text-slate-300">{pkg.teamLimit === -1 ? '∞' : pkg.teamLimit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    {usage?.package?.id === pkg.id ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20">
                                                            <Check className="h-3 w-3" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 dark:border-white/[0.06]">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="pr-10 py-6 text-right">
                                                    <button onClick={() => openEdit(pkg)}
                                                        className="btn-ghost h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {editingPkg && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ring-1 ring-slate-200 dark:ring-white/10">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                                        Edit Package <span className="text-slate-400 font-normal text-sm">({editingPkg.id})</span>
                                    </h2>
                                    <button onClick={() => setEditingPkg(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="overflow-y-auto flex-1 px-6 py-3 space-y-5">
                                    {/* Name + Support */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
                                            <input type="text" value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                                                className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Support Level</label>
                                            <select value={editForm.supportLevel} onChange={e => setEditForm((f: any) => ({ ...f, supportLevel: e.target.value }))}
                                                className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                                                <option value="email">Email</option>
                                                <option value="priority">Priority</option>
                                                <option value="dedicated">Dedicated</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* Tagline */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tagline</label>
                                        <input type="text" value={editForm.tagline} onChange={e => setEditForm((f: any) => ({ ...f, tagline: e.target.value }))}
                                            className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                    </div>
                                    {/* Price */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Price (NPR)</label>
                                        <div className="flex gap-2 mb-2">
                                            {(['flat', 'range', 'custom'] as PriceType[]).map(t => (
                                                <button key={t} onClick={() => setEditForm((f: any) => ({ ...f, priceType: t }))}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${editForm.priceType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        {editForm.priceType === 'flat' && (
                                            <input type="number" value={editForm.priceFlat} min={0} placeholder="e.g. 20000"
                                                onChange={e => setEditForm((f: any) => ({ ...f, priceFlat: parseInt(e.target.value) || 0 }))}
                                                className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                        )}
                                        {editForm.priceType === 'range' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="number" value={editForm.priceMin} min={0} placeholder="Min"
                                                    onChange={e => setEditForm((f: any) => ({ ...f, priceMin: parseInt(e.target.value) || 0 }))}
                                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                                <input type="number" value={editForm.priceMax} min={0} placeholder="Max"
                                                    onChange={e => setEditForm((f: any) => ({ ...f, priceMax: parseInt(e.target.value) || 0 }))}
                                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                            </div>
                                        )}
                                        {editForm.priceType === 'custom' && <p className="text-xs text-slate-400 italic">Shows "Contact Sales" on pricing page.</p>}
                                    </div>
                                    {/* Limits */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Storage GB (-1 = ∞)</label>
                                            <input type="number" value={editForm.storageLimitGB}
                                                onChange={e => setEditForm((f: any) => ({ ...f, storageLimitGB: parseInt(e.target.value) || 0 }))}
                                                className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Team Seats (-1 = ∞)</label>
                                            <input type="number" value={editForm.teamLimit}
                                                onChange={e => setEditForm((f: any) => ({ ...f, teamLimit: parseInt(e.target.value) || 1 }))}
                                                className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                        </div>
                                    </div>
                                    {/* Toggles */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {([
                                            ['aiEnabled', 'AI Tools'],
                                            ['highlighted', 'Mark Popular'],
                                            ['hasWhiteLabel', 'White Label'],
                                            ['hasApiAccess', 'API Access'],
                                            ['isActive', 'Visible on site'],
                                        ] as [string, string][]).map(([key, label]) => (
                                            <div key={key} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                                                <div onClick={() => setEditForm((f: any) => ({ ...f, [key]: !f[key] }))}
                                                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer relative ${editForm[key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Features */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Features</label>
                                        <div className="space-y-1.5 mb-2">
                                            {editForm.features?.map((feat: string, i: number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input type="text" value={feat}
                                                        onChange={e => setEditForm((f: any) => ({ ...f, features: f.features.map((x: string, j: number) => j === i ? e.target.value : x) }))}
                                                        className="flex-1 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                                    <button onClick={() => setEditForm((f: any) => ({ ...f, features: f.features.filter((_: any, j: number) => j !== i) }))}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" value={newFeature} onChange={e => setNewFeature(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter' && newFeature.trim()) { setEditForm((f: any) => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }}}
                                                placeholder="Add feature, press Enter…"
                                                className="flex-1 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                            <button onClick={() => { if (newFeature.trim()) { setEditForm((f: any) => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }}}
                                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 text-slate-500 transition-colors">
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/50">
                                    <button onClick={() => setEditingPkg(null)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                                    <button onClick={handleSavePkg} disabled={isSaving}
                                        className="btn-primary px-5 py-2 text-sm">
                                        {isSaving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PLAN & USAGE TAB ───────────────────────────────────────────── */}
            {activeTab === 'plan' && !usage && (
                <div className="px-5 sm:px-10 py-20 text-center text-slate-400 dark:text-slate-500 font-medium">
                    Failed to load plan data. Please refresh.
                </div>
            )}
            {activeTab === 'plan' && usage && <div className="space-y-12">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Plan Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-[2rem] bg-blue-600 shadow-2xl shadow-blue-600/30 flex items-center justify-center text-white">
                                    <Zap className="h-10 w-10 fill-current" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">
                                        {usage.package.name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Active</span>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Global Edition</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Billing Period</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">Professional Subscription</p>
                            </div>
                        </div>

                        {/* Usage Progress */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10 border-y border-slate-100 dark:border-white/[0.06]">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                            <Smartphone className="h-4 w-4" />
                                        </div>
                                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Storage Consumption</label>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">{usage.usage.storageGB} / {usage.limits.storageGB} GB</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={classNames(
                                            "h-full transition-all duration-1000 ease-out",
                                            storagePercent > 90 ? "bg-red-500" : "bg-blue-600"
                                        )}
                                        style={{ width: `${storagePercent}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">High-performance SSD storage allocated to media assets.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Team Seat Utilization</label>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">{usage.usage.teamMembers} / {usage.limits.teamMembers} Seats</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={classNames(
                                            "h-full transition-all duration-1000 ease-out",
                                            teamPercent > 90 ? "bg-orange-500" : "bg-violet-600"
                                        )}
                                        style={{ width: `${teamPercent}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">Concurrent administrative accounts for content management.</p>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {[
                                { label: 'White-label', enabled: usage.limits.hasWhiteLabel, icon: Shield },
                                { label: 'API Access', enabled: usage.limits.hasApiAccess, icon: ArrowUpRight },
                                { label: 'Enterprise Support', enabled: usage.package.supportLevel === 'priority', icon: Info },
                                { label: 'Audit Logging', enabled: true, icon: History },
                            ].map(feature => (
                                <div key={feature.label} className={classNames(
                                    "flex flex-col gap-3 p-5 rounded-3xl border transition-all duration-300",
                                    feature.enabled 
                                        ? "bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.06] opacity-100" 
                                        : "bg-slate-50/50 dark:bg-white/[0.01] border-slate-50 dark:border-white/[0.02] opacity-40 grayscale"
                                )}>
                                    <feature.icon className={classNames("h-5 w-5", feature.enabled ? "text-blue-600" : "text-slate-300")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{feature.label}</span>
                                    {feature.enabled && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activation Section */}
                    <div className="bg-slate-900 dark:bg-black/40 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />
                        
                        <div className="max-w-xl relative z-10">
                            <h3 className="text-3xl font-black font-display uppercase tracking-tight mb-4">Redeem <span className="text-blue-500">License</span></h3>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase tracking-widest opacity-80 mb-10">
                                Purchase a license from Blendwit Tech or partner providers to unlock advanced infrastructure and removal of platform branding.
                            </p>

                            <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Paste your JWT license token…"
                                        value={activationKey}
                                        onChange={(e) => setActivationKey(e.target.value.trim())}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-6 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all placeholder:opacity-30 placeholder:font-sans"
                                    />
                                </div>
                                <button 
                                    disabled={isActivating || !activationKey}
                                    className="btn-primary px-10 py-3 text-[10px]"
                                >
                                    {isActivating ? 'Processing…' : 'Activate Plan'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-10">
                    {/* License Status Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-3xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06] space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Status Vector</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">License Key</p>
                                <p className="text-xs font-mono font-black text-slate-900 dark:text-white truncate">
                                    {licenseInfo?.key || '••••-••••-••••'}
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Activation Date</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                    {licenseInfo?.activatedAt ? new Date(licenseInfo.activatedAt).toLocaleDateString() : 'Pending Activation'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Link 
                                href="/pricing"
                                className="btn-outline w-full py-3 flex items-center justify-center gap-3 bg-slate-900 text-white border-transparent"
                            >
                                Compare Tiers <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-white opacity-[0.05] pointer-events-none" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">Nepal Regional HQ</h4>
                        <h3 className="text-xl font-black font-display leading-tight uppercase mb-4">Enterprise Scaling?</h3>
                        <p className="text-[10px] font-bold text-blue-100 leading-relaxed opacity-80 uppercase tracking-widest mb-8">
                            For white-labeling custom themes or infinite storage clusters, contact our local engineering vector.
                        </p>
                        <button className="btn-outline w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center justify-between">
                            Contact Support <ArrowUpRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Audit Footprint</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Daily Uptime</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase">99.98%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Global Nodes</span>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">14 Nodes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>}
        </div>
    );
}
