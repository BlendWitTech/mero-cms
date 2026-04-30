'use client';

import { useState, useEffect } from 'react';
import {
    SwatchIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    XMarkIcon,
    TrashIcon,
    MagnifyingGlassPlusIcon,
    ArrowTopRightOnSquareIcon,
    SparklesIcon,
    BoltIcon,
    ChevronDownIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useModules } from '@/context/ModulesContext';
import { useCapabilities } from '@/context/CapabilitiesContext';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

const API_URL = getApiBaseUrl();

interface ThemeDetails {
    name: string;
    slug: string;
    dirName: string;
    version: string;
    description: string;
    author: string;
    requiredModules: string[];
    websiteType: 'personal' | 'organizational' | null;
    previewUrl: string | null;
    deployedUrl: string;
    setupType?: 'FRESH' | 'LEGACY' | null;
    builtIn?: boolean;
    /** Minimum package tier required to activate this theme. The
        backend returns this from theme.json — we use it client-side
        to render lock badges + disable the activate CTA on templates
        the user can't use. */
    minPackageTier?: number;
    /** Allowlist of package ids that can use this theme. ['any'] (or
        absent) means no restriction. Used together with `minPackageTier`
        to compute activation eligibility. */
    supportedPackages?: string[];
}

function ThemePreviewPlaceholder({ theme }: { theme: ThemeDetails }) {
    const isSaasPro = theme.slug?.includes('saas') || theme.name?.toLowerCase().includes('saas');
    const isMarketing = theme.slug?.includes('marketing') || theme.name?.toLowerCase().includes('marketing');

    if (isSaasPro) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-[#EFF6FF] via-white to-[#EEF2FF] flex flex-col p-4 gap-2.5 overflow-hidden select-none">
                {/* Mock navbar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/80 rounded-lg border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md bg-blue-600" />
                        <div className="h-2 w-16 bg-slate-300 rounded-full" />
                    </div>
                    <div className="flex gap-1.5">
                        <div className="h-1.5 w-8 bg-slate-200 rounded-full" />
                        <div className="h-1.5 w-8 bg-slate-200 rounded-full" />
                        <div className="h-1.5 w-10 bg-blue-600/70 rounded-full" />
                    </div>
                </div>
                {/* Mock hero */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
                    <div className="h-1.5 w-20 bg-blue-600/30 rounded-full" />
                    <div className="h-3 w-36 bg-slate-800/80 rounded-full" />
                    <div className="h-3 w-28 bg-slate-800/60 rounded-full" />
                    <div className="h-2 w-44 bg-slate-400/40 rounded-full mt-0.5" />
                    <div className="flex gap-2 mt-1">
                        <div className="h-5 w-16 bg-blue-600 rounded-lg" />
                        <div className="h-5 w-16 bg-white border border-slate-200 rounded-lg" />
                    </div>
                    {/* Stat cards */}
                    <div className="flex gap-1.5 mt-1.5">
                        {['5M+', '98%', '150+'].map(v => (
                            <div key={v} className="bg-white/90 border border-slate-200/60 rounded-lg px-2 py-1 flex flex-col items-center shadow-sm">
                                <span className="text-[7px] font-bold text-blue-600">{v}</span>
                                <div className="h-1 w-8 bg-slate-300/60 rounded-full mt-0.5" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Bottom bar */}
                <div className="h-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-around px-3">
                    {[0,1,2,3].map(i => <div key={i} className="h-1.5 w-6 bg-white/30 rounded-full" />)}
                </div>
            </div>
        );
    }

    if (isMarketing) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-[#0F1B3D] to-slate-900 flex flex-col p-4 gap-2.5 overflow-hidden select-none">
                {/* Mock navbar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md bg-red-600" />
                        <div className="h-2 w-14 bg-white/20 rounded-full" />
                    </div>
                    <div className="flex gap-1.5">
                        <div className="h-1.5 w-8 bg-white/15 rounded-full" />
                        <div className="h-1.5 w-8 bg-white/15 rounded-full" />
                        <div className="h-1.5 w-10 bg-red-600/70 rounded-full" />
                    </div>
                </div>
                {/* Mock hero */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
                    <div className="h-1.5 w-24 bg-red-500/40 rounded-full" />
                    <div className="h-3 w-36 bg-white/80 rounded-full" />
                    <div className="h-3 w-28 bg-white/60 rounded-full" />
                    <div className="h-2 w-44 bg-white/20 rounded-full mt-0.5" />
                    <div className="flex gap-2 mt-1">
                        <div className="h-5 w-16 bg-red-600 rounded-lg" />
                        <div className="h-5 w-16 bg-white/10 border border-white/15 rounded-lg" />
                    </div>
                </div>
                {/* Feature cards row */}
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1.5 flex flex-col gap-1">
                            <div className="w-4 h-4 rounded-md bg-red-600/30" />
                            <div className="h-1.5 w-full bg-white/20 rounded-full" />
                            <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Generic styled placeholder
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                <SwatchIcon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
                <div className="h-2 w-20 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <div className="h-1.5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
        </div>
    );
}

export default function ThemesPage() {
    const [themes, setThemes] = useState<ThemeDetails[]>([]);
    const [activeTheme, setActiveTheme] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isSettingUp, setIsSettingUp] = useState<string | null>(null);
    const [isActivating, setIsActivating] = useState<string | null>(null);
    const [isRestarting, setIsRestarting] = useState(false);

    const [previewModalTheme, setPreviewModalTheme] = useState<ThemeDetails | null>(null);
    const [setupModalTheme, setSetupModalTheme] = useState<string | null>(null);
    const [activateModalTheme, setActivateModalTheme] = useState<string | null>(null);
    const [deleteModalTheme, setDeleteModalTheme] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const [isFreshSetup, setIsFreshSetup] = useState(false);
    const [importDemoContent, setImportDemoContent] = useState(true);
    const [hardReset, setHardReset] = useState(false);

    // Design picker (shown in Activation modal for themes that ship
    // top-level designs OR for the new bundle.designs shape from
    // Phase 7 #117). Bundle designs add `bundleAccess` (tier short-
    // names allowed to activate this design), `locked` (computed by
    // the backend against current tier), `isActive` (currently active
    // for the active theme), and `preview` (thumbnail URL).
    type ThemeDesign = {
        key: string;
        label: string;
        description: string;
        isDefault: boolean;
        sectionVariants: Record<string, string>;
        bundleAccess?: string[];
        locked?: boolean;
        isActive?: boolean;
        preview?: string;
    };
    const [themeDesigns, setThemeDesigns] = useState<ThemeDesign[] | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
    const [loadingDesigns, setLoadingDesigns] = useState(false);

    const [deployedUrls, setDeployedUrls] = useState<Record<string, string>>({});
    const [userWebsiteType, setUserWebsiteType] = useState<'personal' | 'organizational' | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const toggleCard = (slug: string) =>
        setExpandedCards(prev => { const s = new Set(prev); s.has(slug) ? s.delete(slug) : s.add(slug); return s; });
    const { showToast } = useNotification();
    const { isModuleEnabled } = useModules();

    useEffect(() => {
        fetchThemes();
        apiRequest('/packages/usage')
            .then((u: any) => setUserWebsiteType(u?.package?.websiteType || null))
            .catch(() => {});
    }, []);

    // Fetch top-level "designs" whenever the activation modal opens so the
    // user can pick one complete page composition (e.g. "Bold Dark",
    // "Editorial Light", …). Clears when the modal closes.
    useEffect(() => {
        if (!activateModalTheme) {
            setThemeDesigns(null);
            setSelectedDesign(null);
            return;
        }
        let cancelled = false;
        setLoadingDesigns(true);
        apiRequest(`/themes/${activateModalTheme}/designs`, { skipNotification: true })
            .then((designs: ThemeDesign[]) => {
                if (cancelled) return;
                setThemeDesigns(designs || []);
                const def = (designs || []).find(d => d.isDefault) || (designs || [])[0];
                setSelectedDesign(def?.key ?? null);
            })
            .catch(() => { if (!cancelled) setThemeDesigns([]); })
            .finally(() => { if (!cancelled) setLoadingDesigns(false); });
        return () => { cancelled = true; };
    }, [activateModalTheme]);

    const fetchThemes = async () => {
        try {
            setIsLoading(true);
            const [themesData, activeData] = await Promise.all([
                apiRequest('/themes/details'),
                apiRequest('/themes/active')
            ]);
            const list: ThemeDetails[] = Array.isArray(themesData) ? themesData : [];
            setThemes(list);
            setActiveTheme(activeData?.activeTheme || null);
            const urls: Record<string, string> = {};
            list.forEach(t => { urls[t.slug] = t.deployedUrl || ''; });
            setDeployedUrls(urls);
        } catch {
            showToast('Failed to load themes', 'error');
        } finally {
            setIsLoading(false);
        }
    };


    const waitForBackend = async () => {
        // Health probe: hit a PUBLIC endpoint so the browser doesn't log
        // a 401 every loop iteration. /themes/active requires auth and
        // returns 401 even when the backend is happily serving — the
        // probe used to log a 401 noise burst on every restart while
        // the backend was actually fine. /public/site-data is always
        // public and returns 200 when the backend is up.
        let attempts = 0;
        while (attempts < 30) {
            try {
                const r = await fetch(`${API_URL}/public/site-data`, { cache: 'no-store' });
                if (r.ok || r.status === 304) return true;
            } catch {
                /* network error → keep polling */
            }
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
        }
        return false;
    };

    const checkAndInstallModules = async (slug: string): Promise<boolean> => {
        try {
            const data = await apiRequest(`/themes/${slug}/install-modules`, { method: 'POST' });
            if (!data) throw new Error('Failed to check modules');
            if (data.needsRestart) {
                showToast(`Installing missing modules: ${data.missingModules.join(', ')}. CMS restarting...`, 'info');
                setIsRestarting(true);
                await new Promise(r => setTimeout(r, 2500));
                const isBack = await waitForBackend();
                setIsRestarting(false);
                if (!isBack) { showToast('CMS took too long to restart. Please refresh the page manually.', 'error'); return false; }
                showToast('CMS restarted successfully! Resuming operation...', 'success');
                return true;
            }
            return true;
        } catch (error: any) {
            showToast(error.message || 'Failed to check missing modules', 'error');
            return false;
        }
    };

    const handleConfirmSetup = async (fresh: boolean) => {
        const slug = setupModalTheme;
        if (!slug) return;
        setSetupModalTheme(null);
        try {
            setIsSettingUp(slug);
            const proceed = await checkAndInstallModules(slug);
            if (!proceed) return;
            await apiRequest(`/themes/${slug}/setup`, { method: 'POST', body: { clearPrevious: fresh } });
            showToast(`Theme setup complete! ${fresh ? 'Old theme data purged.' : 'Existing data kept.'}`, 'success');
            fetchThemes();
        } catch (error: any) {
            showToast(error.message || 'Setup failed', 'error');
        } finally {
            setIsSettingUp(null);
        }
    };

    const handleConfirmActivate = async () => {
        const slug = activateModalTheme;
        if (!slug) return;
        setActivateModalTheme(null);
        try {
            setIsActivating(slug);
            const proceed = await checkAndInstallModules(slug);
            if (!proceed) return;
            const data = await apiRequest(`/themes/${slug}/activate`, {
                method: 'POST',
                body: {
                    importDemoContent,
                    // Only send the design key if the user is actually importing
                    // demo content — otherwise it has no effect and just adds noise.
                    designKey: importDemoContent ? (selectedDesign ?? undefined) : undefined,
                },
            });
            const r = data.results || {};
            const summary = Object.entries(r).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${v} ${k}`).join(', ');
            setActiveTheme(slug);
            showToast(`Theme "${slug}" activated! ${summary ? summary + ' seeded. ' : ''}Run: cd themes/${slug} && npm run dev`, 'success');
            fetchThemes();
        } catch (error: any) {
            showToast(error.message || 'Activation failed', 'error');
        } finally {
            setIsActivating(null);
        }
    };

    const handleSaveDeployedUrl = async (slug: string) => {
        try {
            await apiRequest(`/themes/${slug}/deployed-url`, { method: 'PATCH', body: { url: deployedUrls[slug] || '' } });
            showToast('Deployed URL saved', 'success');
        } catch { showToast('Failed to save URL', 'error'); }
    };

    const handleReset = async () => {
        const isHard = hardReset;
        setShowResetModal(false);
        try {
            setIsResetting(true);
            await apiRequest('/themes/reset', { method: 'POST', body: { hardReset: isHard } });
            if (isHard) { showToast('CMS Factory Reset initiated. Returning to setup...', 'success'); setTimeout(() => window.location.href = '/setup', 2000); return; }
            setActiveTheme(null);
            showToast('CMS reset to base state. All content and theme settings cleared.', 'success');
            fetchThemes();
        } catch { showToast('Failed to reset CMS', 'error'); }
        finally { setIsResetting(false); }
    };

    const handleDeleteTheme = async () => {
        if (!deleteModalTheme) return;
        setIsDeleting(true);
        try {
            await apiRequest(`/themes/${deleteModalTheme}`, { method: 'DELETE' });
            showToast(`Theme "${deleteModalTheme}" deleted.`, 'success');
            setDeleteModalTheme(null);
            fetchThemes();
        } catch (e: any) {
            showToast(e?.message || 'Failed to delete theme', 'error');
        } finally { setIsDeleting(false); }
    };

    const getDisabledModules = (requiredModules: string[]) =>
        requiredModules.filter(m => !isModuleEnabled(m));

    // Pull active tier from capabilities so we can render lock badges on
    // tier-gated templates. Tier 0 (no license set) treats every gated
    // theme as locked but still browsable — discovery before purchase.
    // Note: the admin's CapabilitiesContext exposes `activePackage` with
    // a `tier` field; the theme's mirror context flattens to `caps.tier`.
    // We're in admin land here so go through `activePackage`.
    const caps = useCapabilities();
    const activeTier = caps?.activePackage?.tier ?? 0;

    /** A template is "tier-locked" when its minPackageTier is higher
        than the active license's tier. The activate button is disabled
        and a small "Premium" / "Pro" / "Enterprise" lock badge appears
        on the card. Self-hosted customers without a license see every
        gated template as locked, with a link to the pricing page. */
    const isTierLocked = (t: ThemeDetails): boolean =>
        typeof t.minPackageTier === 'number' &&
        t.minPackageTier > activeTier;

    /** Human-readable tier name for the lock badge. */
    const tierLabel = (n?: number): string => {
        if (!n || n <= 1) return 'Basic';
        if (n === 2)     return 'Premium';
        if (n === 3)     return 'Pro';
        return 'Enterprise';
    };

    const visibleThemes = themes.filter(t => !t.websiteType || !userWebsiteType || t.websiteType === userWebsiteType);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader
                title="Theme"
                accent="Gallery"
                subtitle={`${visibleThemes.length} theme${visibleThemes.length !== 1 ? 's' : ''} available — configure and activate your site's look`}
                actions={
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={isResetting}
                        className="btn-destructive px-4 py-2.5 text-[10px]"
                    >
                        <TrashIcon className="h-4 w-4" />
                        {isResetting ? 'Resetting...' : 'Reset CMS'}
                    </button>
                }
            />

            {/* Main Container */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Themes...</p>
                    </div>
                ) : visibleThemes.length === 0 ? (
                    <div className="py-24">
                        <EmptyState
                            naked
                            icon={SwatchIcon}
                            title="No Themes Found"
                            description="Upload a .zip theme file to get started. Your theme controls how your site looks."
                            action={{ label: 'Upload a Theme', onClick: () => document.querySelector<HTMLInputElement>('input[type=file]')?.click() }}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8">
                        {visibleThemes.map((theme) => {
                            const isActive = activeTheme === theme.dirName || activeTheme === theme.slug || activeTheme === theme.name;
                            const disabledMods = getDisabledModules(theme.requiredModules);
                            const hasWarning = disabledMods.length > 0;
                            const isBusy = isSettingUp === theme.slug || isActivating === theme.slug;
                            const tierLocked = isTierLocked(theme);
                            const lockTier = tierLabel(theme.minPackageTier);

                            return (
                                <div
                                    key={theme.slug}
                                    className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                                        isActive
                                            ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/10 bg-white dark:bg-slate-900'
                                            : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/[0.07] hover:border-slate-200 dark:hover:border-white/[0.12] hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-none'
                                    }`}
                                >
                                    {/* Active glow strip */}
                                    {isActive && (
                                        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />
                                    )}

                                    {/* Preview Image */}
                                    <div
                                        className="relative w-full h-52 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden cursor-pointer shrink-0"
                                        onClick={() => setPreviewModalTheme(theme)}
                                    >
                                        {theme.previewUrl ? (
                                            <img
                                                src={`${API_URL}${theme.previewUrl}`}
                                                alt={`${theme.name} preview`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <ThemePreviewPlaceholder theme={theme} />
                                        )}

                                        {/* Hover zoom overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2 text-white text-xs font-bold border border-white/30">
                                                <MagnifyingGlassPlusIcon className="w-4 h-4" /> Preview
                                            </div>
                                        </div>

                                        {/* Status badges — single row, right-aligned so "Active" stays prominent.
                                            Always horizontal regardless of combination, so built-in + missing
                                            and built-in + active both render on one line. */}
                                        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-end gap-1.5 pointer-events-none">
                                            {hasWarning && (
                                                <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg ring-1 ring-amber-600/40">
                                                    <ExclamationTriangleIcon className="w-3 h-3" /> Modules Missing
                                                </span>
                                            )}
                                            {tierLocked && (
                                                <span
                                                    title={`Requires ${lockTier} tier or higher`}
                                                    className="inline-flex items-center gap-1 bg-amber-500/95 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg ring-1 ring-amber-600/40"
                                                >
                                                    <LockClosedIcon className="w-3 h-3" /> {lockTier}
                                                </span>
                                            )}
                                            {theme.builtIn && (
                                                <span className="inline-flex items-center gap-1 bg-slate-900/85 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md ring-1 ring-white/10">
                                                    Built-in
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-blue-600/40 ring-1 ring-blue-500/60">
                                                    <CheckCircleSolid className="w-3 h-3" /> Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex flex-col flex-1 p-5 gap-3">
                                        {/* Name row + toggle icon */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{theme.name}</h3>
                                                {theme.author && (
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">by {theme.author}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">v{theme.version}</span>
                                                {theme.websiteType && (
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${theme.websiteType === 'personal' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                        {theme.websiteType === 'personal' ? 'Personal' : 'Business'}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => toggleCard(theme.slug)}
                                                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.07] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                                                    title={expandedCards.has(theme.slug) ? 'Collapse' : 'Expand'}
                                                >
                                                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCards.has(theme.slug) ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Collapsible section */}
                                        {expandedCards.has(theme.slug) && (
                                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {/* Description */}
                                                {theme.description && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{theme.description}</p>
                                                )}

                                                {/* Required Modules */}
                                                {theme.requiredModules.length > 0 && (
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-2">Required Modules</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {theme.requiredModules.map(mod => (
                                                                <span key={mod} className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${isModuleEnabled(mod) ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                                                    {isModuleEnabled(mod) ? <CheckCircleIcon className="w-2.5 h-2.5" /> : <ExclamationTriangleIcon className="w-2.5 h-2.5" />}
                                                                    {mod}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {hasWarning && (
                                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">Missing modules auto-install on activation.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Dev server hint */}
                                                {isActive && !deployedUrls[theme.slug] && (
                                                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
                                                        <BoltIcon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Start theme server</p>
                                                            <code className="text-[10px] font-mono text-amber-800 dark:text-amber-300 mt-0.5 block">{`cd themes/${theme.dirName} && npm run dev`}</code>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Deployed URL */}
                                                <div className="flex gap-2 items-center">
                                                    <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-xl px-3 py-2 focus-within:border-blue-400 dark:focus-within:border-blue-500/50 transition-colors">
                                                        <LinkIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                                                        <input
                                                            type="url"
                                                            value={deployedUrls[theme.slug] || ''}
                                                            onChange={e => setDeployedUrls(prev => ({ ...prev, [theme.slug]: e.target.value }))}
                                                            placeholder="https://yoursite.com"
                                                            className="flex-1 text-[11px] bg-transparent text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none min-w-0"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveDeployedUrl(theme.slug)}
                                                        title="Save URL"
                                                        className="btn-ghost p-2.5 rounded-xl"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                    </button>
                                                    {deployedUrls[theme.slug] && (
                                                        <a
                                                            href={deployedUrls[theme.slug]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Open site"
                                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 text-slate-400 dark:text-slate-500 transition-colors border border-transparent hover:border-green-200 dark:hover:border-green-500/30"
                                                        >
                                                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-3 border-t border-slate-50 dark:border-white/[0.05]">
                                            {isActive && (
                                                <Link
                                                    href="/dashboard/themes/customize"
                                                    className="btn-outline flex-1 py-2.5 text-[10px] gap-1.5"
                                                >
                                                    <SparklesIcon className="h-3.5 w-3.5" />
                                                    Customize
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => setSetupModalTheme(theme.slug)}
                                                disabled={isBusy}
                                                className="btn-primary flex-1 py-2.5 text-[10px] gap-1.5"
                                            >
                                                {isSettingUp === theme.slug && (
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                )}
                                                {isSettingUp === theme.slug ? (isRestarting ? 'Restarting...' : 'Setting up...') : 'Setup'}
                                            </button>
                                            {tierLocked && !isActive ? (
                                                // Tier-locked: link to upgrade instead of "Activate".
                                                // The button says e.g. "Upgrade for Premium" so the
                                                // user knows the exact upgrade path. Routes to the
                                                // license page where they can change package.
                                                <Link
                                                    href="/dashboard/settings/license"
                                                    className="btn-outline flex-1 py-2.5 text-[10px] gap-1.5 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                                >
                                                    <LockClosedIcon className="w-3 h-3" /> Upgrade for {lockTier}
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => !isActive && setActivateModalTheme(theme.slug)}
                                                    disabled={isActive || isBusy}
                                                    className={`btn-outline flex-1 py-2.5 text-[10px] gap-1.5 ${
                                                        isActive
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : ''
                                                    }`}
                                                >
                                                    {isActivating === theme.slug && (
                                                        <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                                    )}
                                                    {isActive ? <><CheckCircleSolid className="w-3.5 h-3.5" /> Active</> : isActivating === theme.slug ? (isRestarting ? 'Restarting...' : 'Activating...') : 'Activate'}
                                                </button>
                                            )}
                                            {!isActive && (
                                                <button
                                                    onClick={() => setDeleteModalTheme(theme.slug)}
                                                    disabled={isBusy}
                                                    title="Delete theme"
                                                    className="btn-ghost p-2.5 text-slate-400 hover:text-red-500"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            {isActive && (
                                                /* Reinstall affordance for the active theme.
                                                   Routes to Settings → Danger Zone with the
                                                   reinstall action pre-selected so the streaming
                                                   terminal handles the work. We don't run reinstall
                                                   inline here because the operation can take 10-30s
                                                   and benefits from the live progress UX. */
                                                <Link
                                                    href="/dashboard/settings?tab=danger-zone&action=reinstall"
                                                    title="Reinstall this theme — re-imports seed content"
                                                    className="btn-ghost p-2.5 text-slate-400 hover:text-blue-600"
                                                >
                                                    <ArrowPathIcon className="h-3.5 w-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Preview Modal ─── */}
            {previewModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setPreviewModalTheme(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="relative w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden shrink-0">
                            {previewModalTheme.previewUrl ? (
                                <img src={`${API_URL}${previewModalTheme.previewUrl}`} alt={`${previewModalTheme.name} preview`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <SwatchIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No preview available</p>
                                </div>
                            )}
                            {(activeTheme === previewModalTheme.dirName || activeTheme === previewModalTheme.slug) && (
                                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                    <CheckCircleSolid className="w-3.5 h-3.5" /> Active
                                </div>
                            )}
                            <button onClick={() => setPreviewModalTheme(null)} className="absolute top-3 left-3 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full transition-colors">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <Link
                                    href={`/dashboard/themes/${previewModalTheme.slug}/variants`}
                                    className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" /> View Designs
                                </Link>
                                {previewModalTheme.deployedUrl ? (
                                    <a
                                        href={previewModalTheme.deployedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> Visit Site
                                    </a>
                                ) : (
                                    <span
                                        title="Set a deployed URL below to enable Visit Site"
                                        className="flex items-center gap-1.5 bg-black/30 text-white/60 text-xs font-bold px-3 py-1.5 rounded-full cursor-not-allowed"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> No URL set
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{previewModalTheme.name}</h2>
                                    {previewModalTheme.author && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">by {previewModalTheme.author}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {previewModalTheme.setupType && (
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${previewModalTheme.setupType === 'FRESH' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                            {previewModalTheme.setupType}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">v{previewModalTheme.version}</span>
                                </div>
                            </div>
                            {previewModalTheme.description && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{previewModalTheme.description}</p>}
                            {previewModalTheme.requiredModules.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Required Modules</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {previewModalTheme.requiredModules.map(mod => (
                                            <span key={mod} className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isModuleEnabled(mod) ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                {isModuleEnabled(mod) ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                                {mod}
                                            </span>
                                        ))}
                                    </div>
                                    {getDisabledModules(previewModalTheme.requiredModules).length > 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Missing modules will be auto-installed when you activate this theme.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
                            <button onClick={() => setPreviewModalTheme(null)} className="btn-outline px-4 py-2 text-sm">Close</button>
                            <button onClick={() => { setPreviewModalTheme(null); setSetupModalTheme(previewModalTheme.slug); }} className="btn-primary px-4 py-2 text-sm">Setup</button>
                            {activeTheme !== previewModalTheme.dirName && activeTheme !== previewModalTheme.slug && (
                                <button onClick={() => { setPreviewModalTheme(null); setActivateModalTheme(previewModalTheme.slug); }} className="btn-primary px-4 py-2 text-sm">Activate</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Setup Modal ─── */}
            {setupModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Theme Setup</h2>
                            <button onClick={() => setSetupModalTheme(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex shrink-0 items-center justify-center">
                                    <TrashIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white">How would you like to set up?</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose if you want to keep existing content or start completely fresh.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { value: true, label: 'Fresh Install', desc: 'Delete all content from the current active theme.', color: 'red' },
                                    { value: false, label: 'Keep Existing Data', desc: 'Prepare theme files but keep all your current content.', color: 'blue' },
                                ].map(opt => (
                                    <button
                                        key={String(opt.value)}
                                        onClick={() => setIsFreshSetup(opt.value)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-4 ${isFreshSetup === opt.value
                                            ? opt.color === 'red' ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20' : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                            : 'border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-950 hover:border-slate-200 dark:hover:border-white/10'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${isFreshSetup === opt.value ? opt.color === 'red' ? 'border-red-500' : 'border-blue-500' : 'border-slate-300 dark:border-white/20'}`}>
                                            {isFreshSetup === opt.value && <div className={`w-2.5 h-2.5 rounded-full ${opt.color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />}
                                        </div>
                                        <div>
                                            <div className={`font-black text-sm ${isFreshSetup === opt.value ? opt.color === 'red' ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{opt.label}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button onClick={() => setSetupModalTheme(null)} className="btn-outline px-5 py-2 text-sm">Cancel</button>
                            <button onClick={() => handleConfirmSetup(isFreshSetup)} className={`btn-primary px-5 py-2 text-sm ${isFreshSetup ? 'bg-red-600 hover:bg-red-700 border-red-600 shadow-red-600/20' : ''}`}>
                                {isFreshSetup ? 'Purge & Setup' : 'Regular Setup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Activation Modal ─── */}
            {activateModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95 flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between shrink-0">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Activate Theme</h2>
                            <button onClick={() => { setActivateModalTheme(null); setImportDemoContent(true); }} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
                                <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider">Ready to activate</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">This configures the CMS data for this theme. Start the theme's server to see it live.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
                                <BoltIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Each theme runs as its own app</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">After activation, start the dev server:</p>
                                    <code className="block mt-1.5 text-[11px] bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2.5 py-1.5 rounded-lg font-mono">{`cd themes/${activateModalTheme} && npm run dev`}</code>
                                </div>
                            </div>
                            {(() => {
                                const t = themes.find(t => t.slug === activateModalTheme);
                                const canImport = !t?.setupType || t?.setupType === 'FRESH';
                                return canImport ? (
                                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input type="checkbox" checked={importDemoContent} onChange={(e) => setImportDemoContent(e.target.checked)} className="peer sr-only" />
                                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                                                <CheckCircleSolid className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-slate-900 dark:text-white">Import Demo Content</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Populate your site with this theme's starter pages, menus, and posts.</div>
                                        </div>
                                    </label>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">This theme was previously activated — demo content won't be re-imported to avoid duplicates.</p>
                                );
                            })()}

                            {/* ─── Design picker: one card per complete page design ─── */}
                            {importDemoContent && (loadingDesigns || (themeDesigns && themeDesigns.length > 0)) && (
                                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02] p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4 text-blue-500" />
                                        <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            Pick a design
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        This theme ships multiple complete page designs. The choice applies across every page — Home, About, Services — so the whole site stays consistent.
                                    </p>
                                    {loadingDesigns ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                            Loading designs…
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {(themeDesigns || []).map(d => {
                                                const active = selectedDesign === d.key;
                                                // Phase 8 (#118) — bundle designs carry `locked`
                                                // (computed by the backend against the customer's
                                                // current tier) and `bundleAccess` for the
                                                // "Requires Custom" hint. Locked designs are
                                                // unselectable; the user must upgrade first.
                                                const locked = !!d.locked;
                                                const tiers = (d.bundleAccess && d.bundleAccess.length)
                                                    ? d.bundleAccess.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ')
                                                    : '';
                                                return (
                                                    <button
                                                        key={d.key}
                                                        type="button"
                                                        disabled={locked}
                                                        onClick={() => { if (!locked) setSelectedDesign(d.key); }}
                                                        title={locked ? `Requires ${tiers || 'higher'} tier` : undefined}
                                                        className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                                                            locked
                                                                ? 'border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
                                                                : active
                                                                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 shadow-sm'
                                                                    : 'border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-white/10'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                                                                locked ? 'border-slate-200 dark:border-white/10'
                                                                    : active ? 'border-blue-500'
                                                                    : 'border-slate-300 dark:border-white/20'
                                                            }`}>
                                                                {active && !locked && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                                                {locked && (
                                                                    <LockClosedIcon className="w-3 h-3 text-slate-400" aria-hidden="true" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={`text-sm font-black ${
                                                                        locked ? 'text-slate-500 dark:text-slate-500'
                                                                            : active ? 'text-blue-700 dark:text-blue-400'
                                                                            : 'text-slate-900 dark:text-white'
                                                                    }`}>
                                                                        {d.label}
                                                                    </span>
                                                                    {d.isActive && (
                                                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                    {!d.isActive && d.isDefault && (
                                                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                                                            Default
                                                                        </span>
                                                                    )}
                                                                    {locked && tiers && (
                                                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                                            {tiers} only
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {d.description && (
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                                        {d.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                            <button onClick={() => { setActivateModalTheme(null); setImportDemoContent(true); }} className="btn-outline px-5 py-2 text-sm">Cancel</button>
                            <button onClick={handleConfirmActivate} className="btn-primary px-6 py-2 text-sm">Confirm Activation</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Reset Modal ─── */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Reset CMS to Base State</h2>
                            <button onClick={() => setShowResetModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200/60 dark:border-red-800/40">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider">This action cannot be undone</p>
                                    <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">All content, pages, menus, team, testimonials, services, and theme settings will be permanently deleted.</p>
                                </div>
                            </div>
                            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input type="checkbox" checked={hardReset} onChange={(e) => setHardReset(e.target.checked)} className="peer sr-only" />
                                    <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-red-600 peer-checked:border-red-600 transition-colors flex items-center justify-center">
                                        <CheckCircleSolid className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">Factory Reset (Full Site Wipe)</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Returns CMS to initial setup wizard. Clears enabled modules and site branding.</div>
                                </div>
                            </label>
                            {!hardReset && <p className="text-xs text-slate-500 dark:text-slate-400 italic">Admin user accounts and roles will be <strong>kept</strong>.</p>}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button onClick={() => setShowResetModal(false)} className="btn-outline px-5 py-2 text-sm">Cancel</button>
                            <button onClick={handleReset} className="btn-destructive px-5 py-2 text-sm">Yes, Reset Everything</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Theme Modal ─── */}
            {deleteModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Delete Theme</h2>
                            <button onClick={() => setDeleteModalTheme(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteModalTheme}</strong>? The theme files will be permanently removed.</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Content and settings are not affected — only the theme files are deleted.</p>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button onClick={() => setDeleteModalTheme(null)} className="btn-outline px-5 py-2 text-sm">Cancel</button>
                            <button onClick={handleDeleteTheme} disabled={isDeleting} className="btn-destructive px-5 py-2 text-sm flex items-center gap-2">
                                {isDeleting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Delete Theme
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
