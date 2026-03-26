'use client';

import React, { useState, useEffect } from 'react';
import {
    Cog6ToothIcon,
    GlobeAltIcon,
    PhotoIcon,
    ShieldCheckIcon,
    ServerIcon,
    CloudArrowUpIcon,
    RocketLaunchIcon,
    FingerPrintIcon,
    ArrowPathIcon,
    NoSymbolIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    CheckBadgeIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    CloudIcon,
    ServerStackIcon,
    PuzzlePieceIcon,
    ShareIcon,
    BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import Alert from '@/components/ui/Alert';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import MediaPickerModal from '@/components/ui/MediaPickerModal';
import { useNotification } from '@/context/NotificationContext';
import { useModules } from '@/context/ModulesContext';

function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

const MODULE_GROUPS = ['Content', 'Marketing', 'Site', 'SEO & Analytics'];

interface ModuleMeta {
    key: string;
    label: string;
    description: string;
    group: string;
}

function TestEmailCard() {
    const { showToast } = useNotification();
    const [sending, setSending] = React.useState(false);
    const [testTo, setTestTo] = React.useState('');

    const handleSend = async () => {
        if (!testTo) { showToast('Enter a recipient email address.', 'error'); return; }
        setSending(true);
        try {
            await apiRequest('/settings/test-email', { method: 'POST', body: { to: testTo } });
            showToast(`Test email sent to ${testTo}`, 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to send test email.', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-200/60 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                    <EnvelopeIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 font-display">Test Email Delivery</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Verify your email configuration is working</p>
                </div>
            </div>
            <div className="flex gap-3">
                <input
                    type="email"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/20 transition-all"
                />
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {sending ? 'Sending…' : 'Send Test'}
                </button>
            </div>
        </div>
    );
}

function ClearThemeCacheCard() {
    const { showToast } = useNotification();
    const [clearing, setClearing] = React.useState(false);
    const [lastCleared, setLastCleared] = React.useState<string | null>(null);

    const handleClear = async () => {
        setClearing(true);
        try {
            await apiRequest('/settings/clear-theme-cache', { method: 'POST' });
            setLastCleared(new Date().toLocaleTimeString());
            showToast('Theme cache cleared. Visitors will see the latest content.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to clear theme cache.', 'error');
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-200/60 flex flex-col space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 text-white">
                    <ArrowPathIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 font-display">Theme Cache</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Force visitors to see your latest changes immediately</p>
                </div>
            </div>
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                    The theme caches pages for performance. After updating content, colors, or settings, click below to clear the cache so visitors see your latest changes without waiting.
                </p>
            </div>
            {lastCleared && (
                <p className="text-xs text-emerald-600 font-bold">Last cleared at {lastCleared}</p>
            )}
            <button
                onClick={handleClear}
                disabled={clearing}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <ArrowPathIcon className={`h-4 w-4 ${clearing ? 'animate-spin' : ''}`} />
                {clearing ? 'Clearing Cache…' : 'Clear Theme Cache'}
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('branding');
    const { showToast } = useNotification();
    const { enabledModules, refresh: refreshModules } = useModules();

    // Modules state
    const [availableModules, setAvailableModules] = useState<ModuleMeta[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);

    // Audit Logs State
    const [globalLogs, setGlobalLogs] = useState<any[]>([]);
    const [logsTotal, setLogsTotal] = useState(0);
    const [isLogsLoading, setIsLogsLoading] = useState(false);
    const [logsPagination, setLogsPagination] = useState({ skip: 0, take: 10 });
    const [editModes, setEditModes] = useState<Record<string, boolean>>({});
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'favicon' | null>(null);
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, section: string | null }>({
        isOpen: false,
        section: null
    });
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [showResendKey, setShowResendKey] = useState(false);

    const isSectionEditing = (section: string, keys: string[]) => {
        if (editModes[section]) return true;
        // If all keys in this section are empty, assume we are in "add" mode
        return keys.every(key => !settings[key]);
    };

    const toggleEdit = (section: string) => {
        setEditModes(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCancel = (section: string) => {
        setCancelModal({ isOpen: true, section });
    };

    const confirmCancel = () => {
        if (cancelModal.section) {
            toggleEdit(cancelModal.section);
            // Reload settings to revert local state
            apiRequest('/settings').then(setSettings);
        }
        setCancelModal({ isOpen: false, section: null });
    };

    useEffect(() => {
        apiRequest('/settings')
            .then(data => {
                setSettings(data);
                setIsLoading(false);
            })
            .catch(err => console.error(err));

        // Load available modules for the Modules tab
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/setup/modules`)
            .then(r => r.json())
            .then(data => setAvailableModules(data.optional || []))
            .catch(() => { });
    }, []);

    // Sync selected modules with currently enabled ones
    useEffect(() => {
        if (enabledModules.length > 0) {
            setSelectedModules(enabledModules.filter(m =>
                !['auth', 'users', 'roles', 'settings', 'media', 'audit-log', 'mail', 'notifications', 'invitations', 'tasks'].includes(m)
            ));
        }
    }, [enabledModules]);


    const fetchGlobalLogs = async () => {
        setIsLogsLoading(true);
        try {
            const data = await apiRequest(`/users/logs/all?skip=${logsPagination.skip}&take=${logsPagination.take}`);
            setGlobalLogs(data.logs || []);
            setLogsTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch global logs:', error);
        } finally {
            setIsLogsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'audit-logs') {
            fetchGlobalLogs();
        }
    }, [activeTab, logsPagination]);

    const handleSave = async (section: string) => {
        try {
            await apiRequest('/settings', {
                method: 'PATCH',
                body: settings,
            });
            showToast('Settings successfully synchronized cross-platform.', 'success');
            setEditModes(prev => ({ ...prev, [section]: false }));
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to update system configurations.', 'error');
        }
    };

    if (isLoading) return <div className="space-y-6 animate-pulse p-10"><div className="h-12 w-48 bg-slate-100 rounded-xl" /><div className="h-96 bg-slate-100 rounded-[3rem]" /></div>;

    const tabs = [
        { id: 'branding', label: 'Branding & Identity', icon: GlobeAltIcon },
        { id: 'website', label: 'Website & Social', icon: BuildingOffice2Icon },
        { id: 'modules', label: 'Modules', icon: PuzzlePieceIcon },
        { id: 'email', label: 'Email Services', icon: EnvelopeIcon },
        { id: 'media', label: 'Media Cloud', icon: CloudIcon },
        { id: 'security', label: 'Security & Access', icon: ShieldCheckIcon },
        { id: 'performance', label: 'Performance', icon: RocketLaunchIcon },
        { id: 'audit-logs', label: 'Audit Ledger', icon: FingerPrintIcon },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="px-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                    System <span className="text-blue-600 font-bold">Configuration</span>
                </h1>
                <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Fine-tune your CMS architecture and global parameters.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-[2rem] border border-slate-200/50 backdrop-blur-sm sticky top-4 z-50">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={classNames(
                            "flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[1.75rem] text-[11px] font-bold uppercase tracking-widest transition-all",
                            activeTab === tab.id ? "bg-white text-blue-600 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Branding Tab */}
                {activeTab === 'branding' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-200/60 space-y-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900 font-display">Identity & SEO</h3>
                                        <p className="text-sm font-medium text-slate-400">Configure how your site appears to engines and users.</p>
                                    </div>
                                    {!isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && (
                                        <button
                                            onClick={() => toggleEdit('branding')}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Master Site Title</label>
                                        <input
                                            type="text"
                                            disabled={!isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text'])}
                                            value={settings.site_title || ''}
                                            onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">App Tagline</label>
                                        <input
                                            type="text"
                                            disabled={!isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text'])}
                                            value={settings.site_tagline || ''}
                                            onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Copyright Disclaimer</label>
                                    <input
                                        type="text"
                                        disabled={!isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text'])}
                                        value={settings.copyright_text || ''}
                                        onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-[12px] focus:ring-blue-600/5 transition-all disabled:opacity-60"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Logo */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Logo</label>
                                        <div
                                            onClick={() => isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && setMediaPickerTarget('logo')}
                                            className={`relative flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl transition-all ${isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30' : 'opacity-60'}`}
                                        >
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {settings.logo_url
                                                    ? <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    : <PhotoIcon className="w-7 h-7 text-slate-300" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700 mb-1">{settings.logo_url ? 'Logo set' : 'No logo'}</p>
                                                {settings.logo_url && <p className="text-[10px] text-slate-400 truncate">{settings.logo_url}</p>}
                                                {isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && (
                                                    <span className="text-[10px] font-bold text-blue-600 mt-1 block">Click to choose from media library</span>
                                                )}
                                            </div>
                                            {settings.logo_url && isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSettings({ ...settings, logo_url: '' }); }}
                                                    className="absolute top-2 right-2 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-200"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Favicon */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Favicon</label>
                                        <div
                                            onClick={() => isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && setMediaPickerTarget('favicon')}
                                            className={`relative flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl transition-all ${isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30' : 'opacity-60'}`}
                                        >
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {settings.favicon_url
                                                    ? <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    : <PhotoIcon className="w-7 h-7 text-slate-300" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700 mb-1">{settings.favicon_url ? 'Favicon set' : 'No favicon'}</p>
                                                {settings.favicon_url && <p className="text-[10px] text-slate-400 truncate">{settings.favicon_url}</p>}
                                                {isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && (
                                                    <span className="text-[10px] font-bold text-blue-600 mt-1 block">Click to choose from media library</span>
                                                )}
                                            </div>
                                            {settings.favicon_url && isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSettings({ ...settings, favicon_url: '' }); }}
                                                    className="absolute top-2 right-2 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-200"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Media Picker Modal */}
                                {mediaPickerTarget && (
                                    <MediaPickerModal
                                        isOpen={true}
                                        onClose={() => setMediaPickerTarget(null)}
                                        onSelect={(url) => {
                                            if (mediaPickerTarget === 'logo') setSettings((s: any) => ({ ...s, logo_url: url }));
                                            if (mediaPickerTarget === 'favicon') setSettings((s: any) => ({ ...s, favicon_url: url }));
                                            setMediaPickerTarget(null);
                                        }}
                                    />
                                )}

                                {isSectionEditing('branding', ['site_title', 'site_tagline', 'copyright_text']) && editModes['branding'] && (
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => handleSave('branding')}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => handleCancel('branding')}
                                            className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 group">
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                <h3 className="text-xl font-bold font-display relative z-10">Sync Configuration</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-2 relative z-10 leading-relaxed mb-8">Updates are broadcasted instantly to all active frontend instances via the core hub.</p>
                                <button onClick={() => handleSave('global')} className="w-full bg-white text-slate-900 hover:bg-blue-600 hover:text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl relative z-10">
                                    Push Global Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Website & Social Tab */}
                {activeTab === 'website' && (
                    <div className="space-y-10">
                        {/* Contact Info */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-200/60 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                        <BuildingOffice2Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Contact Information</h3>
                                        <p className="text-sm text-slate-400">Shown in the footer, contact page, and CTA sections. To edit page section content (hero text, images, buttons) go to <a href="/dashboard/site-pages" className="text-blue-600 underline">Site Pages</a>.</p>
                                    </div>
                                </div>
                                {!isSectionEditing('contact', ['contact_email', 'contact_phone', 'address']) && (
                                    <button onClick={() => toggleEdit('contact')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { key: 'contact_email', label: 'Contact Email', placeholder: 'info@yourcompany.com', type: 'email' },
                                    { key: 'contact_phone', label: 'Phone Number', placeholder: '+977 9800000000', type: 'text' },
                                    { key: 'footer_text', label: 'Footer Text / Tagline', placeholder: 'Your tagline here', type: 'text' },
                                    { key: 'primary_color', label: 'Brand Primary Color', placeholder: '#1B4332', type: 'text' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">{f.label}</label>
                                        <input
                                            type={f.type}
                                            disabled={!isSectionEditing('contact', ['contact_email', 'contact_phone', 'address'])}
                                            value={settings[f.key] || ''}
                                            onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                ))}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Address</label>
                                    <textarea
                                        rows={2}
                                        disabled={!isSectionEditing('contact', ['contact_email', 'contact_phone', 'address'])}
                                        value={settings.address || ''}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                        placeholder="123 Main Street, Kathmandu, Nepal"
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all disabled:opacity-60 resize-none"
                                    />
                                </div>
                            </div>
                            {isSectionEditing('contact', ['contact_email', 'contact_phone', 'address']) && editModes['contact'] && (
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => handleSave('contact')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Save</button>
                                    <button onClick={() => handleCancel('contact')} className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                </div>
                            )}
                        </div>

                        {/* Social Media Links */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-200/60 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-500/20 text-white">
                                        <ShareIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Social Media Links</h3>
                                        <p className="text-sm text-slate-400">Used in the footer, header, and wherever social icons appear on the theme.</p>
                                    </div>
                                </div>
                                {!isSectionEditing('social', ['social_facebook', 'social_instagram']) && (
                                    <button onClick={() => toggleEdit('social')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage', color: '#1877F2' },
                                    { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', color: '#E4405F' },
                                    { key: 'social_twitter', label: 'Twitter / X', placeholder: 'https://x.com/yourhandle', color: '#000000' },
                                    { key: 'social_linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourco', color: '#0A66C2' },
                                    { key: 'social_youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel', color: '#FF0000' },
                                    { key: 'social_whatsapp', label: 'WhatsApp', placeholder: '+977 9800000000 (number only)', color: '#25D366' },
                                    { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle', color: '#000000' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2" style={{ color: f.color }}>
                                            {f.label}
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isSectionEditing('social', ['social_facebook', 'social_instagram'])}
                                            value={settings[f.key] || ''}
                                            onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-violet-500/5 focus:bg-white focus:border-violet-500/20 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                ))}
                            </div>
                            {isSectionEditing('social', ['social_facebook', 'social_instagram']) && editModes['social'] && (
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => handleSave('social')} className="bg-violet-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all">Save Social Links</button>
                                    <button onClick={() => handleCancel('social')} className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* Modules Tab */}
                {activeTab === 'modules' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-200/60">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                        <PuzzlePieceIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Installed Modules</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Active modules for this CMS instance. Modules are managed via theme setup.</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest">View Only</span>
                            </div>

                            {MODULE_GROUPS.map(group => {
                                const groupModules = availableModules.filter(m => m.group === group);
                                if (groupModules.length === 0) return null;
                                return (
                                    <div key={group} className="mb-8">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{group}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {groupModules.map(mod => {
                                                const isEnabled = selectedModules.includes(mod.key);
                                                return (
                                                    <div
                                                        key={mod.key}
                                                        className={`text-left p-4 rounded-2xl border select-none ${isEnabled
                                                            ? 'bg-blue-50 border-blue-200 text-slate-900'
                                                            : 'bg-slate-50 border-slate-200 text-slate-400'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-bold">{mod.label}</span>
                                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                                {isEnabled ? '✓' : ''}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 leading-snug">{mod.description}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Email Services Tab */}
                {activeTab === 'email' && (
                    <div className="space-y-8">
                        {/* Config card */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-200/60 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 text-white">
                                        <EnvelopeIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 font-display">Email Configuration</h3>
                                        <p className="text-sm font-medium text-slate-400">Choose your email delivery provider.</p>
                                    </div>
                                </div>
                                {!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from']) && (
                                    <button
                                        onClick={() => toggleEdit('email')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Edit Email
                                    </button>
                                )}
                            </div>

                            {/* Provider toggle */}
                            <div className="mb-8 relative z-10">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em] mb-3">Email Provider</p>
                                <div className="grid grid-cols-2 gap-3 max-w-md">
                                    {(['resend', 'smtp'] as const).map(p => (
                                        <button
                                            key={p}
                                            disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                            onClick={() => setSettings({ ...settings, email_provider: p })}
                                            className={`py-4 px-5 rounded-2xl border-2 text-left transition-all disabled:cursor-default ${(settings.email_provider || 'smtp') === p ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                        >
                                            <p className={`text-sm font-bold ${(settings.email_provider || 'smtp') === p ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                {p === 'resend' ? 'Resend' : 'SMTP / Gmail'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                                                {p === 'resend' ? 'HTTP API — works on all hosts' : 'Traditional SMTP server'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resend fields */}
                            {(settings.email_provider || 'smtp') === 'resend' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Resend API Key</label>
                                        <div className="relative">
                                            <input
                                                type={showResendKey ? 'text' : 'password'}
                                                disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                                value={settings.resend_api_key || ''}
                                                onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                                placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                                            />
                                            <button type="button" onClick={() => setShowResendKey(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors" tabIndex={-1}>
                                                {showResendKey
                                                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                }
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 ml-2">Get your API key from resend.com → API Keys</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Sender Email (From)</label>
                                        <input
                                            type="email"
                                            disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                            value={settings.smtp_from || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                            placeholder="noreply@yourdomain.com"
                                        />
                                        <p className="text-[10px] text-slate-400 ml-2">Must be a verified domain in your Resend account</p>
                                    </div>
                                </div>
                            )}

                            {/* SMTP fields */}
                            {(settings.email_provider || 'smtp') === 'smtp' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">SMTP Host</label>
                                        <input
                                            type="text"
                                            disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                            value={settings.smtp_host || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                            placeholder="smtp.example.com"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Sender Email (From)</label>
                                        <input
                                            type="email"
                                            disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                            value={settings.smtp_from || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                            placeholder="noreply@yourdomain.com"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">SMTP Port</label>
                                        <input
                                            type="text"
                                            disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                            value={settings.smtp_port || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                            placeholder="587"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Username</label>
                                        <input
                                            type="text"
                                            disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                            value={settings.smtp_user || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between ml-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Password</label>
                                            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">Gmail App Password: paste without spaces</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showSmtpPass ? 'text' : 'password'}
                                                disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                                value={settings.smtp_pass || ''}
                                                onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value.replace(/\s/g, '') })}
                                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500/20 transition-all disabled:opacity-60"
                                                placeholder="Paste App Password (spaces auto-removed)"
                                            />
                                            <button type="button" onClick={() => setShowSmtpPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors" tabIndex={-1}>
                                                {showSmtpPass
                                                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-colors">
                                            <input
                                                type="checkbox"
                                                disabled={!isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from'])}
                                                checked={settings.smtp_secure === 'true'}
                                                onChange={(e) => setSettings({ ...settings, smtp_secure: String(e.target.checked) })}
                                                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700">Use Secure Connection (TLS/SSL)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {isSectionEditing('email', ['email_provider', 'resend_api_key', 'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_from']) && (
                                <div className="mt-8 flex justify-end gap-4 relative z-10">
                                    <button
                                        onClick={() => handleSave('email')}
                                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Save Email Settings
                                    </button>
                                    {editModes['email'] && (
                                        <button
                                            onClick={() => handleCancel('email')}
                                            className="bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Test Email card */}
                        <TestEmailCard />
                    </div>
                )}

                {/* Media Cloud Tab */}
                {activeTab === 'media' && (
                    <div className="space-y-10">
                        {/* Cloudinary Section */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-200/60 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                        <CloudIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 font-display">Cloudinary</h3>
                                        <p className="text-sm font-medium text-slate-400">External media storage and transformation.</p>
                                    </div>
                                </div>
                                {!isSectionEditing('cloudinary', ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']) && (
                                    <button
                                        onClick={() => toggleEdit('cloudinary')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Edit Cloudinary
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Cloud Name</label>
                                    <input
                                        type="text"
                                        disabled={!isSectionEditing('cloudinary', ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret'])}
                                        value={settings.cloudinary_cloud_name || ''}
                                        onChange={(e) => setSettings({ ...settings, cloudinary_cloud_name: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all disabled:opacity-60"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">API Key</label>
                                    <input
                                        type="text"
                                        disabled={!isSectionEditing('cloudinary', ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret'])}
                                        value={settings.cloudinary_api_key || ''}
                                        onChange={(e) => setSettings({ ...settings, cloudinary_api_key: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all disabled:opacity-60"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">API Secret</label>
                                    <input
                                        type="password"
                                        disabled={!isSectionEditing('cloudinary', ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret'])}
                                        value={settings.cloudinary_api_secret || ''}
                                        onChange={(e) => setSettings({ ...settings, cloudinary_api_secret: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20 transition-all opacity-50 focus:opacity-100 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {isSectionEditing('cloudinary', ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']) && editModes['cloudinary'] && (
                                <div className="flex gap-4 pt-8 relative z-10">
                                    <button
                                        onClick={() => handleSave('cloudinary')}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                                    >
                                        Save Cloudinary
                                    </button>
                                    <button
                                        onClick={() => handleCancel('cloudinary')}
                                        className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* S3 / R2 Section */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-200/40 border border-slate-200/60 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-600 rounded-2xl shadow-xl shadow-orange-500/20 text-white">
                                        <ServerStackIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 font-display">S3 / R2 / Object Storage</h3>
                                        <p className="text-sm font-medium text-slate-400">AWS S3, Cloudflare R2, or any S3-compatible storage.</p>
                                    </div>
                                </div>
                                {!isSectionEditing('s3', ['s3_access_key', 's3_bucket']) && (
                                    <button
                                        onClick={() => toggleEdit('s3')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Edit S3
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key ID</label>
                                    <input
                                        type="text"
                                        disabled={!isSectionEditing('s3', ['s3_access_key', 's3_bucket'])}
                                        value={settings.s3_access_key || ''}
                                        onChange={(e) => setSettings({ ...settings, s3_access_key: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-orange-600/5 focus:bg-white focus:border-orange-600/20 transition-all disabled:opacity-60"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Secret Access Key</label>
                                    <input
                                        type="password"
                                        disabled={!isSectionEditing('s3', ['s3_access_key', 's3_bucket'])}
                                        value={settings.s3_secret_key || ''}
                                        onChange={(e) => setSettings({ ...settings, s3_secret_key: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-orange-600/5 focus:bg-white focus:border-orange-600/20 transition-all opacity-50 focus:opacity-100 disabled:opacity-60"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Bucket Name</label>
                                    <input
                                        type="text"
                                        disabled={!isSectionEditing('s3', ['s3_access_key', 's3_bucket'])}
                                        value={settings.s3_bucket || ''}
                                        onChange={(e) => setSettings({ ...settings, s3_bucket: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-orange-600/5 focus:bg-white focus:border-orange-600/20 transition-all disabled:opacity-60"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Endpoint URL (Optional)</label>
                                    <input
                                        type="text"
                                        disabled={!isSectionEditing('s3', ['s3_access_key', 's3_bucket'])}
                                        value={settings.s3_endpoint || ''}
                                        onChange={(e) => setSettings({ ...settings, s3_endpoint: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-[12px] focus:ring-orange-600/5 focus:bg-white focus:border-orange-600/20 transition-all disabled:opacity-60"
                                        placeholder="e.g. https://<id>.r2.cloudflarestorage.com"
                                    />
                                </div>
                            </div>

                            {isSectionEditing('s3', ['s3_access_key', 's3_bucket']) && editModes['s3'] && (
                                <div className="flex gap-4 pt-8 relative z-10">
                                    <button
                                        onClick={() => handleSave('s3')}
                                        className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all"
                                    >
                                        Save S3 Settings
                                    </button>
                                    <button
                                        onClick={() => handleCancel('s3')}
                                        className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center p-8 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold font-display">Sync & Migrate</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-2">Apply current cloud settings and optionally migrate local media.</p>
                            </div>
                            <div className="flex gap-4 relative z-10">
                                <button
                                    onClick={async () => {
                                        const hasConfig = (settings.cloudinary_cloud_name && settings.cloudinary_api_key) || (settings.s3_access_key && settings.s3_bucket);
                                        if (!hasConfig) {
                                            showToast('Please configure at least one cloud provider.', 'error');
                                            return;
                                        }
                                        if (!confirm('This will upload all local media to your configured cloud provider and delete local files. Continue?')) return;

                                        showToast('Migration in progress...', 'info');
                                        try {
                                            const res = await apiRequest('/media/migrate', { method: 'POST' });
                                            showToast(`Migration complete! ${res.migrated}/${res.total} files migrated. ${res.errors.length > 0 ? `Errors: ${res.errors.length}` : ''}`, 'success');
                                        } catch (error: any) {
                                            showToast(error.message || 'Migration failed.', 'error');
                                        }
                                    }}
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10 backdrop-blur-md"
                                >
                                    Migrate Local Assets
                                </button>
                                <button onClick={() => handleSave('media')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all leading-none">
                                    Update Cloud Settings
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === 'audit-logs' && (
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 font-display">System Ledger</h3>
                                <p className="text-sm font-medium text-slate-400 mt-1">Authorized overview of all administrative and user activity.</p>
                            </div>
                            <button onClick={fetchGlobalLogs} className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 active:scale-95 transition-all">
                                <ArrowPathIcon className={classNames("h-4 w-4", isLogsLoading && "animate-spin")} />
                                Refresh Database
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="pl-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technician</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operation</th>
                                        <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata</th>
                                        <th className="pr-10 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLogsLoading && (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-10 py-8"><div className="h-6 bg-slate-50 rounded-xl" /></td>
                                            </tr>
                                        ))
                                    )}
                                    {!isLogsLoading && globalLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <NoSymbolIcon className="h-16 w-16 text-slate-100 mx-auto mb-4" />
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No operations recorded yet</p>
                                            </td>
                                        </tr>
                                    )}
                                    {globalLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="pl-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200 uppercase">
                                                        {log.user?.name?.[0] || log.user?.email?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">{log.user?.name || 'Unknown'}</p>
                                                        <p className="text-[10px] font-semibold text-slate-400">{log.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={classNames(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset",
                                                    log.action.includes('SUCCESS') ? "bg-emerald-50 text-emerald-600 ring-emerald-600/20" :
                                                        log.action.includes('FAILURE') ? "bg-red-50 text-red-600 ring-red-600/20" :
                                                            "bg-blue-50 text-blue-600 ring-blue-600/20"
                                                )}>
                                                    <FingerPrintIcon className="h-3 w-3" />
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[200px]" title={JSON.stringify(log.metadata)}>
                                                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                                                </p>
                                            </td>
                                            <td className="pr-10 py-6 text-right font-display italic">
                                                <p className="text-[11px] font-bold text-slate-900">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                                <p className="text-[10px] font-semibold text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Logs Pagination */}
                        <div className="p-8 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900">{logsPagination.skip + 1}</span> to <span className="text-slate-900">{Math.min(logsPagination.skip + logsPagination.take, logsTotal)}</span> of <span className="text-slate-900">{logsTotal}</span> entries
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={logsPagination.skip === 0}
                                    onClick={() => setLogsPagination(p => ({ ...p, skip: Math.max(0, p.skip - p.take) }))}
                                    className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all font-bold text-[10px] uppercase tracking-widest px-6"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={logsPagination.skip + logsPagination.take >= logsTotal}
                                    onClick={() => setLogsPagination(p => ({ ...p, skip: p.skip + p.take }))}
                                    className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 disabled:opacity-30 transition-all font-bold text-[10px] uppercase tracking-widest px-6 shadow-xl shadow-slate-900/10"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-200/60 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                        <RocketLaunchIcon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 font-display">Optimization</h3>
                                </div>
                                {!isSectionEditing('performance', ['performance_edge_caching']) && (
                                    <button
                                        onClick={() => toggleEdit('performance')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Edit Config
                                    </button>
                                )}
                            </div>

                            <label className={`p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex items-center justify-between group transition-all cursor-pointer ${isSectionEditing('performance', ['performance_edge_caching']) ? 'hover:bg-white hover:border-blue-200' : 'opacity-80'}`}>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Global Edge Caching</p>
                                    <p className="text-[11px] font-bold text-slate-400 mt-1">Accelerate content delivery via global CDN nodes.</p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        disabled={!isSectionEditing('performance', ['performance_edge_caching'])}
                                        checked={settings.performance_edge_caching === 'true'}
                                        onChange={(e) => setSettings({ ...settings, performance_edge_caching: String(e.target.checked) })}
                                    />
                                    <div className="h-8 w-14 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>

                            {isSectionEditing('performance', ['performance_edge_caching']) && editModes['performance'] && (
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => handleSave('performance')}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => handleCancel('performance')}
                                        className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <ClearThemeCacheCard />
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-200/60 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 text-white">
                                        <ShieldCheckIcon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 font-display">Access Protocols</h3>
                                </div>
                                {!isSectionEditing('security', ['security_session_locking', 'security_failed_login_limit', 'security_token_rotation']) && (
                                    <button
                                        onClick={() => toggleEdit('security')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Edit Protocols
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'security_session_locking', title: 'Session Locking', desc: 'Secure sessions automatically after 24h idle.' },
                                    { key: 'security_failed_login_limit', title: 'Failed Login Limit', desc: 'Auto-lock accounts after 5 failed attempts.' },
                                    { key: 'security_token_rotation', title: 'Secure Token Rotation', desc: 'Rotate JWT signing keys every 30 days.' }
                                ].map(item => (
                                    <label key={item.key} className={`flex items-center justify-between p-6 bg-slate-50/30 rounded-[2rem] border border-slate-100 transition-all cursor-pointer ${isSectionEditing('security', ['security_session_locking', 'security_failed_login_limit', 'security_token_rotation']) ? 'hover:bg-white' : 'opacity-90'}`}>
                                        <div className="flex gap-4">
                                            <div className={classNames("mt-1 ring-2 ring-inset p-1.5 rounded-lg h-fit transition-colors", settings[item.key] === 'true' ? "ring-emerald-500/10 bg-emerald-50 text-emerald-600" : "ring-slate-200 bg-slate-50 text-slate-300")}>
                                                {settings[item.key] === 'true' ? <CheckBadgeIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                                <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={classNames("text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-colors", settings[item.key] === 'true' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                                                {settings[item.key] === 'true' ? "Active" : "Disabled"}
                                            </span>
                                            {isSectionEditing('security', ['security_session_locking', 'security_failed_login_limit', 'security_token_rotation']) && (
                                                <input
                                                    type="checkbox"
                                                    checked={settings[item.key] === 'true'}
                                                    onChange={(e) => setSettings({ ...settings, [item.key]: String(e.target.checked) })}
                                                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {isSectionEditing('security', ['security_session_locking', 'security_failed_login_limit', 'security_token_rotation']) && editModes['security'] && (
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => handleSave('security')}
                                        className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => handleCancel('security')}
                                        className="bg-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-amber-50 rounded-[3rem] p-10 border border-amber-200/50 flex flex-col justify-center space-y-6">
                            <div className="h-16 w-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20">
                                <ExclamationTriangleIcon className="h-10 w-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <Alert
                                    type="warning"
                                    className="bg-transparent border-none p-0 text-amber-900"
                                    message="System Hazard Alert: Global IP restriction is NOT active. Ensure that all standard technicians have verified IP addresses to prevent brute-force external intrusion."
                                />
                            </div>
                            <button className="bg-amber-900 text-white px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-amber-900/10 hover:bg-amber-800 transition-all">
                                Review Security Logs
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, section: null })}
                onConfirm={confirmCancel}
                title="Discard Changes?"
                message="Are you sure you want to discard your unsaved configurations? This action will revert all pending edits to their previous state."
                confirmText="Discard Changes"
                cancelText="Keep Editing"
                variant="danger"
            />
        </div>
    );
}
