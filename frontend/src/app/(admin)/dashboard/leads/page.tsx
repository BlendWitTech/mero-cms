'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    InboxIcon, MagnifyingGlassIcon, FunnelIcon, TrashIcon, EyeIcon,
    XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    source?: string;
    status: string;
    notes?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED'];

const STATUS_STYLES: Record<string, string> = {
    NEW: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    CONTACTED: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    QUALIFIED: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    CONVERTED: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    CLOSED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

export default function LeadsPage() {
    const { showToast } = useNotification();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [viewLead, setViewLead] = useState<Lead | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const LIMIT = 20;

    const fetchLeads = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (searchInput) params.set('search', searchInput);
            const data = await apiRequest(`/leads?${params.toString()}`);
            const list = Array.isArray(data) ? data : (data?.leads || []);
            setLeads(list);
            setTotal(data?.total || list.length);
            setTotalPages(Math.ceil((data?.total || list.length) / LIMIT));
        } catch (err: any) {
            if (!err?.message?.includes('not enabled') && !err?.message?.includes('403')) {
                showToast('Failed to load leads', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchInput]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);
    useEffect(() => { setPage(1); }, [statusFilter, searchInput]);

    async function updateStatus(id: string, status: string) {
        try {
            await apiRequest(`/leads/${id}`, { method: 'PATCH', body: { status } });
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
            if (viewLead?.id === id) setViewLead(v => v ? { ...v, status } : v);
            showToast('Status updated', 'success');
        } catch { showToast('Update failed', 'error'); }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/leads/${deleteId}`, { method: 'DELETE' });
            showToast('Lead deleted', 'success');
            setDeleteId(null);
            if (viewLead?.id === deleteId) setViewLead(null);
            fetchLeads();
        } catch { showToast('Delete failed', 'error'); }
    }

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader 
                title="Leads" 
                accent="Management" 
                subtitle={`${total} inquiry${total !== 1 ? 's' : ''} — review and update statuses below`}
            />

            <FilterBar 
                search={{
                    value: searchInput,
                    onChange: setSearchInput,
                    placeholder: "Search by name, email, company…"
                }}
                filters={[
                    {
                        label: "All Statuses",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: STATUS_OPTIONS.map(s => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: s }))
                    }
                ]}
            />
            
            {/* Main Content Container */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/[0.06] overflow-hidden shadow-2xl shadow-slate-900/5 transition-all duration-500">

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400">
                        <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-600 border-t-transparent mr-3" />
                        Loading…
                    </div>
                ) : leads.length === 0 ? (
                    <EmptyState 
                        icon={InboxIcon}
                        title="No Leads Found"
                        description="New inquiries from your contact forms will appear here. Share your forms to start collecting leads."
                    />
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell">Source</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell text-center">Date</th>
                                <th className="pr-10 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} className="group border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="pl-10 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{lead.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{lead.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 hidden md:table-cell">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                            {lead.source || 'Direct'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${lead.status === 'NEW' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-blue-600/20' :
                                                lead.status === 'CONTACTED' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 ring-amber-600/20' :
                                                    lead.status === 'QUALIFIED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-emerald-600/20' :
                                                        lead.status === 'CLOSED' ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 ring-slate-400/20' :
                                                            'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 ring-violet-600/20'
                                            }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 hidden sm:table-cell text-center">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="pr-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewLead(lead)} className="btn-ghost p-2 text-slate-400 hover:text-blue-600">
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setDeleteId(lead.id)} className="btn-ghost p-2 text-slate-400 hover:text-red-600">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {totalPages > 1 && (
                    <div className="px-8 py-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.01]">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="btn-outline p-2">
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="btn-outline p-2">
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Lead Modal */}
            {viewLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Lead Details</h2>
                            <button onClick={() => setViewLead(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 font-black text-green-600 dark:text-green-400 text-lg">
                                    {viewLead.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{viewLead.name}</h3>
                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1"><EnvelopeIcon className="h-3.5 w-3.5" />{viewLead.email}</span>
                                        {viewLead.phone && <span className="flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" />{viewLead.phone}</span>}
                                        {viewLead.company && <span className="flex items-center gap-1"><BuildingOfficeIcon className="h-3.5 w-3.5" />{viewLead.company}</span>}
                                    </div>
                                </div>
                            </div>
                            {viewLead.message && (
                                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Message</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{viewLead.message}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Source</p>
                                    <p className="text-slate-700 dark:text-slate-300">{viewLead.source || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Received</p>
                                    <p className="text-slate-700 dark:text-slate-300">{formatDate(viewLead.createdAt)}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Status</p>
                                <select value={viewLead.status} onChange={e => updateStatus(viewLead.id, e.target.value)}
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/50">
                            <button onClick={() => { setDeleteId(viewLead.id); setViewLead(null); }} className="btn-ghost px-4 py-2 text-sm text-red-600">
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                            <button onClick={() => setViewLead(null)} className="btn-outline px-5 py-2 text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Lead"
                description="Are you sure you want to delete this lead? This cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
