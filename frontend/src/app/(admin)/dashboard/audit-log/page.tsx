'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardDocumentListIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ShieldExclamationIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';

interface LogEntry {
    id: string;
    action: string;
    status: 'INFO' | 'WARNING' | 'DANGER';
    metadata: Record<string, any>;
    createdAt: string;
    user?: { name: string; email: string; role?: { name: string } };
}

const STATUS_STYLES: Record<string, string> = {
    INFO: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/30',
    WARNING: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30',
    DANGER: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30',
};

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'DANGER') return <ShieldExclamationIcon className="h-3.5 w-3.5" />;
    if (status === 'WARNING') return <ExclamationTriangleIcon className="h-3.5 w-3.5" />;
    return <InformationCircleIcon className="h-3.5 w-3.5" />;
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
    LOGIN_SUCCESS: 'User signed in successfully',
    LOGIN_FAILURE: 'Failed login attempt',
    USER_REGISTERED_INVITATION: 'New user registered via invitation',
    PASSWORD_RESET_REQUEST: 'Password reset was requested',
    PASSWORD_RESET_SUCCESS: 'Password was reset successfully',
    PERMISSION_DENIED: 'Access denied — insufficient permissions',
    BLOG_CREATE: 'Created a new blog post',
    BLOG_UPDATE: 'Updated a blog post',
    BLOG_DELETE: 'Deleted a blog post',
    BLOG_DUPLICATE: 'Duplicated a blog post',
    MEDIA_UPLOAD: 'Uploaded media file(s)',
    MEDIA_DELETE: 'Deleted media file(s)',
    MEDIA_MIGRATE_TO_CLOUD: 'Migrated media to cloud storage',
    SETTINGS_UPDATE: 'Updated system settings',
    USER_CREATE: 'Created a new user',
    USER_UPDATE: 'Updated user profile',
    ROLE_CREATE: 'Created a new role',
    ROLE_UPDATE: 'Updated role permissions',
    ROLE_DELETE: 'Deleted a role',
    THEME_ACTIVATE: 'Activated a theme',
    THEME_UPLOAD: 'Uploaded a theme package',
    THEME_DELETE: 'Deleted a theme',
    THEME_SETUP: 'Ran theme setup',
    THEME_RESET: 'Reset CMS to base state',
    THEME_INSTALL_MODULES: 'Installed theme modules',
    THEME_DEPLOYED_URL: 'Set theme deployed URL',
};

const getActionDescription = (action: string): string => {
    return ACTION_DESCRIPTIONS[action] || action.replace(/_/g, ' ').toLowerCase();
};

export default function AuditLogPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const LIMIT = 50;

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(LIMIT));
            if (actionFilter) params.set('action', actionFilter);
            if (statusFilter) params.set('status', statusFilter);
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);

            const data = await apiRequest(`/audit-logs/paginated?${params.toString()}`);
            setLogs((data as any).logs || []);
            setTotal((data as any).total || 0);
            setTotalPages((data as any).totalPages || 1);
        } catch {
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, actionFilter, statusFilter, fromDate, toDate]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [actionFilter, statusFilter, fromDate, toDate]);

    const filteredLogs = searchInput
        ? logs.filter(l =>
            l.action.toLowerCase().includes(searchInput.toLowerCase()) ||
            l.user?.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
            l.user?.email?.toLowerCase().includes(searchInput.toLowerCase())
        )
        : logs;

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader
                title="Audit"
                accent="Log"
                subtitle={`${total.toLocaleString()} total events recorded`}
            />
            {/* Unified Content Card */}
            <FilterBar 
                search={{
                    value: searchInput,
                    onChange: setSearchInput,
                    placeholder: "Search audit logs…"
                }}
                filters={[
                    {
                        label: "All Actions",
                        value: actionFilter,
                        onChange: setActionFilter,
                        options: Object.entries(ACTION_DESCRIPTIONS).map(([k, v]) => ({ label: v, value: k })),
                        icon: FunnelIcon
                    },
                    {
                        label: "All Levels",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { label: "Info", value: "INFO" },
                            { label: "Warning", value: "WARNING" },
                            { label: "Danger", value: "DANGER" }
                        ]
                    }
                ]}
            />

            {/* Unified Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/[0.06] shadow-2xl shadow-slate-900/5 overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mr-3" />
                        Loading…
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                        <ClipboardDocumentListIcon className="h-12 w-12 opacity-30 mb-3" />
                        <p className="font-semibold text-slate-500 dark:text-slate-400">No log entries found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-slate-900/60">
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timestamp</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">User</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Action</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Level</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <React.Fragment key={log.id}>
                                    <tr
                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                        className="border-b border-slate-100 dark:border-white/[0.06] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.user?.name || '—'}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{log.user?.email}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{log.action}</span>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{getActionDescription(log.action)}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${STATUS_STYLES[log.status] || STATUS_STYLES.INFO}`}>
                                                <StatusIcon status={log.status} />
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-[10px] text-slate-400 dark:text-slate-500 max-w-md">
                                            {Object.keys(log.metadata || {}).length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 line-clamp-2">
                                                    {Object.entries(log.metadata)
                                                        .filter(([k, v]) => typeof v !== 'object')
                                                        .map(([k, v]) => (
                                                            <span key={k} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-100 dark:border-white/[0.06] truncate max-w-[150px]">
                                                                <span className="font-bold opacity-60 uppercase">{k}</span>
                                                                <span className="font-mono text-[9px] truncate">{String(v)}</span>
                                                            </span>
                                                        ))}
                                                    {Object.entries(log.metadata)
                                                        .filter(([k, v]) => typeof v === 'object' && v !== null)
                                                        .map(([k]) => (
                                                            <span key={k} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-100 dark:border-white/[0.06] truncate max-w-[150px]">
                                                                <span className="font-bold opacity-60 uppercase">{k}</span>
                                                                <span className="font-mono text-[9px] truncate">{'{...}'}</span>
                                                            </span>
                                                        ))}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                    {expandedId === log.id && (
                                        <tr key={`${log.id}-detail`} className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-white/[0.06]">
                                            <td colSpan={5} className="px-5 py-4">
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Metadata</div>
                                                <pre className="text-xs bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] rounded-xl p-3 overflow-auto max-h-48 text-slate-700 dark:text-slate-300 font-mono scrollbar-thin dark:scrollbar-thumb-slate-700 dark:scrollbar-track-slate-900">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Page {page} of {totalPages} · {total.toLocaleString()} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-outline p-2"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                            const p = start + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={p === page ? 'btn-primary w-8 h-8 px-0' : 'btn-outline w-8 h-8 px-0 text-slate-600'}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn-outline p-2"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
