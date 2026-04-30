'use client';

import React, { useState, useEffect } from 'react';
import {
    UserCircleIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    CameraIcon,
    KeyIcon,
    BellIcon,
    FingerPrintIcon,
    Cog6ToothIcon,
    ChevronRightIcon,
    CalendarIcon,
    IdentificationIcon,
    LockClosedIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    EyeIcon,
    XMarkIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import Alert from '@/components/ui/Alert';
import { formatDistanceToNow } from 'date-fns';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const humanizeAction = (action: string, metadata: any) => {
    const actionMap: Record<string, string> = {
        'LOGIN_SUCCESS': 'successfully logged into your account',
        'LOGIN_FAILED': 'attempted to log in but failed',
        'USER_UPDATE_PROFILE': 'updated your profile information',
        'PASSWORD_CHANGE': 'changed your account password',
        'TWO_FACTOR_ENABLED': 'enabled two-factor authentication',
        'TWO_FACTOR_DISABLED': 'disabled two-factor authentication',
        'SESSION_REVOKED': 'revoked an active session',
        'EMAIL_CHANGED': 'changed your email address',
        'ROLE_CHANGED': 'had their role modified by an administrator'
    };

    let desc = actionMap[action] || action.toLowerCase().replace(/_/g, ' ');

    // Add IP context if available
    if (metadata?.ip && metadata.ip !== 'unknown') {
        desc += ` from IP ${metadata.ip}`;
    }

    return desc;
};

const AuditDetailModal = ({ isOpen, onClose, log }: { isOpen: boolean, onClose: () => void, log: any | null }) => {
    if (!log) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 transition-all">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <InformationCircleIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Security Event</p>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                You {humanizeAction(log.action, log.metadata)}.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Timestamp</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(log.createdAt).toLocaleDateString()}</p>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                                <p className={`text-sm font-bold ${log.status === 'DANGER' ? 'text-red-600' :
                                    log.status === 'WARNING' ? 'text-amber-600' :
                                        'text-emerald-600'
                                    }`}>{log.status}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Event Metadata</p>
                            <div className="bg-slate-50 dark:bg-black/40 rounded-3xl p-6 overflow-x-auto border border-slate-100 dark:border-white/[0.06]">
                                <pre className="text-[11px] font-mono text-blue-600 dark:text-blue-400 leading-relaxed">
                                    {JSON.stringify(log.metadata, null, 4)}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        email: '',
        preferences: {
            timezone: 'UTC+0',
            language: 'English',
            notifications: true
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [userData, logsData] = await Promise.all([
                    apiRequest('/auth/profile'),
                    apiRequest('/users/profile/logs')
                ]);

                setUser(userData);
                setLogs(Array.isArray(logsData) ? logsData : []);
                setFormData({
                    name: userData.name || '',
                    bio: userData.bio || '',
                    email: userData.email || '',
                    preferences: userData.preferences || {
                        timezone: 'UTC+0',
                        language: 'English',
                        notifications: true
                    }
                });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleEnable2FA = async () => {
        try {
            const data = await apiRequest('/auth/2fa/generate');
            setQrCodeUrl(data.qrCode);
            setIs2FAModalOpen(true);
        } catch (error) {
            console.error('Failed to generate 2FA', error);
        }
    };

    const handleVerify2FA = async () => {
        try {
            const data = await apiRequest('/auth/2fa/enable', {
                method: 'POST',
                body: { token: twoFactorToken }
            });
            if (data.success) {
                setIs2FAModalOpen(false);
                setUser({ ...user, twoFactorEnabled: true });
            } else {
                console.error('2FA enable failed:', data.message);
            }
        } catch (error) {
            console.error('Failed to enable 2FA', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/users/profile', {
                method: 'PATCH',
                body: formData,
            });
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const getLogIcon = (status: string, action: string) => {
        if (status === 'DANGER') return ExclamationTriangleIcon;
        if (status === 'WARNING') return LockClosedIcon;
        if (action === 'LOGIN_SUCCESS') return FingerPrintIcon;
        return InformationCircleIcon;
    };

    const getLogStyles = (status: string) => {
        switch (status) {
            case 'DANGER': return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-red-100 dark:ring-red-500/20';
            case 'WARNING': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-100 dark:ring-amber-500/20';
            default: return 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 ring-slate-100 dark:ring-white/10';
        }
    };

    if (isLoading) return <div className="space-y-4"><div className="content-skeleton h-64 rounded-[2rem]" /><div className="content-skeleton h-96 rounded-[2rem]" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* 2FA Modal */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 scale-in-center border border-slate-200 dark:border-white/10">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Scan QR Code</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Use Google Authenticator to scan this code.</p>
                        </div>
                        <div className="flex justify-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                            {qrCodeUrl && <img src={qrCodeUrl} alt="2FA" className="h-40 w-40 object-contain" />}
                        </div>
                        <input
                            type="text"
                            placeholder="000 000"
                            value={twoFactorToken}
                            onChange={(e) => setTwoFactorToken(e.target.value)}
                            className="w-full text-center text-xl font-mono py-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIs2FAModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleVerify2FA} className="flex-1 py-3 text-sm font-semibold border border-blue-600/60 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-transparent rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors">Verify</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/[0.06] overflow-hidden relative shadow-sm dark:shadow-none">
                {/* Cover Gradient */}
                <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                </div>

                <div className="px-10 pb-10 flex flex-col lg:flex-row items-end lg:items-center gap-8 -mt-16 relative z-10">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="h-32 w-32 rounded-[2rem] bg-white p-1.5 shadow-xl ring-1 ring-slate-100 rotate-3 transition-transform group-hover:rotate-0 duration-300">
                            <div className="h-full w-full rounded-[1.7rem] bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400 overflow-hidden">
                                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : formData.name.charAt(0)}
                            </div>
                        </div>
                        <button className="absolute bottom-0 right-0 p-2.5 border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl shadow-lg hover:scale-110 transition-transform">
                            <CameraIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 mb-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{formData.name}</h1>
                            {user?.twoFactorEnabled && <ShieldCheckIcon className="h-6 w-6 text-emerald-500" title="2FA Enabled" />}
                        </div>
                        <p className="text-slate-500 font-medium">{formData.email}</p>
                    </div>

                    <div className="flex gap-3 mb-2">
                        {!user?.twoFactorEnabled && (
                            <button
                                onClick={handleEnable2FA}
                                className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                            >
                                <ShieldCheckIcon className="h-4 w-4" />
                                Enable 2FA
                            </button>
                        )}
                        <span className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2">
                            <IdentificationIcon className="h-4 w-4" />
                            {user?.role?.name || 'Member'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Nav */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'general', label: 'General Profile', icon: UserCircleIcon },
                        { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
                        { id: 'activity', label: 'Audit Logs', icon: LockClosedIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={classNames(
                                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-sm font-bold border",
                                activeTab === tab.id
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 dark:shadow-none border-transparent"
                                    : "bg-white dark:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border-slate-100 dark:border-white/[0.06]"
                            )}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'general' && (
                        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-500 rounded-2xl p-4 text-sm font-bold cursor-not-allowed"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Bio</label>
                                    <textarea
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                                <button onClick={handleUpdate} className="border border-blue-600/60 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-transparent px-8 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors active:scale-95">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-4">Application Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Timezone</label>
                                        <select
                                            value={formData.preferences.timezone}
                                            onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, timezone: e.target.value } })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none"
                                        >
                                            <option>UTC+0 (London)</option>
                                            <option>UTC+5:30 (Mumbai)</option>
                                            <option>UTC-8 (Pacific)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Language</label>
                                        <select
                                            value={formData.preferences.language}
                                            onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, language: e.target.value } })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none"
                                        >
                                            <option>English</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                                <button onClick={handleUpdate} className="border border-slate-600/40 dark:border-white/20 text-slate-700 dark:text-slate-200 bg-transparent px-8 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">
                                    Update Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Audit Log</h3>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{logs.length} Events</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[600px] overflow-y-auto">
                                {logs.length === 0 ? (
                                    <div className="p-20 text-center text-slate-400">
                                        <FingerPrintIcon className="h-12 w-12 mx-auto opacity-20 mb-4" />
                                        <p className="font-medium">No activity recorded yet.</p>
                                    </div>
                                ) : (
                                    logs.map((log) => {
                                        const Icon = getLogIcon(log.status, log.action);
                                        const style = getLogStyles(log.status);

                                        return (
                                            <div key={log.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ring-1 ${style}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg ring-1 ring-slate-100 dark:ring-white/5">
                                                            {formatDistanceToNow(new Date(log.createdAt))} ago
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                                        You {humanizeAction(log.action, log.metadata)}.
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {log.status === 'DANGER' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                                ID: {log.id.split('-')[0]}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                                                        >
                                                            <EyeIcon className="h-3.5 w-3.5" />
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <AuditDetailModal
                                isOpen={!!selectedLog}
                                onClose={() => setSelectedLog(null)}
                                log={selectedLog}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
