'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    CircleStackIcon,
    XMarkIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';

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
        try {
            await apiRequest(`/collections/${deleteId}`, { method: 'DELETE' });
            showToast('Collection deleted', 'success');
            setDeleteId(null);
            fetchCollections();
        } catch {
            showToast('Delete failed', 'error');
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <CircleStackIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Collections</h1>
                        <p className="text-sm text-slate-500">Define custom content schemas and manage their data</p>
                    </div>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Collection
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : collections.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <CircleStackIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No collections yet</p>
                    <p className="text-sm text-slate-400 mb-4">Create a collection to define a custom content schema</p>
                    <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                        Create your first collection
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {collections.map(col => (
                        <div
                            key={col.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all group"
                        >
                            <button
                                className="flex items-center gap-4 flex-1 text-left"
                                onClick={() => router.push(`/dashboard/collections/${col.id}`)}
                            >
                                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                    <CircleStackIcon className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-slate-900 text-sm">{col.name}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.type === 'SINGLETON' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {col.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span>/{col.slug}</span>
                                        <span>{col.fields?.length ?? 0} fields</span>
                                        {col.description && <span className="truncate max-w-xs">{col.description}</span>}
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors mr-2" />
                            </button>
                            <div className="flex items-center gap-1 ml-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEdit(col); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit schema"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteId(col.id); }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete collection"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-black text-slate-900">
                                {editingId ? 'Edit Collection' : 'New Collection'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                            {/* Name + Slug */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="e.g. FAQs"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug *</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        placeholder="e.g. faqs"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Description + Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Optional description"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Type *</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                                    >
                                        <option value="COLLECTION">Collection (multiple items)</option>
                                        <option value="SINGLETON">Singleton (single record)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fields */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700">Fields</label>
                                    <button
                                        onClick={addField}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold"
                                    >
                                        <PlusIcon className="h-3.5 w-3.5" />
                                        Add Field
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {form.fields.map((field, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="grid grid-cols-3 gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={e => updateField(idx, { label: e.target.value })}
                                                    placeholder="Label"
                                                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                                                />
                                                <input
                                                    type="text"
                                                    value={field.name}
                                                    onChange={e => updateField(idx, { name: e.target.value })}
                                                    placeholder="field_name"
                                                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                                                />
                                                <select
                                                    value={field.type}
                                                    onChange={e => updateField(idx, { type: e.target.value as FieldType })}
                                                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
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
                                                        className="col-span-3 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!field.required}
                                                        onChange={e => updateField(idx, { required: e.target.checked })}
                                                        className="rounded"
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
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                            >
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
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
