'use client';

import {
    DocumentIcon,
    UserIcon,
    PhotoIcon,
    PlusIcon,
    BoltIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
    ClockIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { usePermissions } from '@/context/PermissionsContext';
import { getVisibleStats, checkPermission } from '@/lib/permissions';
import CreateContentModal from '@/components/dashboard/CreateContentModal';
import DashboardLoading from './loading';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface ActivityLog {
    id: string;
    action: string;
    userId: string;
    user: { name: string; email: string; role: { name: string }; };
    metadata: any;
    createdAt: string;
}

const humanizeAction = (action: string, metadata: any) => {
    const actionMap: Record<string, string> = {
        'LOGIN_SUCCESS': 'logged in successfully',
        'LOGIN_FAILED': 'failed to log in',
        'USER_DEACTIVATE': 'deactivated',
        'USER_REACTIVATE': 'reactivated',
        'USER_UPDATE': 'updated user profile',
        'ROLE_CREATE': 'created a new security role',
        'ROLE_UPDATE': 'modified a security role',
        'ROLE_DELETE': 'deleted a security role',
        'CONTENT_CREATE': 'published new content',
        'CONTENT_UPDATE': 'updated existing content',
        'MEDIA_UPLOAD': 'uploaded a new file',
        'SETTINGS_UPDATE': 'modified site configurations'
    };

    let desc = actionMap[action] || `performed ${action.toLowerCase().replace(/_/g, ' ')}`;

    // Add target user name for user management actions
    if (action === 'USER_DEACTIVATE' || action === 'USER_REACTIVATE') {
        if (metadata?.targetUserName) {
            desc += ` ${metadata.targetUserName}`;
        } else {
            desc += ' a user';
        }
    }

    return desc;
};

const AuditDetailModal = ({ onClose, log }: { isOpen: boolean, onClose: () => void, log: ActivityLog | null }) => {
    if (!log) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <InformationCircleIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Audit Details</p>
                                <h3 className="text-xl font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Performed By</p>
                                <p className="text-sm font-bold text-slate-900">{log.user.name}</p>
                                <p className="text-[10px] font-medium text-slate-500">{log.user.role.name}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Timestamp</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(log.createdAt).toLocaleDateString()}</p>
                                <p className="text-[10px] font-medium text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Metadata / Payloads</p>
                            <div className="bg-slate-900 rounded-3xl p-6 overflow-x-auto">
                                <pre className="text-[11px] font-mono text-blue-400 leading-relaxed">
                                    {JSON.stringify(log.metadata, null, 4)}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const initialStats = [
    { name: 'Total Blogs', value: '...', change: '0%', icon: DocumentIcon, color: 'text-blue-600', glow: 'group-hover:bg-blue-500/20', iconBg: 'bg-blue-100', bg: 'bg-blue-50/50', border: 'border-blue-200/50' },
    { name: 'Active Users', value: '...', change: '0%', icon: UserIcon, color: 'text-emerald-600', glow: 'group-hover:bg-emerald-500/20', iconBg: 'bg-emerald-100', bg: 'bg-emerald-50/50', border: 'border-emerald-200/50' },
    { name: 'Media files', value: '...', change: '0%', icon: PhotoIcon, color: 'text-indigo-600', glow: 'group-hover:bg-indigo-500/20', iconBg: 'bg-indigo-100', bg: 'bg-indigo-50/50', border: 'border-indigo-200/50' },
    { name: 'Cloud Server', value: 'Online', change: '99.9%', icon: BoltIcon, color: 'text-violet-600', glow: 'group-hover:bg-violet-500/20', iconBg: 'bg-violet-100', bg: 'bg-violet-50/50', border: 'border-violet-200/50' },
];

export default function DashboardPage() {
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState(initialStats);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const { showToast } = useNotification();
    const { permissions, isLoading: permissionsLoading } = usePermissions();

    useEffect(() => {
        if (!permissionsLoading && permissions) {
            fetchData();
        }
    }, [permissions, permissionsLoading]);

    const fetchData = async () => {
        setDataLoading(true);
        try {
            const canViewAudit = checkPermission(permissions, 'audit_view');
            const canViewAnalytics = checkPermission(permissions, 'analytics_view');

            const [logs, mediaCount, userStats, blogsCount, analytics] = await Promise.all([
                // Show global audit logs for Admins, personal logs for others
                canViewAudit
                    ? apiRequest('/audit-logs?limit=5')
                    : apiRequest('/users/profile/logs').then(res => res.slice(0, 5)),
                apiRequest('/media').then(res => Array.isArray(res) ? res.length : 0).catch(() => 0),
                apiRequest('/users/stats').catch(() => ({ total: 0, active: 0, recent: 0, pending: 0 })),
                apiRequest('/blogs').then(res => Array.isArray(res) ? res.length : 0).catch(() => 0),
                // Only fetch analytics if permitted
                canViewAnalytics
                    ? apiRequest('/analytics/dashboard').catch(() => null)
                    : Promise.resolve(null)
            ]);

            setActivity(logs);

            const newStats = [
                { ...initialStats[0], value: (blogsCount || 0).toString() },
                { ...initialStats[1], value: (userStats?.active || 0).toString() },
                { ...initialStats[2], value: (mediaCount || 0).toString() },
                {
                    ...initialStats[3],
                    name: 'Page Views',
                    value: analytics?.pageViews?.today?.toString() || '0',
                    change: analytics?.pageViews?.change ? `${analytics.pageViews.change}%` : '0%',
                    icon: BoltIcon
                }
            ];

            // Filter stats based on permissions
            setStats(getVisibleStats(newStats, permissions));
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setDataLoading(false);
        }
    };

    if (permissionsLoading || dataLoading) return <DashboardLoading />;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                        Dashboard <span className="text-blue-600 font-bold">Overview</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">System metrics and recent activity for your project.</p>
                </div>
                <div className="flex items-center gap-3">
                    {checkPermission(permissions, 'analytics_view') && (
                        <Link
                            href="/dashboard/analytics"
                            className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 text-slate-900 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center"
                        >
                            Report
                        </Link>
                    )}
                    {checkPermission(permissions, 'content_create') && (
                        <Link
                            href="/dashboard/projects?action=new"
                            className="px-6 py-2.5 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 flex items-center justify-center"
                        >
                            New Project
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-2">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className={classNames(
                            stat.bg,
                            stat.border,
                            "relative group overflow-hidden rounded-[2.5rem] p-8 border backdrop-blur-md hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 ease-out cursor-default"
                        )}
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className={classNames(stat.color, stat.iconBg, "p-3 rounded-2xl shadow-sm ring-1 ring-black/5 group-hover:rotate-6 transition-transform duration-500")}>
                                <stat.icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${stat.change.includes('+') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'} border border-black/5 group-hover:scale-110 transition-transform duration-500`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="mt-8 relative z-10">
                            <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.name}</dt>
                            <dd className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight group-hover:translate-x-1 transition-transform duration-500">
                                {stat.value}
                            </dd>
                        </div>
                        <div className={classNames(
                            "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700",
                            stat.glow
                        )}></div>
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/20 rounded-full transition-colors duration-500"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 px-2">
                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            {checkPermission(permissions, 'audit_view') ? 'Recent Activity' : 'My Recent Activity'}
                        </h2>
                        <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">Details</button>
                    </div>
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 shadow-2xl shadow-slate-200/40 p-2">
                        {activity.map((item, idx) => (
                            <div key={item.id} className={classNames(
                                "group p-6 flex items-center justify-between rounded-[2rem] transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/30",
                                idx !== activity.length - 1 ? "mb-1" : ""
                            )}>
                                <div className="flex items-center gap-6">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner ring-1 ring-black/5">
                                        {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-slate-900 leading-tight">
                                            {item.user?.name || 'Unknown User'} <span className="text-slate-400 font-medium font-sans lowercase"> {humanizeAction(item.action, item.metadata)}</span>
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <ClockIcon className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(item.createdAt))} ago
                                            </p>
                                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                                ID: {item.id.split('-')[0]}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(item)}
                                    className="p-3 rounded-xl bg-slate-100/50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all active:scale-90 ring-1 ring-black/5"
                                    title="View Full Metadata"
                                >
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <AuditDetailModal
                        isOpen={!!selectedLog}
                        onClose={() => setSelectedLog(null)}
                        log={selectedLog}
                    />

                    <CreateContentModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setCreateModalOpen(false)}
                    />
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight px-4">Quick Actions</h2>
                    <div className="space-y-5">
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="group relative w-full overflow-hidden flex items-center justify-between p-7 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
                        >
                            <span className="flex items-center gap-4 font-bold uppercase tracking-widest text-xs relative z-10 font-display">
                                <div className="p-3 bg-white/10 rounded-2xl ring-1 ring-white/20 group-hover:bg-blue-600 transition-all duration-500">
                                    <PlusIcon className="h-5 w-5" />
                                </div>
                                Create Content
                            </span>
                            <ChevronRightIcon className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/40 transition-colors"></div>
                        </button>

                        <Link href="/dashboard/media" className="group w-full flex items-center justify-between p-7 rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-slate-200/30 text-slate-900 hover:border-blue-600/30 hover:text-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500">
                            <span className="flex items-center gap-4 font-bold uppercase tracking-widest text-xs text-slate-500 group-hover:text-blue-600 transition-all duration-500 font-display">
                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                                    <PhotoIcon className="h-5 w-5" />
                                </div>
                                Media Library
                            </span>
                            <ChevronRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <div className="relative overflow-hidden p-9 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-600/40 group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/30 transition-transform group-hover:rotate-6">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                </div>
                                <p className="text-lg font-bold tracking-tight leading-none uppercase">Security</p>
                            </div>
                            <p className="mt-4 text-sm text-blue-50 font-semibold leading-relaxed relative z-10">Backup was <span className="text-white underline underline-offset-4 decoration-2">14 days ago</span>.</p>
                            <Link href="/dashboard/settings" className="mt-8 block w-full bg-white text-blue-700 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all relative z-10 text-center">
                                Sync Database
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
    )
}
