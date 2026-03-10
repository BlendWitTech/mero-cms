'use client';

import { useState, useEffect } from 'react';
import {
    CloudArrowUpIcon,
    SwatchIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    LinkIcon
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
    const [isSettingUp, setIsSettingUp] = useState<string | null>(null);
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
            // Init deployed URL state from theme details
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

    const handleSetup = async (slug: string) => {
        try {
            setIsSettingUp(slug);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/themes/${slug}/setup`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Setup failed');
            const r = data.results || {};
            const summary = Object.entries(r)
                .filter(([, v]) => (v as number) > 0)
                .map(([k, v]) => `${v} ${k}`)
                .join(', ');
            showToast(`Theme setup complete! ${summary}`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Setup failed', 'error');
        } finally {
            setIsSettingUp(null);
        }
    };

    const handleActivate = async (slug: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/themes/${slug}/activate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Activation failed');
            setActiveTheme(slug);
            showToast(`Theme "${slug}" is now active`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Activation failed', 'error');
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
                                            {theme.author && (
                                                <p className="text-[10px] text-slate-400 mt-1">By {theme.author}</p>
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
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deployed URL</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={deployedUrls[theme.slug] || ''}
                                                    onChange={e => setDeployedUrls(prev => ({ ...prev, [theme.slug]: e.target.value }))}
                                                    placeholder="https://myclient.com"
                                                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-400"
                                                />
                                                <button
                                                    onClick={() => handleSaveDeployedUrl(theme.slug)}
                                                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                                    title="Save URL"
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                                            <button
                                                onClick={() => handleSetup(theme.slug)}
                                                disabled={isSettingUp === theme.slug}
                                                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {isSettingUp === theme.slug && (
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                )}
                                                {isSettingUp === theme.slug ? 'Setting up...' : 'Setup'}
                                            </button>
                                            <button
                                                onClick={() => !isActive && handleActivate(theme.slug)}
                                                disabled={isActive}
                                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100 cursor-default'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {isActive ? 'Active' : 'Activate'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
