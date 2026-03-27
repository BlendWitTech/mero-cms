'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        cms_title: '',
        cms_subtitle: '',
        cms_login_avatar: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useNotification();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const data = await apiRequest('/settings');
                setSettings(data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiRequest('/settings', {
                method: 'PATCH',
                body: settings,
            });
            showToast('CMS Global Settings synchronized successfully.', 'success');
        } catch (error: any) {
            console.error('Save failed:', error);
            showToast(error.message || 'Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="space-y-6 animate-pulse p-10"><div className="h-12 w-48 bg-slate-100 rounded-xl" /><div className="h-96 bg-slate-100 rounded-[3rem]" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="px-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                    CMS Global <span className="text-blue-600 font-bold">Settings</span>
                </h1>
                <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Configure the administrative interface and login experience.</p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSave} className="bg-white rounded-[3rem] p-5 sm:p-8 lg:p-12 shadow-2xl shadow-slate-200 border border-slate-200 space-y-10 relative group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                    <GlobeAltIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 font-display">Interface Branding</h3>
                                    <p className="text-sm font-medium text-slate-400">Manage titles and visuals for the CMS login and dashboard.</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">CMS Master Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl shadow-sm py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                                        value={settings.cms_title}
                                        onChange={(e) => setSettings({ ...settings, cms_title: e.target.value })}
                                        placeholder="BLENDWIT CMS"
                                    />
                                    <p className="text-[10px] text-slate-400 ml-2">Appears on the login screen and sidebar.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">CMS Subtitle</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl shadow-sm py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                                        value={settings.cms_subtitle}
                                        onChange={(e) => setSettings({ ...settings, cms_subtitle: e.target.value })}
                                        placeholder="Premium Management Console"
                                    />
                                    <p className="text-[10px] text-slate-400 ml-2">Secondary title shown below the main title on login.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">Login Avatar Path</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl shadow-sm py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                                        value={settings.cms_login_avatar}
                                        onChange={(e) => setSettings({ ...settings, cms_login_avatar: e.target.value })}
                                        placeholder="/assets/logo.png"
                                    />
                                    <p className="text-[10px] text-slate-400 ml-2">Public path to the illustration/logo shown on the login page.</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-900/10"
                                >
                                    {isSaving ? 'Synchronizing…' : 'Save Global Settings'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative shadow-2xl shadow-slate-900/40 group">
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
            </div>
        </div>
    );
}
