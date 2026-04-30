'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, StarIcon, XMarkIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import { getApiBaseUrl } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const API_URL = getApiBaseUrl();

interface Testimonial {
    id: string;
    clientName: string;
    clientRole?: string;
    clientCompany?: string;
    clientAvatar?: string;
    content: string;
    rating?: number;
    isActive: boolean;
    order: number;
}

const EMPTY_FORM = {
    clientName: '',
    clientRole: '',
    clientCompany: '',
    clientAvatar: '',
    content: '',
    rating: 5,
    order: 0,
    isActive: true,
};

export default function TestimonialsPage() {
    const { showToast } = useNotification();
    const [items, setItems] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

    useEffect(() => { fetchItems(); }, []);

    async function fetchItems() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/testimonials');
            setItems(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (!err?.message?.includes('not enabled') && !err?.message?.includes('403')) {
                showToast('Failed to load testimonials', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); }

    function openEdit(t: Testimonial) {
        setEditingId(t.id);
        setForm({
            clientName: t.clientName,
            clientRole: t.clientRole || '',
            clientCompany: t.clientCompany || '',
            clientAvatar: t.clientAvatar || '',
            content: t.content,
            rating: t.rating ?? 5,
            order: t.order,
            isActive: t.isActive,
        });
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.clientName.trim()) { showToast('Client name is required', 'error'); return; }
        if (!form.content.trim()) { showToast('Review content is required', 'error'); return; }
        setIsSaving(true);
        try {
            if (editingId) {
                await apiRequest(`/testimonials/${editingId}`, { method: 'PATCH', body: form });
                showToast('Testimonial updated', 'success');
            } else {
                await apiRequest('/testimonials', { method: 'POST', body: form });
                showToast('Testimonial added', 'success');
            }
            setModalOpen(false);
            fetchItems();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/testimonials/${deleteId}`, { method: 'DELETE' });
            showToast('Testimonial deleted', 'success');
            setDeleteId(null);
            fetchItems();
        } catch { showToast('Delete failed', 'error'); }
    }

    async function toggleActive(t: Testimonial) {
        try {
            await apiRequest(`/testimonials/${t.id}`, { method: 'PATCH', body: { isActive: !t.isActive } });
            fetchItems();
        } catch { showToast('Update failed', 'error'); }
    }

    const sorted = [...items].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="Client" 
                accent="Testimonials" 
                subtitle={`${items.length} review${items.length !== 1 ? 's' : ''} from your clients`}
                actions={
                    <button 
                        onClick={openNew} 
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        Add Testimonial
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Search testimonials by client name or feedback…"
                }}
            />

            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Testimonials...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={ChatBubbleBottomCenterTextIcon}
                            title="No Testimonials Yet"
                            description="Collect and showcase reviews from your happy clients to build trust."
                            action={{
                                label: "Add first testimonial",
                                onClick: openNew
                            }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[40%]">Client Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Feedback</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="pr-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {sorted
                                    .filter(t => 
                                        (t?.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                                        (t?.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                    )
                                    .map(t => (
                                    <tr key={t.id} className={`group transition-colors ${t.isActive ? 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]' : 'opacity-60'}`}>
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {t.clientAvatar ? (
                                                        <img src={t.clientAvatar.startsWith('/') ? `${API_URL}${t.clientAvatar}` : t.clientAvatar} alt={t.clientName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-black">{t.clientName[0]}</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.clientName}</span>
                                                    {(t.clientRole || t.clientCompany) && (
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {[t.clientRole, t.clientCompany].filter(Boolean).join(' · ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                {t.rating && (
                                                    <div className="flex gap-0.5">
                                                        {[1,2,3,4,5].map(s => (
                                                            s <= (t.rating || 5)
                                                                ? <StarSolid key={s} className="h-3 w-3 text-amber-400" />
                                                                : <StarIcon key={s} className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 max-w-sm">"{t.content}"</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button onClick={() => toggleActive(t)} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${t.isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
                                                {t.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(t)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all shadow-sm">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(t.id)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/50 transition-all shadow-sm">
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
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Client Name *</label>
                                    <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                                        className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                                    <input type="text" value={form.clientRole} onChange={e => setForm(f => ({ ...f, clientRole: e.target.value }))} placeholder="CEO, Manager..."
                                        className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Company</label>
                                    <input type="text" value={form.clientCompany} onChange={e => setForm(f => ({ ...f, clientCompany: e.target.value }))}
                                        className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Review *</label>
                                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="What did the client say?"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Avatar URL</label>
                                <input type="url" value={form.clientAvatar} onChange={e => setForm(f => ({ ...f, clientAvatar: e.target.value }))} placeholder="/uploads/avatar.jpg"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Rating</label>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(s => (
                                        <button key={s} type="button" onClick={() => setForm(f => ({ ...f, rating: s }))}
                                            className="p-1 transition-transform hover:scale-110">
                                            {s <= form.rating
                                                ? <StarSolid className="h-5 w-5 text-amber-400" />
                                                : <StarIcon className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                            }
                                        </button>
                                    ))}
                                </div>
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
                                {editingId ? 'Save Changes' : 'Add Testimonial'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Testimonial"
                description="Are you sure you want to delete this testimonial?"
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
