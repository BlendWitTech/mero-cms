'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    PuzzlePieceIcon,
    ShieldCheckIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    SparklesIcon,
    CheckCircleIcon,
    BoltIcon,
    CreditCardIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
    TrendingUp,
    Search,
    Mail,
    ShieldCheck,
    CreditCard,
    Sparkles,
    Globe,
    HardDrive,
    Package as PackageIcon,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import UpgradePrompt from '@/components/ui/UpgradePrompt';

type Tab = 'installed' | 'marketplace';

interface InstalledPlugin {
    slug: string;
    name: string;
    version: string;
    enabled: boolean;
    installedAt: string;
    licenseKey?: string;
    purchasedPriceNPR: number;
}

interface InstallGate {
    status: 'ok' | 'tier' | 'theme' | 'both';
    installable: boolean;
    requiredTier?: number;
    requiredTierLabel?: string;
    currentTier: number;
    requiredThemeFields?: string[];
    compatibleThemes?: string[];
    currentThemeSlug: string | null;
    message?: string;
}

interface MarketplaceEntry {
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    author: string;
    version: string;
    priceNPR: number;
    category: string;
    icon?: string;
    featured?: boolean;
    minTier?: string;
    compatibleThemes?: string[];
    requiredThemeFields?: string[];
    tags?: string[];
    installed: boolean;
    enabled: boolean;
    /** Per-plugin install gate computed by the backend. Drives the
        button state and the "why is this disabled" tooltip. */
    gate: InstallGate;
}

// Icons map for marketplace cards — lucide-react instances keyed by manifest icon name.
const ICON_MAP: Record<string, any> = {
    TrendingUp, Search, Mail, ShieldCheck, CreditCard, Sparkles, Globe, HardDrive,
};

