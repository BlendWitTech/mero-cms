'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        cms_title: '',
        cms_subtitle: '',
        cms_login_avatar: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">CMS Global Settings</h1>

            <form onSubmit={handleSave} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">CMS Title</label>
                        <input
                            type="text"
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            value={settings.cms_title}
                            onChange={(e) => setSettings({ ...settings, cms_title: e.target.value })}
                        />
                        <p className="mt-2 text-xs text-slate-500">The main title displayed on the login page.</p>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">CMS Subtitle</label>
                        <input
                            type="text"
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            value={settings.cms_subtitle}
                            onChange={(e) => setSettings({ ...settings, cms_subtitle: e.target.value })}
                        />
                        <p className="mt-2 text-xs text-slate-500">Subtext displayed under the title.</p>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Login Avatar Path</label>
                        <input
                            type="text"
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            value={settings.cms_login_avatar}
                            onChange={(e) => setSettings({ ...settings, cms_login_avatar: e.target.value })}
                        />
                        <p className="mt-2 text-xs text-slate-500">Public URL or path to the avatar image (e.g., /assets/boy_idea_shock.png).</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSaving ? 'Saving Changes...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
