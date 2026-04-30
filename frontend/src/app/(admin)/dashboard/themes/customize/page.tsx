'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Monitor,
    Smartphone,
    Tablet,
    Save,
    RotateCcw,
    Palette,
    Type,
    Settings2,
    CheckCircle2,
    Eye,
    Lock,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

const FONT_OPTIONS = [
    'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Montserrat',
    'Playfair Display', 'Merriweather', 'Lato', 'Nunito', 'Raleway',
];

const COLOR_PRESETS = [
    { label: 'Blue',   primary: '#2563eb', secondary: '#7c3aed', accent: '#0ea5e9' },
    { label: 'Red',    primary: '#dc2626', secondary: '#9f1239', accent: '#f97316' },
    { label: 'Green',  primary: '#16a34a', secondary: '#0d9488', accent: '#84cc16' },
    { label: 'Purple', primary: '#7c3aed', secondary: '#db2777', accent: '#8b5cf6' },
    { label: 'Slate',  primary: '#334155', secondary: '#475569', accent: '#0ea5e9' },
];

export default function ThemeCustomizer() {
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [activeTheme, setActiveTheme] = useState<any>(null);
    const [iframeError, setIframeError] = useState(false);
    const [settings, setSettings] = useState<any>({
        site_title: '',
        site_tagline: '',
        primary_color: '#2563eb',
        secondary_color: '#7c3aed',
        accent_color: '#0ea5e9',
        heading_font: 'Inter',
        body_font: 'Inter',
        logo_url: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);
    const { showToast } = useNotification();

    const themeUrl =
        process.env.NEXT_PUBLIC_THEME_URL ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'http://localhost:3002'
            : '');

    useEffect(() => {
        const load = async () => {
            try {
                const [themeData, settingsData] = await Promise.all([
                    apiRequest('/themes/active').catch(() => null),
                    apiRequest('/settings'),
                ]);
                setActiveTheme(themeData);
                if (settingsData && typeof settingsData === 'object') {
                    setSettings((prev: any) => ({
                        ...prev,
                        site_title: settingsData.site_title || prev.site_title,
                        site_tagline: settingsData.site_tagline || prev.site_tagline,
                        primary_color: settingsData.primary_color || prev.primary_color,
                        secondary_color: settingsData.secondary_color || prev.secondary_color,
                        accent_color: settingsData.accent_color || prev.accent_color,
                        heading_font: settingsData.heading_font || prev.heading_font,
                        body_font: settingsData.body_font || prev.body_font,
                        logo_url: settingsData.logo_url || prev.logo_url,
                    }));
                }
            } catch {
                showToast('Failed to load theme settings', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiRequest('/settings', { method: 'PATCH', body: settings });
            showToast('Design settings published!', 'success');
            setIframeKey(k => k + 1);
        } catch {
            showToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setSettings((prev: any) => ({
            ...prev,
            primary_color: preset.primary,
            secondary_color: preset.secondary,
            accent_color: preset.accent,
        }));
    };

    const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

    if (isLoading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Top Toolbar */}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/themes" className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Visual Customizer</h1>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                            {activeTheme?.activeTheme || 'Active Theme'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-white/[0.06]">
                    {(['desktop', 'tablet', 'mobile'] as const).map(mode => {
                        const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
                        return (
                            <button key={mode} onClick={() => setViewMode(mode)}
                                className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                <Icon className="h-4 w-4" />
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    {themeUrl && (
                        <a href={themeUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Theme
                        </a>
                    )}
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                        {isSaving ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        {isSaving ? 'Publishing...' : 'Publish Changes'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Controls */}
                <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/[0.06] flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Branding */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Settings2 className="h-4 w-4 text-slate-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Site Identity</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Site Name</label>
                                    <input type="text" value={settings.site_title}
                                        onChange={e => setSettings({ ...settings, site_title: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Tagline</label>
                                    <input type="text" value={settings.site_tagline}
                                        onChange={e => setSettings({ ...settings, site_tagline: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/10 outline-none transition-all" />
                                </div>
                            </div>
                        </section>

                        {/* Color Presets */}
                        <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-3">
                                <Palette className="h-4 w-4 text-slate-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Color System</h3>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {COLOR_PRESETS.map(p => (
                                    <button key={p.label} onClick={() => applyPreset(p)} title={p.label}
                                        className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-md hover:scale-110 transition-transform ring-offset-2 hover:ring-2 ring-blue-600/30"
                                        style={{ backgroundColor: p.primary }} />
                                ))}
                            </div>

                            <div className="space-y-3">
                                {[
                                    { key: 'primary_color', label: 'Primary' },
                                    { key: 'secondary_color', label: 'Secondary' },
                                    { key: 'accent_color', label: 'Accent' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/[0.06]">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase block">{label}</span>
                                            <span className="text-[10px] font-mono text-slate-400">{settings[key]}</span>
                                        </div>
                                        <input type="color" value={settings[key] || '#000000'}
                                            onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                                            className="w-10 h-10 rounded-lg border-none bg-transparent cursor-pointer overflow-hidden" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Typography */}
                        <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-3">
                                <Type className="h-4 w-4 text-slate-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Typography</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { key: 'heading_font', label: 'Heading Font' },
                                    { key: 'body_font', label: 'Body Font' },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">{label}</label>
                                        <select value={settings[key] || 'Inter'}
                                            onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/10 outline-none transition-all appearance-none">
                                            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ─── Design Tokens: Typography + Spacing Scale ─── */}
                        <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Typography Scale</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 italic mb-2">
                                Numeric px values. Themes reference via <code>var(--text-base)</code>, <code>var(--text-xl)</code>, etc.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'text_sm', label: 'sm', def: 13 },
                                    { key: 'text_base', label: 'base', def: 16 },
                                    { key: 'text_lg', label: 'lg', def: 18 },
                                    { key: 'text_xl', label: 'xl', def: 22 },
                                    { key: 'text_2xl', label: '2xl', def: 32 },
                                    { key: 'text_3xl', label: '3xl', def: 48 },
                                ].map(({ key, label, def }) => (
                                    <div key={key}>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">{label}</label>
                                        <input
                                            type="number"
                                            value={settings[key] ?? ''}
                                            placeholder={String(def)}
                                            onChange={e => setSettings({ ...settings, [key]: e.target.value === '' ? undefined : Number(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/10 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">Spacing Scale</h3>
                            <p className="text-[10px] text-slate-400 italic mb-2">
                                8-step modular scale. Themes reference via <code>var(--space-1)</code> through <code>var(--space-8)</code>.
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
                                    const defaults: Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 };
                                    const key = `space_${n}`;
                                    return (
                                        <div key={key}>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">{n}</label>
                                            <input
                                                type="number"
                                                value={settings[key] ?? ''}
                                                placeholder={String(defaults[n])}
                                                onChange={e => setSettings({ ...settings, [key]: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] rounded-xl px-2 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/10 outline-none"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* White-label Section (Locked) */}
                        <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/[0.06] opacity-60">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">White Labeling</h3>
                                </div>
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Enterprise</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/[0.06]">
                                <p className="text-[10px] text-slate-400 italic">Upgrade to Enterprise to remove &quot;Powered by Mero CMS&quot; branding.</p>
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/[0.06]">
                        <div className="bg-blue-600/5 dark:bg-blue-500/5 rounded-2xl p-4 border border-blue-600/10 dark:border-blue-500/10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Live Sync</span>
                            </div>
                            <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed font-medium">Changes are staged locally. Hit &quot;Publish&quot; to update your live website globally.</p>
                        </div>
                    </div>
                </aside>

                {/* Preview Area */}
                <main className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 flex flex-col items-center">
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-300 dark:shadow-none overflow-hidden transition-all duration-500 flex flex-col border border-white dark:border-white/[0.06]"
                        style={{ width: viewportWidths[viewMode], flex: 1 }}>
                        {/* Browser Chrome */}
                        <div className="h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-white/[0.06] flex items-center px-4 gap-4 shrink-0">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            </div>
                            <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg h-6 flex items-center px-3 gap-2 border border-slate-100 dark:border-white/[0.06]">
                                <Lock className="h-2 w-2 text-slate-300" />
                                <span className="text-[10px] text-slate-400 font-mono truncate">{themeUrl || 'yourdomain.com'}</span>
                            </div>
                        </div>

                        {/* Site Preview */}
                        <div className="flex-1 relative bg-slate-50 dark:bg-slate-900">
                            {themeUrl && !iframeError ? (
                                <iframe key={iframeKey} src={themeUrl}
                                    className="w-full h-full border-none" title="Theme Preview"
                                    onError={() => setIframeError(true)} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 p-8">
                                    <Eye className="h-10 w-10 opacity-30" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                            {iframeError ? 'Theme server not running' : 'No theme URL configured'}
                                        </p>
                                        <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
                                            Start the theme dev server in your terminal:
                                        </p>
                                        <code className="block mt-2 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg font-mono">
                                            {`cd themes/${activeTheme?.activeTheme || '<theme-dir>'} && npm run dev`}
                                        </code>
                                        {iframeError && (
                                            <button onClick={() => setIframeError(false)}
                                                className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-slate-400">
                        <Eye className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Preview
                        </span>
                    </div>
                </main>
            </div>
        </div>
    );
}