function formatNPR(n: number): string {
    if (n === 0) return 'Free';
    return `NPR ${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

// ─── Marketplace card ───────────────────────────────────────────────────────

function MarketplaceCard({
    entry,
    onInstall,
    onPurchase,
    busySlug,
}: {
    entry: MarketplaceEntry;
    onInstall: (slug: string) => void;
    onPurchase: (slug: string) => void;
    busySlug: string | null;
}) {
    const Icon = entry.icon ? ICON_MAP[entry.icon] ?? PackageIcon : PackageIcon;
    const isFree = entry.priceNPR === 0;
    const isBusy = busySlug === entry.slug;
    const gate = entry.gate;
    const blocked = !gate.installable && !entry.installed;

    return (
        <div
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col transition-all ${
                blocked
                    ? 'border-slate-200 dark:border-white/10 opacity-95'
                    : 'border-slate-200 dark:border-white/10'
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    {entry.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <SparklesIcon className="w-3 h-3" />
                            Featured
                        </span>
                    )}
                    {entry.installed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            <CheckCircleIcon className="w-3 h-3" />
                            Installed
                        </span>
                    )}
                </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{entry.name}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">by {entry.author} · v{entry.version}</p>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex-1">{entry.shortDescription}</p>

            <div className="mt-4 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                    {entry.category}
                </span>
                {entry.minTier && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                        {entry.minTier}+
                    </span>
                )}
                {entry.tags?.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                        {t}
                    </span>
                ))}
            </div>

            {/* Gate banner — only renders when something blocks install.
                Tells the user precisely which gate failed and links to
                the right remediation page. Nothing to dismiss; the card
                stays in the marketplace as informational. */}
            {blocked && <GateBanner gate={gate} />}

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatNPR(entry.priceNPR)}
                </div>
                {entry.installed ? (
                    <span className="text-xs text-slate-400 italic">Installed</span>
                ) : blocked ? (
                    <button
                        disabled
                        title={gate.message}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                    >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        Unavailable
                    </button>
                ) : isFree ? (
                    <button
                        onClick={() => onInstall(entry.slug)}
                        disabled={isBusy}
                        className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        {isBusy ? 'Installing…' : 'Install'}
                    </button>
                ) : (
                    <button
                        onClick={() => onPurchase(entry.slug)}
                        disabled={isBusy}
                        className="btn-destructive flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    >
                        <CreditCardIcon className="w-3.5 h-3.5" />
                        {isBusy ? 'Processing…' : 'Purchase'}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Inline banner explaining why a marketplace card can't be installed.
 * Two flavours: tier (amber, links to billing) and theme (indigo,
 * links to themes picker). Both gates failing shows both messages.
 */
function GateBanner({ gate }: { gate: InstallGate }) {
    const isTier = gate.status === 'tier' || gate.status === 'both';
    const isTheme = gate.status === 'theme' || gate.status === 'both';
    return (
        <div className="mt-4 flex flex-col gap-2">
            {isTier && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                    <BoltIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 leading-snug">
                            Requires {gate.requiredTierLabel || 'higher tier'}
                        </p>
                        <a
                            href="/dashboard/settings?tab=license"
                            className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline"
                        >
                            Upgrade your license →
                        </a>
                    </div>
                </div>
            )}
            {isTheme && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-snug">
                            {gate.requiredThemeFields
                                ? `Theme must declare: ${gate.requiredThemeFields.join(', ')}`
                                : `Active theme not in compatibility list`}
                        </p>
                        <a
                            href="/dashboard/themes"
                            className="text-[11px] text-indigo-700 dark:text-indigo-300 hover:underline"
                        >
                            Switch themes →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Installed card ─────────────────────────────────────────────────────────

function InstalledCard({
    plugin,
    onToggle,
    onUninstall,
    onReinstall,
    busySlug,
}: {
    plugin: InstalledPlugin;
    onToggle: (slug: string, enabled: boolean) => void;
    onUninstall: (slug: string) => void;
    onReinstall: (slug: string) => void;
    busySlug: string | null;
}) {
    const isBusy = busySlug === plugin.slug;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl grid place-items-center ${plugin.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
                <PuzzlePieceIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{plugin.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400">v{plugin.version}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                    Installed {formatDate(plugin.installedAt)}
                    {plugin.purchasedPriceNPR > 0 && ` · ${formatNPR(plugin.purchasedPriceNPR)}`}
                    {plugin.licenseKey && (
                        <> · <span className="font-mono">{plugin.licenseKey}</span></>
                    )}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onToggle(plugin.slug, !plugin.enabled)}
                    disabled={isBusy}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${plugin.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${plugin.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                {/* Reinstall — refreshes from catalog (gates re-checked,
                    version bumped, licenseKey preserved). Plugin reinstall
                    is a sub-second operation, so we don't bounce to Danger
                    Zone like theme reinstall does — a quick click + toast
                    feels right for the operation's weight. */}
                <button
                    onClick={() => onReinstall(plugin.slug)}
                    disabled={isBusy}
                    className="btn-ghost p-1.5 text-slate-400 hover:text-blue-600"
                    title="Reinstall — refresh from catalog"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
                </button>
                <button
                    onClick={() => onUninstall(plugin.slug)}
                    disabled={isBusy}
                    className="btn-ghost p-1.5 text-slate-400 hover:text-red-600"
                    title="Uninstall plugin"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function PluginsPage() {
    const { showToast } = useNotification();
    const { has, isLoading: capsLoading } = useCapabilities();

    const [tab, setTab] = useState<Tab>('marketplace');
    const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
    const [marketplace, setMarketplace] = useState<MarketplaceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [busySlug, setBusySlug] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const [inst, mkt] = await Promise.all([
                apiRequest('/plugins', { skipNotification: true }),
                apiRequest('/plugins/marketplace', { skipNotification: true }),
            ]);
            setInstalled(Array.isArray(inst) ? inst : []);
            setMarketplace(Array.isArray(mkt) ? mkt : []);
        } catch (err: any) {
            showToast(err?.message ?? 'Failed to load plugins.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!capsLoading && has('pluginMarketplace')) reload();
    }, [capsLoading, has, reload]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const install = async (slug: string) => {
        setBusySlug(slug);
        try {
            await apiRequest(`/plugins/${slug}/install`, { method: 'POST', body: {} });
            showToast('Plugin installed.', 'success');
            await reload();
        } catch (err: any) {
            showToast(err?.message ?? 'Install failed.', 'error');
        } finally {
            setBusySlug(null);
        }
    };

    const purchase = async (slug: string) => {
        setBusySlug(slug);
        try {
            // Step 1: kick off a Khalti checkout (mocked in dev).
            const { pidx }: any = await apiRequest(`/plugins/${slug}/purchase`, { method: 'POST' });
            if (!pidx) throw new Error('Payment initiation did not return a pidx.');

            // Step 2: verify. In production Khalti redirects the user back to the
            // dashboard; for v1 we auto-verify (matches payments.service behaviour).
            await apiRequest(`/plugins/${slug}/verify?pidx=${encodeURIComponent(pidx)}`);
            showToast('Purchase complete — plugin installed.', 'success');
            await reload();
        } catch (err: any) {
            showToast(err?.message ?? 'Purchase failed.', 'error');
        } finally {
            setBusySlug(null);
        }
    };

    const toggle = async (slug: string, enabled: boolean) => {
        setBusySlug(slug);
        try {
            await apiRequest(`/plugins/${slug}/toggle`, { method: 'POST', body: { enabled } });
            await reload();
        } catch (err: any) {
            showToast(err?.message ?? 'Toggle failed.', 'error');
        } finally {
            setBusySlug(null);
        }
    };

    const uninstall = async (slug: string) => {
        if (!confirm(`Uninstall "${slug}"? This cannot be undone.`)) return;
        setBusySlug(slug);
        try {
            await apiRequest(`/plugins/${slug}`, { method: 'DELETE' });
            showToast('Plugin uninstalled.', 'success');
            await reload();
        } catch (err: any) {
            showToast(err?.message ?? 'Uninstall failed.', 'error');
        } finally {
            setBusySlug(null);
        }
    };

    /**
     * Reinstall — re-syncs the install record with the catalog
     * manifest (refreshed name/version) and re-runs install gates so
     * we surface tier/theme mismatches immediately. licenseKey is
     * preserved on the backend so paid plugins don't need
     * re-purchasing.
     *
     * No confirm() because the operation is non-destructive — it
     * doesn't drop the plugin or wipe its config. Failures bubble up
     * via the API's structured error message (gate / forbidden /
     * not-installed) and land as a toast.
     */
    const reinstall = async (slug: string) => {
        setBusySlug(slug);
        try {
            const result = await apiRequest(`/plugins/${slug}/reinstall`, { method: 'POST' });
            showToast(`Reinstalled — now on v${(result as any)?.version || '?'}.`, 'success');
            await reload();
        } catch (err: any) {
            showToast(err?.message ?? 'Reinstall failed.', 'error');
        } finally {
            setBusySlug(null);
        }
    };

    // ─── Filters ────────────────────────────────────────────────────────────

    const categories = Array.from(new Set(marketplace.map((m) => m.category))).sort();
    const filtered =
        categoryFilter === 'all'
            ? marketplace
            : marketplace.filter((m) => m.category === categoryFilter);

    // ─── Render ─────────────────────────────────────────────────────────────

    if (capsLoading) return null;

    if (!has('pluginMarketplace')) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <UpgradePrompt
                    feature="pluginMarketplace"
                    title="Extend your CMS with plugins"
                    description="Install free and paid plugins from the Mero marketplace. Add analytics, SEO tools, newsletter kits, bot protection, and more — all managed from your dashboard. Available on Premium plans and above."
                    minTier="Premium"
                />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <PuzzlePieceIcon className="w-6 h-6 text-blue-600" />
                        Plugins
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Extend your CMS with official and community plugins from the Mero marketplace.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400">
                        {installed.length} installed · {marketplace.length} in marketplace
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 mb-6 w-fit">
                {(['marketplace', 'installed'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        {t === 'marketplace' ? `Marketplace (${marketplace.length})` : `Installed (${installed.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-sm text-slate-400">Loading plugins…</div>
            ) : tab === 'marketplace' ? (
                <>
                    {/* Category filter */}
                    <div className="flex items-center gap-2 flex-wrap mb-6">
                        <button
                            onClick={() => setCategoryFilter('all')}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${categoryFilter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                        >
                            All ({marketplace.length})
                        </button>
                        {categories.map((c) => {
                            const count = marketplace.filter((m) => m.category === c).length;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setCategoryFilter(c)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition capitalize ${categoryFilter === c ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                >
                                    {c} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((entry) => (
                            <MarketplaceCard
                                key={entry.slug}
                                entry={entry}
                                onInstall={install}
                                onPurchase={purchase}
                                busySlug={busySlug}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {installed.length === 0 ? (
                        <div className="text-center py-20 max-w-lg mx-auto">
                            <BoltIcon className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <h2 className="font-bold text-slate-800 dark:text-white text-sm">No plugins installed yet</h2>
                            <p className="text-xs text-slate-500 mt-1 mb-5">
                                Browse the marketplace to find plugins that extend your CMS.
                            </p>
                            <button
                                onClick={() => setTab('marketplace')}
                                className="btn-destructive inline-flex items-center gap-2 text-xs"
                            >
                                <PuzzlePieceIcon className="w-4 h-4" />
                                Browse marketplace
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {installed.map((p) => (
                                <InstalledCard
                                    key={p.slug}
                                    plugin={p}
                                    onToggle={toggle}
                                    onUninstall={uninstall}
                                    onReinstall={reinstall}
                                    busySlug={busySlug}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* License note */}
            <div className="mt-10 flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheckIcon className="w-4 h-4 flex-none mt-0.5" />
                <div>
                    Paid plugins are licensed per CMS instance. Your licence keys are stored alongside
                    your installation and will remain active as long as the plugin is installed on this site.
                </div>
            </div>
        </div>
    );
}
