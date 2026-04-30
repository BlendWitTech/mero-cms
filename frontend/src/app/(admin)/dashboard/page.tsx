'use client';

import {
    FileText,
    Users,
    FolderOpen,
    BarChart2,
    Plus,
    Zap,
    Info,
    X,
    Clock,
    Eye,
    TrendingUp,
    TrendingDown,
    Shield,
    ArrowRight,
    Activity,
    ChevronRight,
    Image,
    Settings,
    LayoutDashboard,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { usePermissions } from '@/context/PermissionsContext';
import { getVisibleStats, checkPermission } from '@/lib/permissions';
import CreateContentModal from '@/components/dashboard/CreateContentModal';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardLoading from './loading';

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface ActivityLog {
    id: string;
    action: string;
    userId: string;
    user: { name: string; email: string; role: { name: string } };
    metadata: any;
    createdAt: string;
}

const ACTION_MAP: Record<string, string> = {
    LOGIN_SUCCESS: 'logged in successfully',
    LOGIN_FAILED: 'failed login attempt',
    USER_DEACTIVATE: 'deactivated a user',
    USER_REACTIVATE: 'reactivated a user',
    USER_UPDATE: 'updated user profile',
    ROLE_CREATE: 'created a new role',
    ROLE_UPDATE: 'modified a role',
    ROLE_DELETE: 'deleted a role',
    CONTENT_CREATE: 'published new content',
    CONTENT_UPDATE: 'updated existing content',
    MEDIA_UPLOAD: 'uploaded a media file',
    SETTINGS_UPDATE: 'changed site settings',
};

const ACTION_BADGE: Record<string, { bg: string; dot: string }> = {
    LOGIN_SUCCESS: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    LOGIN_FAILED: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    CONTENT_CREATE: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    CONTENT_UPDATE: { bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
    MEDIA_UPLOAD: { bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
    SETTINGS_UPDATE: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    ROLE_CREATE: { bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
    ROLE_UPDATE: { bg: 'bg-indigo-400/10 text-indigo-500 dark:text-indigo-400', dot: 'bg-indigo-400' },
    ROLE_DELETE: { bg: 'bg-red-400/10 text-red-500 dark:text-red-400', dot: 'bg-red-400' },
    USER_DEACTIVATE: { bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
    USER_REACTIVATE: { bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
    USER_UPDATE: { bg: 'bg-slate-400/10 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
};

const humanizeAction = (action: string, metadata: any) => {
    let desc = ACTION_MAP[action] || `performed ${action.toLowerCase().replace(/_/g, ' ')}`;
    if ((action === 'USER_DEACTIVATE' || action === 'USER_REACTIVATE') && metadata?.targetUserName) {
        desc = `${action === 'USER_DEACTIVATE' ? 'deactivated' : 'reactivated'} ${metadata.targetUserName}`;
    }
    return desc;
};

/* ─── Audit Detail Modal ──────────────────────────────── */
const AuditDetailModal = ({
    onClose,
    log,
}: {
    isOpen: boolean;
    onClose: () => void;
    log: ActivityLog | null;
}) => {
    if (!log) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Audit Event</p>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                    {log.action.replace(/_/g, ' ')}
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Performed By</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{log.user.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{log.user.role.name}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                                {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Metadata</p>
                        <div className="bg-slate-50 dark:bg-black/30 rounded-2xl p-4 border border-slate-100 dark:border-white/[0.06] overflow-x-auto">
                            <pre className="text-[11px] font-mono text-blue-600 dark:text-blue-400 leading-relaxed">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-outline w-full mt-6"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Stat config ─────────────────────────────────────── */
const STAT_CONFIG = [
    {
        name: 'Total Blogs',
        subtitle: 'Published posts',
        icon: FileText,
        gradient: 'from-blue-500 to-indigo-600',
        shadow: 'shadow-blue-500/30',
        ring: 'ring-blue-100 dark:ring-blue-500/20',
        trendUp: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
        trendDown: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
    },
    {
        name: 'Active Users',
        subtitle: 'Registered accounts',
        icon: Users,
        gradient: 'from-violet-500 to-purple-600',
        shadow: 'shadow-violet-500/30',
        ring: 'ring-violet-100 dark:ring-violet-500/20',
        trendUp: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
        trendDown: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
    },
    {
        name: 'Media Files',
        subtitle: 'In your library',
        icon: FolderOpen,
        gradient: 'from-sky-500 to-cyan-600',
        shadow: 'shadow-sky-500/30',
        ring: 'ring-sky-100 dark:ring-sky-500/20',
        trendUp: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
        trendDown: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
    },
    {
        name: 'Page Views',
        subtitle: "Today's traffic",
        icon: BarChart2,
        gradient: 'from-emerald-500 to-teal-600',
        shadow: 'shadow-emerald-500/30',
        ring: 'ring-emerald-100 dark:ring-emerald-500/20',
        trendUp: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
        trendDown: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
    },
];

const initialStats = STAT_CONFIG.map((s) => ({
    ...s,
    value: '—',
    change: '0%',
    border: '',
    bg: '',
    color: '',
}));

function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ─── Main Page ───────────────────────────────────────── */
export default function DashboardPage() {
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState(initialStats);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const { showToast } = useNotification();
    const { permissions, isLoading: permissionsLoading } = usePermissions();

    useEffect(() => {
        if (!permissionsLoading && permissions) fetchData();
    }, [permissions, permissionsLoading]);

    const fetchData = async () => {
        setDataLoading(true);
        try {
            const canViewAudit = checkPermission(permissions, 'audit_view');
            const canViewAnalytics = checkPermission(permissions, 'analytics_view');

            const [logs, mediaCount, userStats, blogsCount, analytics] = await Promise.all([
                canViewAudit
                    ? apiRequest('/audit-logs?limit=6')
                    : apiRequest('/users/profile/logs').then((r: any) => r.slice(0, 6)),
                apiRequest('/media')
                    .then((r: any) => (Array.isArray(r) ? r.length : 0))
                    .catch(() => 0),
                apiRequest('/users/stats').catch(() => ({ total: 0, active: 0 })),
                apiRequest('/blogs')
                    .then((r: any) => (Array.isArray(r) ? r.length : 0))
                    .catch(() => 0),
                canViewAnalytics
                    ? apiRequest('/analytics/dashboard').catch(() => null)
                    : null,
            ]);

            setActivity(logs);

            const updated = [
                { ...initialStats[0], value: String(blogsCount || 0), change: '+0%' },
                { ...initialStats[1], value: String(userStats?.active || 0), change: '+0%' },
                { ...initialStats[2], value: String(mediaCount || 0), change: '+0%' },
                {
                    ...initialStats[3],
                    value: analytics?.pageViews?.today?.toString() || '0',
                    change: analytics?.pageViews?.change
                        ? `${analytics.pageViews.change > 0 ? '+' : ''}${analytics.pageViews.change}%`
                        : '+0%',
                },
            ];
            setStats(getVisibleStats(updated, permissions));
        } catch {
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setDataLoading(false);
        }
    };

    if (permissionsLoading || dataLoading) return <DashboardLoading />;

    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">

            {/* ══════════════════════════════════
                WELCOME BANNER
            ══════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-white/[0.07] px-8 py-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{getGreeting()} · {dateStr}</p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 font-medium">
                            Here's what's happening with your CMS today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {checkPermission(permissions, 'analytics_view') && (
                            <Link
                                href="/dashboard/analytics"
                                className="btn-outline"
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Analytics
                            </Link>
                        )}
                        {checkPermission(permissions, 'content_create') && (
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="btn-primary"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                New Post
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════
                ANALYTICS — KPI strip + tier-gated charts.
                Single source of truth for dashboard stats. The component
                gates its own content: KPIs (pages/posts/leads/storage)
                render for all tiers; leads-over-time + content velocity
                charts unlock at Premium; top pages at Pro / Enterprise.
                Basic users see a soft upsell instead of empty chart
                panels. Replaces the previous duplicate stat-cards block.
            ══════════════════════════════════ */}
            <DashboardAnalytics />

            {/* ══════════════════════════════════
                MIDDLE GRID (Quick Actions, Security, Plan Usage)
            ══════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
                {/* Quick Actions card */}
                <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.07] overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 dark:border-white/[0.05]">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Quick Actions</h2>
                        <p className="text-[10px] text-slate-400 mt-0.5">Common tasks at a glance</p>
                    </div>
                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-center">
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="group w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            <span className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/[0.1] flex items-center justify-center shrink-0">
                                <Plus className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                            </span>
                            <span className="flex-1 text-left text-xs font-black uppercase tracking-widest">Create Content</span>
                            <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <Link
                            href="/dashboard/media"
                            className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            <span className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                                <Image className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            </span>
                            <span className="flex-1 text-xs font-black uppercase tracking-widest">Media Library</span>
                            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        
                        <Link
                            href="/dashboard/site-pages"
                            className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            <span className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                                <LayoutDashboard className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </span>
                            <span className="flex-1 text-xs font-black uppercase tracking-widest">Site Pages</span>
                            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                            href="/dashboard/settings"
                            className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            <span className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </span>
                            <span className="flex-1 text-xs font-black uppercase tracking-widest">Settings</span>
                            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    </div>
                </div>

                {/* Security widget */}
                <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.07] overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-50 dark:border-white/[0.05] flex justify-between items-center">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Security Status</h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">System protection overview</p>
                        </div>
                        <span className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </span>
                    </div>
                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">System Health</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Optimal</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Last Backup</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">14 Days Ago</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Sessions</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">1 Session</span>
                        </div>
                    </div>
                    <div className="px-4 py-3 border-t border-slate-50 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02]">
                        <Link
                            href="/dashboard/settings"
                            className="flex items-center justify-center gap-2 w-full text-[10px] font-black text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Manage Settings <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* Plan Usage */}
                <PlanUsageWidget />
            </div>

            {/* ══════════════════════════════════
                LOWER GRID
            ══════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* ── Activity Feed (2 cols) ── */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-white/[0.07] shadow-sm overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 dark:border-white/[0.05]">
                            <div className="flex items-center gap-2.5">
                                <span className="h-8 w-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                                        {checkPermission(permissions, 'audit_view') ? 'Recent Activity' : 'My Activity'}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Latest system events</p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/audit-log"
                                className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase tracking-widest transition-colors"
                            >
                                View All <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {/* Activity list */}
                        {activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recent activity</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                {activity.map((item) => {
                                    const badge = ACTION_BADGE[item.action] || ACTION_BADGE['USER_UPDATE'];
                                    return (
                                        <div
                                            key={item.id}
                                            className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.025] transition-colors"
                                        >
                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-sm font-black text-white shadow">
                                                    {item.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                                                </div>
                                                <span className={cn(
                                                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900',
                                                    badge.dot
                                                )} />
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
                                                    <span className="font-black">{item.user?.name ?? 'Unknown'}</span>
                                                    {' '}
                                                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                                                        {humanizeAction(item.action, item.metadata)}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                        {formatDistanceToNow(new Date(item.createdAt))} ago
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                    <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded', badge.bg)}>
                                                        {item.action.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* View button */}
                                            <button
                                                onClick={() => setSelectedLog(item)}
                                                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                                title="View Details"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Panel (1 col) ── */}
                <div className="flex flex-col gap-5">
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center opacity-60">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Future Module</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">This space is reserved for an upcoming feature.</p>
                    </div>
                </div>
            </div>

            {/* Modals */}
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
    );
}

/* ─── Plan Usage Widget ───────────────────────────────── */
function PlanUsageWidget() {
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest('/packages/usage')
            .then(setUsage)
            .finally(() => setLoading(false));
    }, []);

    if (loading || !usage)
        return (
            <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-white/[0.07] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded-full" />
                        <div className="h-2 w-14 bg-slate-50 dark:bg-white/5 rounded-full" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-7 rounded-lg bg-slate-50 dark:bg-white/5" />
                    <div className="h-7 rounded-lg bg-slate-50 dark:bg-white/5" />
                </div>
            </div>
        );

    const storagePercent = Math.min(100, (usage.usage.storageGB / usage.limits.storageGB) * 100);
    const teamPercent = Math.min(100, (usage.usage.teamMembers / usage.limits.teamMembers) * 100);

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Active Plan</p>
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">
                        {usage.package.name}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Storage */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Storage</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                            {usage.usage.storageGB}
                            <span className="text-slate-400"> / {usage.limits.storageGB} GB</span>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${storagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${storagePercent}%` }}
                        />
                    </div>
                </div>

                {/* Team */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Team Seats</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                            {usage.usage.teamMembers}
                            <span className="text-slate-400"> / {usage.limits.teamMembers}</span>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${teamPercent > 90 ? 'bg-orange-500' : 'bg-violet-500'}`}
                            style={{ width: `${teamPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-50 dark:border-white/[0.05]">
                <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                    usage.limits.hasWhiteLabel
                        ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/5 text-slate-400 opacity-50'
                }`}>
                    <Shield className="h-3 w-3 shrink-0" />
                    White-label
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                    usage.limits.hasApiAccess
                        ? 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 text-blue-700 dark:text-blue-400'
                        : 'border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/5 text-slate-400 opacity-50'
                }`}>
                    <Zap className="h-3 w-3 shrink-0" />
                    API Access
                </div>
            </div>

            <Link
                href="/pricing"
                className="btn-outline w-full mt-4 text-[10px]"
            >
                Upgrade Plan
            </Link>
        </div>
    );
}
