'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, UserGroupIcon, XMarkIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import { getApiBaseUrl } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const API_URL = getApiBaseUrl();

interface TeamMember {
    id: string;
    name: string;
    role?: string;
    bio?: string;
    avatar?: string;
    socialLinks?: Record<string, string>;
    order: number;
    isActive: boolean;
}

const EMPTY_FORM = {
    name: '',
    role: '',
    bio: '',
    avatar: '',
    socialLinks: { linkedin: '', twitter: '', github: '' },
    order: 0,
    isActive: true,
};

export default function TeamPage() {
    const { showToast } = useNotification();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

    useEffect(() => { fetchMembers(); }, []);

    async function fetchMembers() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/team');
            setMembers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (!err?.message?.includes('not enabled') && !err?.message?.includes('403')) {
                showToast('Failed to load team members', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    }

    function openEdit(m: TeamMember) {
        setEditingId(m.id);
        setForm({
            name: m.name,
            role: m.role || '',
            bio: m.bio || '',
            avatar: m.avatar || '',
            socialLinks: { linkedin: '', twitter: '', github: '', ...(m.socialLinks || {}) },
            order: m.order,
            isActive: m.isActive,
        });
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
        setIsSaving(true);
        try {
            const payload = {
                ...form,
                socialLinks: Object.fromEntries(
                    Object.entries(form.socialLinks).filter(([, v]) => v.trim())
                ),
            };
            if (editingId) {
                await apiRequest(`/team/${editingId}`, { method: 'PATCH', body: payload });
                showToast('Team member updated', 'success');
            } else {
                await apiRequest('/team', { method: 'POST', body: payload });
                showToast('Team member added', 'success');
            }
            setModalOpen(false);
            fetchMembers();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/team/${deleteId}`, { method: 'DELETE' });
            showToast('Team member deleted', 'success');
            setDeleteId(null);
            fetchMembers();
        } catch {
            showToast('Delete failed', 'error');
        }
    }

    async function toggleActive(m: TeamMember) {
        try {
            await apiRequest(`/team/${m.id}`, { method: 'PATCH', body: { isActive: !m.isActive } });
            fetchMembers();
        } catch { showToast('Update failed', 'error'); }
    }

    const sortedMembers = [...members].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="Management" 
                accent="Team" 
                subtitle="Showcase the people behind your business"
                actions={
                    <button 
                        onClick={openNew} 
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        Add Member
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Search team members…"
                }}
            />

            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Team...</p>
                    </div>
                ) : sortedMembers.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={UserGroupIcon}
                            title="No Team Members Yet"
                            description="Add your team members to showcase the people behind your business."
                            action={{
                                label: "Add first member",
                                onClick: openNew
                            }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Member Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="pr-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {sortedMembers
                                    .filter(m => 
                                        (m?.name?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') || 
                                        (m?.role?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '')
                                    )
                                    .map(m => (
                                    <tr key={m.id} className={`group transition-colors ${m.isActive ? 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]' : 'opacity-60'}`}>
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {m.avatar ? (
                                                        <img src={m.avatar.startsWith('/') ? `${API_URL}${m.avatar}` : m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-lg">{m.name[0]}</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{m.name}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {m.role && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{m.role}</span>}
                                                        {m.role && m.bio && <span className="text-slate-300 dark:text-slate-600">•</span>}
                                                        {m.bio && <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs truncate">{m.bio}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button onClick={() => toggleActive(m)} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${m.isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
                                                {m.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(m)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all shadow-sm">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(m.id)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/50 transition-all shadow-sm">
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
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{editingId ? 'Edit Member' : 'Add Member'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role / Title</label>
                                <input type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Senior Developer"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Short bio..."
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Avatar URL</label>
                                <input type="url" value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} placeholder="/uploads/photo.jpg"
                                    className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['linkedin', 'twitter', 'github'].map(key => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 capitalize">{key}</label>
                                        <input type="url" value={(form.socialLinks as any)[key] || ''} onChange={e => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }))}
                                            placeholder={`https://${key}.com/...`}
                                            className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Order</label>
                                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} min={0}
                                        className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
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
                                {editingId ? 'Save Changes' : 'Add Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Team Member"
                description="Are you sure you want to delete this team member? This cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
