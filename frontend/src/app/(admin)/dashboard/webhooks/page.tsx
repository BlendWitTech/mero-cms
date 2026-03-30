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
    const { showToast } = useNotification();
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const emptyForm = { name: '', url: '', events: [] as string[], secret: '', isActive: true };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchWebhooks(); }, []);

    async function fetchWebhooks() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/webhooks');
            setWebhooks(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load webhooks', 'error');
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    }

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
        } catch {
            showToast('Delete failed', 'error');
        }
    }

    async function toggleActive(wh: Webhook) {
        try {
            await apiRequest(`/webhooks/${wh.id}`, { method: 'PATCH', body: { isActive: !wh.isActive } });
            fetchWebhooks();
        } catch {
            showToast('Update failed', 'error');
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <BoltIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Webhooks</h1>
                        <p className="text-sm text-slate-500">Notify external services when content changes</p>
                    </div>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Webhook
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />)}
                </div>
            ) : webhooks.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <BoltIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No webhooks configured</p>
                    <p className="text-sm text-slate-400 mb-4">Add a webhook to notify services like Vercel when content changes</p>
                    <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                        Add first webhook
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {webhooks.map(wh => (
                        <div key={wh.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between hover:border-blue-200 transition-all">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <button
                                    onClick={() => toggleActive(wh)}
                                    className="mt-0.5 shrink-0"
                                    title={wh.isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
                                >
                                    {wh.isActive
                                        ? <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                        : <XCircleIcon className="h-5 w-5 text-slate-300" />
                                    }
                                </button>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-slate-900 text-sm">{wh.name}</span>
                                        {!wh.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Disabled</span>}
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono truncate mb-2">{wh.url}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {wh.events.map(e => (
                                            <span key={e} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{e}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 ml-4 shrink-0">
                                <button onClick={() => openEdit(wh)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <button onClick={() => setDeleteId(wh.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-black text-slate-900">{editingId ? 'Edit Webhook' : 'New Webhook'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Vercel Deploy Hook"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">URL *</label>
                                <input
                                    type="url"
                                    value={form.url}
                                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Secret <span className="font-normal text-slate-400">(optional — sent as X-Webhook-Signature header)</span></label>
                                <input
                                    type="text"
                                    value={form.secret}
                                    onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                                    placeholder="Leave blank for no signature"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Events *</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {ALL_EVENTS.map(event => (
                                        <label key={event} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-xs font-semibold ${form.events.includes(event) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={form.events.includes(event)}
                                                onChange={() => toggleEvent(event)}
                                                className="sr-only"
                                            />
                                            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.events.includes(event) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                {form.events.includes(event) && <CheckCircleIcon className="h-2.5 w-2.5 text-white" />}
                                            </div>
                                            {event}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-700">Active</span>
                                <div
                                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${form.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
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
