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
    
    // Modal form states
    const [startFresh, setStartFresh] = useState(false);
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/themes/${slug}/install-modules`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to check modules');
            
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

    const handleConfirmSetup = async (importDemo: boolean) => {
        const slug = setupModalTheme;
        if (!slug) return;
        setSetupModalTheme(null);
        try {
            setIsSettingUp(slug);
            const proceed = await checkAndInstallModules(slug);
            if (!proceed) return;

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/themes/${slug}/setup`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ importDemoContent: importDemo })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Setup failed');
            const r = data.results || {};
            const summary = Object.entries(r)
                .filter(([, v]) => (v as number) > 0)
                .map(([k, v]) => `${v} ${k}`)
                .join(', ');
            showToast(`Theme setup complete! ${summary || 'Dependencies installed.'}`, 'success');
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

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/themes/${slug}/activate`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    clearData: startFresh, 
                    importDemoContent: startFresh ? importDemoContent : false 
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Activation failed');
            setActiveTheme(slug);
            showToast(`Theme "${slug}" is now active`, 'success');
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

            {/* Theme Grid */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
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
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center">
                                    <DocumentDuplicateIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Import Demo Content?</h3>
                                    <p className="text-sm text-slate-500 mt-1">This will populate your site with sample pages, posts, and menus designed for this theme.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => handleConfirmSetup(false)}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Setup Without Data
                            </button>
                            <button
                                onClick={() => handleConfirmSetup(true)}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all text-sm"
                            >
                                Import Demo Data
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
                            <button onClick={() => { setActivateModalTheme(null); setStartFresh(false); setImportDemoContent(true); }} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            
                            {/* Data Options */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setStartFresh(false)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-4 ${!startFresh ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${!startFresh ? 'border-blue-600' : 'border-slate-300'}`}>
                                        {!startFresh && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${!startFresh ? 'text-blue-900' : 'text-slate-900'}`}>Keep Existing Content</div>
                                        <div className="text-sm text-slate-500 mt-0.5">Activate the theme but leave all my current posts, pages, and menus exactly as they are.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStartFresh(true)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-4 ${startFresh ? 'border-red-600 bg-red-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-red-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${startFresh ? 'border-red-600' : 'border-slate-300'}`}>
                                        {startFresh && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold flex items-center gap-2 ${startFresh ? 'text-red-900' : 'text-slate-900'}`}>
                                            Start Fresh <TrashIcon className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div className="text-sm text-slate-500 mt-0.5">Clear out all existing old data to give the new theme a clean slate.</div>
                                    </div>
                                </button>
                            </div>

                            {/* Demo Content Toggle (Only shown if starting fresh) */}
                            {startFresh && (
                                <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
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
                                            <div className="text-sm text-slate-500">Also populate the clean slate with this theme's demo posts, pages, and menus to get started quickly.</div>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => { setActivateModalTheme(null); setStartFresh(false); setImportDemoContent(true); }}
                                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmActivate}
                                className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all text-sm shadow-lg ${startFresh ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
                            >
                                {startFresh ? 'Clear Data & Activate' : 'Activate Theme'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
