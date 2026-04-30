'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    BoltIcon,
    XMarkIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret?: string;
    isActive: boolean;
    createdAt: string;
}

const ALL_EVENTS = [
    'post.published', 'post.updated', 'post.deleted',
    'page.updated', 'page.deleted',
    'lead.created', 'form.submission',
    'theme.activated', 'settings.updated',
];


export default function WebhooksPage() {
    // ... (rest of logic unchanged)
    const { showToast } = useNotification();
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const emptyForm = { name: '', url: '', events: [] as string[], secret: '', isActive: true };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchWebhooks(); }, []);

    async function fetchWebhooks() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/webhooks', { skipNotification: true });
            setWebhooks(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (!err?.message?.includes('not enabled') && !err?.message?.includes('403')) {
                showToast('Failed to load webhooks', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() { setEditingId(null); setForm(emptyForm); setModalOpen(true); }

    function openEdit(wh: Webhook) {
        setEditingId(wh.id);
        setForm({ name: wh.name, url: wh.url, events: wh.events, secret: wh.secret || '', isActive: wh.isActive });
        setModalOpen(true);
    }

    function toggleEvent(event: string) {
        setForm(f => ({
            ...f,
            events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
        }));
    }

    async function handleSave() {
        if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
        if (!form.url.trim()) { showToast('URL is required', 'error'); return; }
        if (form.events.length === 0) { showToast('Select at least one event', 'error'); return; }
        setIsSaving(true);
        try {
            const payload = { ...form, secret: form.secret || undefined };
            if (editingId) {
                await apiRequest(`/webhooks/${editingId}`, { method: 'PATCH', body: payload });
                showToast('Webhook updated', 'success');
            } else {
                await apiRequest('/webhooks', { method: 'POST', body: payload });
                showToast('Webhook created', 'success');
            }
            setModalOpen(false);
            fetchWebhooks();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/webhooks/${deleteId}`, { method: 'DELETE' });
            showToast('Webhook deleted', 'success');
            setDeleteId(null);
            fetchWebhooks();
        } catch { showToast('Delete failed', 'error'); }
    }

    async function toggleActive(wh: Webhook) {
        try {
            await apiRequest(`/webhooks/${wh.id}`, { method: 'PATCH', body: { isActive: !wh.isActive } });
            fetchWebhooks();
        } catch { showToast('Update failed', 'error'); }
    }
    
    const filteredWebhooks = webhooks.filter(w => 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        w.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader
                title="System"
                accent="Webhooks"
                subtitle="Notify external services when content changes"
                actions={
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        New Webhook
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Find webhook by URL or description…"
                }}
            />

            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                <div className="p-10">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="content-skeleton h-20 rounded-2xl" />)}
                        </div>
                    ) : filteredWebhooks.length === 0 ? (
                        <EmptyState 
                            naked
                            icon={BoltIcon}
                            title="No Webhooks Found"
                            description="Notify services like Vercel or Discord when content changes."
                            action={{
                                label: "Add first webhook",
                                onClick: openNew
                            }}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                        <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Webhook Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target URL</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Events</th>
                                        <th className="pr-10 py-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {filteredWebhooks.map(wh => (
                                        <tr key={wh.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="pl-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => toggleActive(wh)}
                                                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${wh.isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}
                                                        title={wh.isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
                                                    >
                                                        {wh.isActive ? <CheckCircleIcon className="h-6 w-6" /> : <XCircleIcon className="h-6 w-6" />}
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{wh.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">{wh.isActive ? 'Syncing Active' : 'Suspended'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md font-mono max-w-[200px] truncate block">
                                                    {wh.url}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {wh.events.slice(0, 2).map(e => (
                                                        <span key={e} className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-500/20">{e}</span>
                                                    ))}
                                                    {wh.events.length > 2 && <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full">+{wh.events.length - 2} more</span>}
                                                </div>
                                            </td>
                                            <td className="pr-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(wh)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all shadow-sm">
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteId(wh.id)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/50 transition-all shadow-sm">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{editingId ? 'Edit Webhook' : 'New Webhook'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Vercel Deploy Hook"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">URL *</label>
                                <input
                                    type="url"
                                    value={form.url}
                                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Secret <span className="font-normal text-slate-400 dark:text-slate-500">(optional — sent as X-Webhook-Signature header)</span></label>
                                <input
                                    type="text"
                                    value={form.secret}
                                    onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                                    placeholder="Leave blank for no signature"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Events *</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {ALL_EVENTS.map(event => (
                                        <label key={event} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-xs font-semibold ${form.events.includes(event) ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-500/50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={form.events.includes(event)}
                                                onChange={() => toggleEvent(event)}
                                                className="sr-only"
                                            />
                                            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.events.includes(event) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-white/20'}`}>
                                                {form.events.includes(event) && <CheckCircleIcon className="h-2.5 w-2.5 text-white" />}
                                            </div>
                                            {event}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-white/[0.06]">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</span>
                                <div
                                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${form.isActive ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/50">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Webhook'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                title="Delete Webhook"
                description="This webhook will be permanently deleted and will stop receiving events."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
