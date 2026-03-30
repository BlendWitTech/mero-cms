'use client';

import { useState, useEffect } from 'react';
import {
    CloudArrowUpIcon,
    SwatchIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    XMarkIcon,
    DocumentDuplicateIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useModules } from '@/context/ModulesContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ThemeDetails {
    name: string;
    slug: string;
    version: string;
    description: string;
    author: string;
    requiredModules: string[];
    previewUrl: string | null;
    deployedUrl: string;
    setupType?: 'FRESH' | 'LEGACY' | null;
    builtIn?: boolean;
}

export default function ThemesPage() {
    const [themes, setThemes] = useState<ThemeDetails[]>([]);
    const [activeTheme, setActiveTheme] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    
    // Action states
    const [isSettingUp, setIsSettingUp] = useState<string | null>(null);
    const [isActivating, setIsActivating] = useState<string | null>(null);
    const [isRestarting, setIsRestarting] = useState(false);
    
    // Modal states
    const [setupModalTheme, setSetupModalTheme] = useState<string | null>(null);
    const [activateModalTheme, setActivateModalTheme] = useState<string | null>(null);
    const [deleteModalTheme, setDeleteModalTheme] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Modal form states
    const [isFreshSetup, setIsFreshSetup] = useState(false);
    const [importDemoContent, setImportDemoContent] = useState(true);
    
    const [deployedUrls, setDeployedUrls] = useState<Record<string, string>>({});
    const { showToast } = useNotification();
    const { isModuleEnabled } = useModules();

    useEffect(() => {
        fetchThemes();
    }, []);

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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.zip')) {
            showToast('Please upload a .zip file', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
            setIsUploading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/themes/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            if (!response.ok) throw new Error('Upload failed');
            showToast('Theme uploaded successfully', 'success');
            fetchThemes();
        } catch {
            showToast('Failed to upload theme', 'error');
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const waitForBackend = async () => {
        let attempts = 0;
        while (attempts < 30) {
            try {
                await fetch(`${API_URL}/themes/active`);
                return true;
            } catch (e) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
            }
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
                
                if (!isBack) {
                    showToast('CMS took too long to restart. Please refresh the page manually.', 'error');
                    return false;
                }
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

            await apiRequest(`/themes/${slug}/setup`, {
                method: 'POST',
                body: { clearPrevious: fresh },
            });
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
                body: { importDemoContent: importDemoContent },
            });

            const r = data.results || {};
            const summary = Object.entries(r)
                .filter(([, v]) => (v as number) > 0)
                .map(([k, v]) => `${v} ${k}`)
                .join(', ');

            setActiveTheme(slug);
            showToast(`Theme "${slug}" is now active! ${summary}`, 'success');
            fetchThemes();
        } catch (error: any) {
            showToast(error.message || 'Activation failed', 'error');
        } finally {
            setIsActivating(null);
        }
    };

    const handleSaveDeployedUrl = async (slug: string) => {
        try {
            await apiRequest(`/themes/${slug}/deployed-url`, {
                method: 'PATCH',
                body: { url: deployedUrls[slug] || '' },
            });
            showToast('Deployed URL saved', 'success');
        } catch {
            showToast('Failed to save URL', 'error');
        }
    };

    const handleReset = async () => {
        setShowResetModal(false);
        try {
            setIsResetting(true);
            await apiRequest('/themes/reset', { method: 'POST' });
            setActiveTheme(null);
            showToast('CMS reset to base state. All content and theme settings cleared.', 'success');
            fetchThemes();
        } catch {
            showToast('Failed to reset CMS', 'error');
        } finally {
            setIsResetting(false);
        }
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
        } finally {
            setIsDeleting(false);
        }
    };

    const getDisabledModules = (requiredModules: string[]) =>
        requiredModules.filter(m => !isModuleEnabled(m));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        Theme <span className="text-blue-600">Management</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Upload, configure and activate website themes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={isResetting}
                        className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <TrashIcon className="h-4 w-4" />
                        {isResetting ? 'Resetting...' : 'Reset CMS'}
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".zip"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={isUploading}
                        />
                        <button
                            className="px-6 py-2.5 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            disabled={isUploading}
                        >
                            {isUploading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <CloudArrowUpIcon className="h-4 w-4" />
                            }
                            {isUploading ? 'Uploading...' : 'Upload Theme'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Theme Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : themes.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <SwatchIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">No themes found. Upload a .zip theme to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                        {themes.map((theme) => {
                            const isActive = activeTheme === theme.slug || activeTheme === theme.name;
                            const disabledMods = getDisabledModules(theme.requiredModules);
                            const hasWarning = disabledMods.length > 0;
                            const isBusy = isSettingUp === theme.slug || isActivating === theme.slug;

                            return (
                                <div
                                    key={theme.slug}
                                    className={`group relative bg-white border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 ${isActive ? 'border-blue-300 shadow-blue-100' : 'border-slate-100 hover:border-blue-100'}`}
                                >
                                    {/* Preview Image */}
                                    <div className="relative w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                        {theme.previewUrl ? (
                                            <img
                                                src={`${API_URL}${theme.previewUrl}`}
                                                alt={`${theme.name} preview`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <SwatchIcon className="w-10 h-10 text-slate-300" />
                                            </div>
                                        )}
                                        {isActive && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircleIcon className="w-3 h-3" /> Active
                                            </div>
                                        )}
                                        {hasWarning && (
                                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <ExclamationTriangleIcon className="w-3 h-3" /> Modules Missing
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 space-y-4">
                                        {/* Theme Info */}
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-base font-bold text-slate-900">{theme.name}</h3>
                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">v{theme.version}</span>
                                            </div>
                                            {theme.description && (
                                                <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-2">{theme.description}</p>
                                            )}
                                        </div>

                                        {/* Required Modules */}
                                        {theme.requiredModules.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Required Modules</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {theme.requiredModules.map(mod => (
                                                        <span
                                                            key={mod}
                                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isModuleEnabled(mod)
                                                                ? 'bg-green-50 text-green-700'
                                                                : 'bg-red-50 text-red-600'
                                                                }`}
                                                        >
                                                            {mod}
                                                        </span>
                                                    ))}
                                                </div>
                                                {hasWarning && (
                                                    <p className="text-[10px] text-amber-600 mt-1.5">
                                                        Enable {disabledMods.join(', ')} in Settings → Modules
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Deployed URL */}
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="url"
                                                value={deployedUrls[theme.slug] || ''}
                                                onChange={e => setDeployedUrls(prev => ({ ...prev, [theme.slug]: e.target.value }))}
                                                placeholder="https://your-theme.vercel.app"
                                                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
                                            />
                                            <button
                                                onClick={() => handleSaveDeployedUrl(theme.slug)}
                                                title="Save URL"
                                                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition-colors"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                            </button>
                                            {deployedUrls[theme.slug] && (
                                                <a
                                                    href={deployedUrls[theme.slug]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Open site"
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-green-50 hover:text-green-600 text-slate-500 transition-colors"
                                                >
                                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                                            <button
                                                onClick={() => setSetupModalTheme(theme.slug)}
                                                disabled={isBusy}
                                                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {isSettingUp === theme.slug && (
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                )}
                                                {isSettingUp === theme.slug ? (isRestarting ? 'Restarting...' : 'Setting up...') : 'Setup'}
                                            </button>
                                            <button
                                                onClick={() => !isActive && setActivateModalTheme(theme.slug)}
                                                disabled={isActive || isBusy}
                                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${isActive
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100 cursor-default'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                                                    }`}
                                            >
                                                {isActivating === theme.slug && (
                                                    <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                                )}
                                                {isActive ? 'Active' : isActivating === theme.slug ? (isRestarting ? 'Restarting...' : 'Activating...') : 'Activate'}
                                            </button>
                                            {!isActive && (
                                                <button
                                                    onClick={() => setDeleteModalTheme(theme.slug)}
                                                    disabled={isBusy}
                                                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                                                    title="Delete theme"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Setup Modal */}
            {setupModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Theme Setup</h2>
                            <button onClick={() => setSetupModalTheme(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 flex flex-shrink-0 items-center justify-center">
                                    <TrashIcon className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">How would you like to set up?</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Choose if you want to keep data from the current active theme or start completely fresh.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsFreshSetup(true)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-4 ${isFreshSetup ? 'border-red-600 bg-red-50/50' : 'border-slate-100 bg-white hover:border-red-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${isFreshSetup ? 'border-red-600' : 'border-slate-300'}`}>
                                        {isFreshSetup && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isFreshSetup ? 'text-red-900' : 'text-slate-900'}`}>Fresh Install</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Delete all content (pages, menus, posts) from the current active theme.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setIsFreshSetup(false)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-4 ${!isFreshSetup ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${!isFreshSetup ? 'border-blue-600' : 'border-slate-300'}`}>
                                        {!isFreshSetup && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${!isFreshSetup ? 'text-blue-900' : 'text-slate-900'}`}>Keep Existing Data</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Prepare the theme files but keep all your current content.</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setSetupModalTheme(null)}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirmSetup(isFreshSetup)}
                                className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all text-sm shadow-lg ${isFreshSetup ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isFreshSetup ? 'Purge & Setup' : 'Regular Setup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activation Modal */}
            {activateModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Activate Theme</h2>
                            <button onClick={() => { setActivateModalTheme(null); setImportDemoContent(true); }} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-800">Ready to activate</p>
                                    <p className="text-xs text-blue-600 mt-0.5">This will switch your site's design to the new theme.</p>
                                </div>
                            </div>

                            {/* Only show demo import if theme was setup as FRESH */}
                            {themes.find(t => t.slug === activateModalTheme)?.setupType === 'FRESH' ? (
                                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center mt-1">
                                            <input 
                                                type="checkbox" 
                                                checked={importDemoContent}
                                                onChange={(e) => setImportDemoContent(e.target.checked)}
                                                className="peer sr-only" 
                                            />
                                            <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center group-hover:border-blue-400">
                                                <CheckCircleIcon className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Import Demo Content</div>
                                            <div className="text-sm text-slate-500">Populate the clean slate with this theme's demo posts, pages, and menus to get started quickly.</div>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">This theme was setup in "Keep Data" mode, so no demo content will be imported to prevent duplicates.</p>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => { setActivateModalTheme(null); setImportDemoContent(true); }}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmActivate}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all text-sm"
                            >
                                Confirm Activation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset to Base State Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Reset CMS to Base State</h2>
                            <button onClick={() => setShowResetModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-red-800">This action cannot be undone</p>
                                    <p className="text-xs text-red-600 mt-0.5">All content, pages, menus, team, testimonials, services, and theme settings will be permanently deleted.</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600">
                                The following will be <strong>kept</strong>: your admin user accounts, roles, and CMS system settings.
                            </p>
                            <p className="text-sm text-slate-600">
                                After reset you can set up any theme fresh with demo content.
                            </p>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all text-sm"
                            >
                                Yes, Reset Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Theme Modal */}
            {deleteModalTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-900">Delete Theme</h2>
                            <button onClick={() => setDeleteModalTheme(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to delete <strong>{deleteModalTheme}</strong>? The theme files will be permanently removed.
                            </p>
                            <p className="text-xs text-slate-400">Content and settings are not affected — only the theme files are deleted.</p>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModalTheme(null)}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteTheme}
                                disabled={isDeleting}
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all text-sm disabled:opacity-50 flex items-center gap-2"
                            >
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
