'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface LogEntry {
    id: string;
    action: string;
    status: 'INFO' | 'WARNING' | 'DANGER';
    metadata: Record<string, any>;
    createdAt: string;
    user?: { name: string; email: string; role?: { name: string } };
}

const STATUS_STYLES: Record<string, string> = {
    INFO: 'bg-blue-50 text-blue-600 ring-blue-600/20',
    WARNING: 'bg-amber-50 text-amber-600 ring-amber-600/20',
    DANGER: 'bg-red-50 text-red-600 ring-red-600/20',
};

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'DANGER') return <ShieldExclamationIcon className="h-3.5 w-3.5" />;
    if (status === 'WARNING') return <ExclamationTriangleIcon className="h-3.5 w-3.5" />;
    return <InformationCircleIcon className="h-3.5 w-3.5" />;
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-xl">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Audit Log</h1>
                        <p className="text-xs text-slate-400">{total.toLocaleString()} total events</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by action or user…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                        />
                    </div>

                    {/* Action filter */}
                    <div className="relative">
                        <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            value={actionFilter}
                            onChange={e => setActionFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer appearance-none"
                        >
                            <option value="">All Actions</option>
                            {['BLOG_CREATE', 'BLOG_UPDATE', 'BLOG_DELETE', 'BLOG_DUPLICATE',
                                'MEDIA_UPLOAD', 'MEDIA_DELETE', 'MEDIA_MIGRATE_TO_CLOUD',
                                'SETTINGS_UPDATE', 'USER_LOGIN', 'USER_CREATE', 'USER_UPDATE',
                                'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE',
                                'THEME_ACTIVATE', 'THEME_UPLOAD', 'THEME_DELETE'].map(a => (
                                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer appearance-none"
                    >
                        <option value="">All Levels</option>
                        <option value="INFO">Info</option>
                        <option value="WARNING">Warning</option>
                        <option value="DANGER">Danger</option>
                    </select>

                    {/* Date range */}
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                            title="From date"
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                            title="To date"
                        />
                    </div>
                </div>

                {(actionFilter || statusFilter || fromDate || toDate) && (
                    <button
                        onClick={() => { setActionFilter(''); setStatusFilter(''); setFromDate(''); setToDate(''); }}
                        className="mt-3 text-[10px] font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mr-3" />
                        Loading…
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <ClipboardDocumentListIcon className="h-12 w-12 opacity-30 mb-3" />
                        <p className="font-semibold">No log entries found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</th>
                                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <>
                                    <tr
                                        key={log.id}
                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                        className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-xs font-bold text-slate-800">{log.user?.name || '—'}</div>
                                            <div className="text-[10px] text-slate-400">{log.user?.email}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-bold text-slate-700 font-mono">{log.action}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${STATUS_STYLES[log.status] || STATUS_STYLES.INFO}`}>
                                                <StatusIcon status={log.status} />
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-[10px] text-slate-400 max-w-xs truncate">
                                            {Object.keys(log.metadata || {}).length > 0
                                                ? Object.entries(log.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')
                                                : '—'}
                                        </td>
                                    </tr>
                                    {expandedId === log.id && (
                                        <tr key={`${log.id}-detail`} className="bg-slate-50 border-b border-slate-100">
                                            <td colSpan={5} className="px-5 py-4">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metadata</div>
                                                <pre className="text-xs bg-white border border-slate-200 rounded-xl p-3 overflow-auto max-h-48 text-slate-700 font-mono">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Page {page} of {totalPages} · {total.toLocaleString()} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
