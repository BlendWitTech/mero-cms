'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    CircleStackIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

type FieldType = 'text' | 'textarea' | 'richtext' | 'number' | 'boolean' | 'date' | 'image' | 'select';

interface CollectionField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: string; // comma-separated for select type
}

interface Collection {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: 'COLLECTION' | 'SINGLETON';
    fields: CollectionField[];
    createdAt: string;
    _count?: { items: number };
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'richtext', label: 'Rich Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Toggle (Yes/No)' },
    { value: 'date', label: 'Date' },
    { value: 'image', label: 'Image URL' },
    { value: 'select', label: 'Select (Dropdown)' },
];

const emptyField = (): CollectionField => ({ name: '', label: '', type: 'text', required: false });

function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function CollectionsPage() {
    const router = useRouter();
    const { showToast } = useNotification();

    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [navigatingId, setNavigatingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const emptyForm = { name: '', slug: '', description: '', type: 'COLLECTION' as 'COLLECTION' | 'SINGLETON', fields: [emptyField()] };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchCollections(); }, []);

    async function fetchCollections() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/collections');
            setCollections(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load collections', 'error');
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    }

    function openEdit(col: Collection) {
        setEditingId(col.id);
        setForm({
            name: col.name,
            slug: col.slug,
            description: col.description || '',
            type: col.type,
            fields: col.fields?.length ? col.fields : [emptyField()],
        });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingId(null);
    }

    function handleNameChange(name: string) {
        setForm(f => ({
            ...f,
            name,
            slug: editingId ? f.slug : slugify(name),
        }));
    }

    // ── Field builder helpers ──────────────────────────────────────────────────

    function addField() {
        setForm(f => ({ ...f, fields: [...f.fields, emptyField()] }));
    }

    function removeField(idx: number) {
        setForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));
    }

    function updateField(idx: number, patch: Partial<CollectionField>) {
        setForm(f => {
            const fields = f.fields.map((field, i) => {
                if (i !== idx) return field;
                const updated = { ...field, ...patch };
                // Auto-generate name from label if name is empty
                if (patch.label !== undefined && !field.name) {
                    updated.name = slugify(patch.label).replace(/-/g, '_');
                }
                return updated;
            });
            return { ...f, fields };
        });
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    async function handleSave() {
        if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
        if (!form.slug.trim()) { showToast('Slug is required', 'error'); return; }
        const validFields = form.fields.filter(f => f.name && f.label);
        if (validFields.length === 0) { showToast('Add at least one field', 'error'); return; }

        setIsSaving(true);
        try {
            const payload = { ...form, fields: validFields };
            if (editingId) {
                await apiRequest(`/collections/${editingId}`, { method: 'PATCH', body: payload });
                showToast('Collection updated', 'success');
            } else {
                await apiRequest('/collections', { method: 'POST', body: payload });
                showToast('Collection created', 'success');
            }
            closeModal();
            fetchCollections();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await apiRequest(`/collections/${deleteId}`, { method: 'DELETE' });
            showToast('Collection deleted', 'success');
            setDeleteId(null);
            fetchCollections();
        } catch {
            showToast('Delete failed', 'error');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="Content" 
                accent="Collections" 
                subtitle="Define custom content schemas and manage their data"
                actions={
                    <button
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0 disabled:opacity-50"
                        onClick={openNew}
                        disabled={isLoading}
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        New Collection
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Search collections..."
                }}
            />
            
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Collections...</p>
                    </div>
                ) : collections.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={CircleStackIcon}
                            title="No Collections Yet"
                            description="Create a collection to start defining custom content schemas and managing your data."
                            action={{
                                label: "Create your first collection",
                                onClick: openNew
                            }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Collection Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Structure</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Type</th>
                                    <th className="pr-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {collections
                                    .filter(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((col) => (
                                    <tr key={col.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    <CircleStackIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span 
                                                        className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer" 
                                                        onClick={() => { setNavigatingId(col.id); router.push(`/dashboard/collections/${col.id}`); }}
                                                    >
                                                        {col.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">/{col.slug}</span>
                                                    {col.description && <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs truncate">{col.description}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{col.fields?.length ?? 0}</span>
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-0.5">Defined Fields</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${col.type === 'SINGLETON' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                {col.type}
                                            </span>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                            {navigatingId === col.id ? (
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <LoadingSpinner size="sm" variant="secondary" />
                                                    <span className="text-[11px] uppercase tracking-widest">Loading...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEdit(col); }}
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all shadow-sm disabled:opacity-50"
                                                        title="Edit schema"
                                                        disabled={isDeleting || navigatingId !== null}
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteId(col.id); }}
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/50 transition-all shadow-sm disabled:opacity-50"
                                                        title="Delete collection"
                                                        disabled={isDeleting || navigatingId !== null}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200 overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-blue-50 dark:from-blue-950/30 to-white dark:to-slate-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                        <CircleStackIcon className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                                        {editingId ? 'Edit Collection' : 'New Collection'}
                                    </h2>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">
                            {/* Name + Slug */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="e.g. FAQs"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Slug *</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        placeholder="e.g. faqs"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Description + Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Optional description"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Type *</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    >
                                        <option value="COLLECTION">Collection (multiple items)</option>
                                        <option value="SINGLETON">Singleton (single record)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fields */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Fields</label>
                                    <button
                                        onClick={addField}
                                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                                    >
                                        <PlusIcon className="h-3.5 w-3.5" />
                                        Add Field
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {form.fields.map((field, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/10">
                                            <div className="grid grid-cols-3 gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={e => updateField(idx, { label: e.target.value })}
                                                    placeholder="Label"
                                                    className="border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 bg-white dark:bg-white/[0.02] dark:text-white transition-all"
                                                />
                                                <input
                                                    type="text"
                                                    value={field.name}
                                                    onChange={e => updateField(idx, { name: e.target.value })}
                                                    placeholder="field_name"
                                                    className="border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 bg-white dark:bg-white/[0.02] dark:text-white transition-all"
                                                />
                                                <select
                                                    value={field.type}
                                                    onChange={e => updateField(idx, { type: e.target.value as FieldType })}
                                                    className="border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 bg-white dark:bg-white/[0.02] dark:text-white transition-all"
                                                >
                                                    {FIELD_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                                {field.type === 'select' && (
                                                    <input
                                                        type="text"
                                                        value={field.options || ''}
                                                        onChange={e => updateField(idx, { options: e.target.value })}
                                                        placeholder="Option 1, Option 2"
                                                        className="col-span-3 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 bg-white dark:bg-white/[0.02] dark:text-white transition-all"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!field.required}
                                                        onChange={e => updateField(idx, { required: e.target.checked })}
                                                        className="rounded dark:bg-slate-900 dark:border-white/10"
                                                    />
                                                    Req
                                                </label>
                                                <button
                                                    onClick={() => removeField(idx)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                    disabled={form.fields.length === 1}
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                            <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                            >
                                {isSaving && <LoadingSpinner size="sm" variant="white" />}
                                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            <AlertDialog
                isOpen={!!deleteId}
                title="Delete Collection"
                description="This will permanently delete the collection and all its items. This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
