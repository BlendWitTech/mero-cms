'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import { getApiBaseUrl } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const API_URL = getApiBaseUrl();

interface Service {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    image?: string;
    order: number;
    isActive: boolean;
}

const EMPTY_FORM = {
    title: '',
    description: '',
    icon: '',
    image: '',
    order: 0,
    isActive: true,
};

export default function ServicesPage() {
    const { showToast } = useNotification();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

    useEffect(() => { fetchServices(); }, []);

    async function fetchServices() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/services');
            setServices(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (!err?.message?.includes('not enabled') && !err?.message?.includes('403')) {
                showToast('Failed to load services', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); }

    function openEdit(s: Service) {
        setEditingId(s.id);
        setForm({ title: s.title, description: s.description || '', icon: s.icon || '', image: s.image || '', order: s.order, isActive: s.isActive });
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
        setIsSaving(true);
        try {
            if (editingId) {
                await apiRequest(`/services/${editingId}`, { method: 'PATCH', body: form });
                showToast('Service updated', 'success');
            } else {
                await apiRequest('/services', { method: 'POST', body: form });
                showToast('Service added', 'success');
            }
            setModalOpen(false);
            fetchServices();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/services/${deleteId}`, { method: 'DELETE' });
            showToast('Service deleted', 'success');
            setDeleteId(null);
            fetchServices();
        } catch { showToast('Delete failed', 'error'); }
    }

    async function toggleActive(s: Service) {
        try {
            await apiRequest(`/services/${s.id}`, { method: 'PATCH', body: { isActive: !s.isActive } });
            fetchServices();
        } catch { showToast('Update failed', 'error'); }
    }

    const sorted = [...services].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="Our" 
                accent="Services" 
                subtitle={`${services.length} service${services.length !== 1 ? 's' : ''} configured for your business`}
                actions={
                    <button 
                        onClick={openNew} 
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        Add Service
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Find service by title…"
                }}
            />

            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Services...</p>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={BriefcaseIcon}
                            title="No Services Yet"
                            description="List your professional services here to show them on your website."
                            action={{
                                label: "Add first service",
                                onClick: openNew
                            }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Service Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="pr-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {sorted
                                    .filter(s => 
                                        (s?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                                        (s?.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                    )
                                    .map(s => (
                                    <tr key={s.id} className={`group transition-colors ${s.isActive ? 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]' : 'opacity-60'}`}>
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {s.image ? (
                                                        <img src={s.image.startsWith('/') ? `${API_URL}${s.image}` : s.image} alt={s.title} className="w-full h-full object-cover" />
                                                    ) : s.icon ? (
                                                        <span className="text-xl">{s.icon}</span>
                                                    ) : (
                                                        <BriefcaseIcon className="h-5 w-5 text-purple-400 dark:text-purple-500" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{s.title}</span>
                                                    {s.description && <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs truncate">{s.description}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button onClick={() => toggleActive(s)} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${s.isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
                                                {s.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(s)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all shadow-sm">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/50 transition-all shadow-sm">
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

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{editingId ? 'Edit Service' : 'Add Service'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Icon (emoji)</label>
                                    <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔧"
                                        className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Order</label>
                                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} min={0}
                                        className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Image URL</label>
                                <input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="/uploads/service.jpg"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-white/[0.06]">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Visible on site</span>
                                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${form.isActive ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/50">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 text-sm font-semibold border border-blue-600/60 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-transparent rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] disabled:opacity-50 transition-colors flex items-center gap-2">
                                {isSaving && <div className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />}
                                {editingId ? 'Save Changes' : 'Add Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Service"
                description="Are you sure you want to delete this service?"
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
