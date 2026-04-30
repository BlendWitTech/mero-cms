'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CircleStackIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import MediaPickerModal from '@/components/ui/MediaPickerModal';

interface CollectionField {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string;
}

interface Collection {
    id: string;
    name: string;
    slug: string;
    type: 'COLLECTION' | 'SINGLETON';
    fields: CollectionField[];
}

interface ContentItem {
    id: string;
    collectionId: string;
    data: Record<string, any>;
    slug?: string;
    isPublished: boolean;
    createdAt: string;
}

export default function CollectionItemsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { showToast } = useNotification();

    const [collection, setCollection] = useState<Collection | null>(null);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [formSlug, setFormSlug] = useState('');
    const [formPublished, setFormPublished] = useState(true);
    const [mediaPickerField, setMediaPickerField] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [col, itemsData] = await Promise.all([
                apiRequest(`/collections/${id}`),
                apiRequest(`/content-items?collectionId=${id}`),
            ]);
            setCollection(col);
            setItems(Array.isArray(itemsData) ? itemsData : []);
        } catch {
            showToast('Failed to load collection', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    function buildEmptyData(fields: CollectionField[]): Record<string, any> {
        return Object.fromEntries(fields.map(f => [f.name, f.type === 'boolean' ? false : f.type === 'number' ? '' : '']));
    }

    function openNew() {
        if (!collection) return;
        setEditingItemId(null);
        setFormData(buildEmptyData(collection.fields));
        setFormSlug('');
        setFormPublished(true);
        setModalOpen(true);
    }

    function openEdit(item: ContentItem) {
        setEditingItemId(item.id);
        setFormData({ ...item.data });
        setFormSlug(item.slug || '');
        setFormPublished(item.isPublished);
        setModalOpen(true);
    }

    // For singletons: open the single item if it exists, else new
    function openSingleton() {
        if (items.length > 0) {
            openEdit(items[0]);
        } else {
            openNew();
        }
    }

    function closeModal() {
        setModalOpen(false);
        setEditingItemId(null);
        setMediaPickerField(null);
    }

    async function handleSave() {
        if (!collection) return;
        // Validate required fields
        for (const field of collection.fields) {
            if (field.required && !formData[field.name] && formData[field.name] !== 0 && formData[field.name] !== false) {
                showToast(`"${field.label}" is required`, 'error');
                return;
            }
        }

        setIsSaving(true);
        try {
            const payload = {
                collectionId: collection.id,
                data: formData,
                slug: formSlug || null,
                isPublished: formPublished,
            };
            if (editingItemId) {
                await apiRequest(`/content-items/${editingItemId}`, { method: 'PATCH', body: payload });
                showToast('Item updated', 'success');
            } else {
                await apiRequest('/content-items', { method: 'POST', body: payload });
                showToast('Item created', 'success');
            }
            closeModal();
            fetchData();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/content-items/${deleteId}`, { method: 'DELETE' });
            showToast('Item deleted', 'success');
            setDeleteId(null);
            fetchData();
        } catch {
            showToast('Delete failed', 'error');
        }
    }

    // ── Field renderer ────────────────────────────────────────────────────────

    function renderField(field: CollectionField) {
        const value = formData[field.name];
        const set = (v: any) => setFormData(d => ({ ...d, [field.name]: v }));

        switch (field.type) {
            case 'boolean':
                return (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div
                            onClick={() => set(!value)}
                            className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${value ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                        <span className="text-sm text-slate-600">{value ? 'Yes' : 'No'}</span>
                    </label>
                );
            case 'select': {
                const opts = (field.options || '').split(',').map(o => o.trim()).filter(Boolean);
                return (
                    <select
                        value={value || ''}
                        onChange={e => set(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                    >
                        <option value="">Select...</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                );
            }
            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={e => set(e.target.value)}
                        rows={4}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                    />
                );
            case 'richtext':
                return (
                    <textarea
                        value={value || ''}
                        onChange={e => set(e.target.value)}
                        rows={6}
                        placeholder="Supports HTML"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                    />
                );
            case 'image':
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={value || ''}
                            onChange={e => set(e.target.value)}
                            placeholder="https://... or pick from media"
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        />
                        <button
                            type="button"
                            onClick={() => setMediaPickerField(field.name)}
                            className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                        >
                            Pick
                        </button>
                        {value && (
                            <img src={value} alt="" className="h-10 w-10 object-cover rounded-lg border border-slate-200" />
                        )}
                    </div>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={e => set(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={value || ''}
                        onChange={e => set(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={e => set(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                );
        }
    }

    // ── Summary value for table cell ──────────────────────────────────────────

    function summarizeData(data: Record<string, any>, fields: CollectionField[]) {
        if (!fields?.length) return '—';
        const firstTextField = fields.find(f => ['text', 'textarea'].includes(f.type));
        const key = firstTextField?.name || fields[0]?.name;
        const val = key ? data[key] : null;
        if (!val) return '—';
        return String(val).slice(0, 60);
    }

    if (isLoading) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="content-skeleton h-8 w-48 mb-6" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="content-skeleton h-16" />)}
                </div>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="p-6 max-w-5xl mx-auto text-center py-20">
                <p className="text-slate-500">Collection not found.</p>
                <button onClick={() => router.push('/dashboard/collections')} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
                    Back to Collections
                </button>
            </div>
        );
    }

    const isSingleton = collection.type === 'SINGLETON';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard/collections')}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{collection.name}</h1>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${isSingleton ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'}`}>
                                {collection.type}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">/{collection.slug} · {collection.fields.length} fields</p>
                    </div>
                </div>
                {isSingleton ? (
                    <button
                        onClick={openSingleton}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest shadow-sm shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit Record
                    </button>
                ) : (
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest shadow-sm shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Item
                    </button>
                )}
            </div>

            {/* Singleton: show inline empty state or "record exists" card */}
            {isSingleton && items.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-white/[0.06]">
                    <CircleStackIcon className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-semibold">No record yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Click "Edit Record" to create the singleton entry</p>
                </div>
            )}

            {isSingleton && items.length > 0 && (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Record</span>
                        <div className="flex gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${items[0].isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                {items[0].isPublished ? 'Published' : 'Draft'}
                            </span>
                            <button onClick={() => openEdit(items[0])} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {collection.fields.map(field => (
                            <div key={field.name}>
                                <dt className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{field.label}</dt>
                                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                                    {field.type === 'boolean'
                                        ? (items[0].data[field.name] ? 'Yes' : 'No')
                                        : field.type === 'image' && items[0].data[field.name]
                                            ? <img src={items[0].data[field.name]} alt="" className="h-12 w-12 object-cover rounded-lg" />
                                            : String(items[0].data[field.name] ?? '—').slice(0, 80)
                                    }
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}

            {/* Collection type: items table */}
            {!isSingleton && items.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                    <CircleStackIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-semibold">No items yet</p>
                    <button onClick={openNew} className="mt-3 border border-blue-600/60 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-transparent px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors">
                        Add first item
                    </button>
                </div>
            )}

            {!isSingleton && items.length > 0 && (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/[0.06] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-slate-800/30">
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slug</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 w-20" />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id} className={`border-b border-slate-50 dark:border-white/[0.06] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${idx === items.length - 1 ? 'border-0' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                        {summarizeData(item.data, collection.fields)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">
                                        {item.slug || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                            {item.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(item)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
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

            {/* Item editor modal */}
            {modalOpen && collection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">
                                {editingItemId ? 'Edit Item' : 'New Item'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                            {collection.fields.map(field => (
                                <div key={field.name}>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                        <span className="ml-2 text-[10px] font-normal text-slate-400">{field.type}</span>
                                    </label>
                                    {renderField(field)}
                                </div>
                            ))}

                            {/* Slug (only for COLLECTION type) */}
                            {!isSingleton && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug <span className="font-normal text-slate-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={formSlug}
                                        onChange={e => setFormSlug(e.target.value)}
                                        placeholder="leave blank to auto-generate"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                            )}

                            {/* Published toggle */}
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-700">Published</span>
                                <div
                                    onClick={() => setFormPublished(p => !p)}
                                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${formPublished ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formPublished ? 'translate-x-5' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Media picker */}
            {mediaPickerField && (
                <MediaPickerModal
                    isOpen={!!mediaPickerField}
                    onSelect={(url: string) => {
                        setFormData(d => ({ ...d, [mediaPickerField]: url }));
                        setMediaPickerField(null);
                    }}
                    onClose={() => setMediaPickerField(null)}
                />
            )}

            {/* Delete confirmation */}
            <AlertDialog
                isOpen={!!deleteId}
                title="Delete Item"
                description="This item will be permanently deleted."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
