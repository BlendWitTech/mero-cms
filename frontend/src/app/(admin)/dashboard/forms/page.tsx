'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ClipboardDocumentListIcon,
    XMarkIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';

type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';

interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: string; // comma-separated for select
}

interface Form {
    id: string;
    name: string;
    slug: string;
    description?: string;
    fields: FormField[];
    settings?: Record<string, any>;
    createdAt: string;
    _count?: { submissions: number };
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' },
];

const emptyField = (): FormField => ({ name: '', label: '', type: 'text', required: false, placeholder: '' });

function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function FormsPage() {
    const router = useRouter();
    const { showToast } = useNotification();

    const [forms, setForms] = useState<Form[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const emptyForm = {
        name: '', slug: '', description: '',
        fields: [emptyField()],
        settings: { successMessage: 'Thank you for your submission!', notifyEmail: '' },
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchForms(); }, []);

    async function fetchForms() {
        setIsLoading(true);
        try {
            const data = await apiRequest('/forms');
            setForms(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load forms', 'error');
        } finally {
            setIsLoading(false);
        }
    }

    function openNew() {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    }

    function openEdit(f: Form) {
        setEditingId(f.id);
        setForm({
            name: f.name,
            slug: f.slug,
            description: f.description || '',
            fields: f.fields?.length ? f.fields : [emptyField()],
            settings: f.settings || emptyForm.settings,
        });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingId(null);
    }

    function handleNameChange(name: string) {
        setForm(f => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }));
    }

    function addField() {
        setForm(f => ({ ...f, fields: [...f.fields, emptyField()] }));
    }

    function removeField(idx: number) {
        setForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));
    }

    function updateField(idx: number, patch: Partial<FormField>) {
        setForm(f => {
            const fields = f.fields.map((field, i) => {
                if (i !== idx) return field;
                const updated = { ...field, ...patch };
                if (patch.label !== undefined && !field.name) {
                    updated.name = slugify(patch.label).replace(/-/g, '_');
                }
                return updated;
            });
            return { ...f, fields };
        });
    }

    async function handleSave() {
        if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
        if (!form.slug.trim()) { showToast('Slug is required', 'error'); return; }
        const validFields = form.fields.filter(f => f.name && f.label);
        if (validFields.length === 0) { showToast('Add at least one field', 'error'); return; }

        setIsSaving(true);
        try {
            const payload = { ...form, fields: validFields };
            if (editingId) {
                await apiRequest(`/forms/${editingId}`, { method: 'PATCH', body: payload });
                showToast('Form updated', 'success');
            } else {
                await apiRequest('/forms', { method: 'POST', body: payload });
                showToast('Form created', 'success');
            }
            closeModal();
            fetchForms();
        } catch (err: any) {
            showToast(err?.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/forms/${deleteId}`, { method: 'DELETE' });
            showToast('Form deleted', 'success');
            setDeleteId(null);
            fetchForms();
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
                        <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Forms</h1>
                        <p className="text-sm text-slate-500">Build forms and manage submissions</p>
                    </div>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Form
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />)}
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <ClipboardDocumentListIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No forms yet</p>
                    <p className="text-sm text-slate-400 mb-4">Create a form to collect submissions from your website</p>
                    <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                        Create your first form
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {forms.map(f => (
                        <div
                            key={f.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all group"
                        >
                            <button
                                className="flex items-center gap-4 flex-1 text-left"
                                onClick={() => router.push(`/dashboard/forms/${f.id}`)}
                            >
                                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                    <ClipboardDocumentListIcon className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span>/{f.slug}</span>
                                        <span>{f.fields?.length ?? 0} fields</span>
                                        <span className="font-semibold text-slate-600">{f._count?.submissions ?? 0} submissions</span>
                                        {f.description && <span className="truncate max-w-xs">{f.description}</span>}
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors mr-2" />
                            </button>
                            <div className="flex items-center gap-1 ml-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openEdit(f); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteId(f.id); }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-black text-slate-900">
                                {editingId ? 'Edit Form' : 'New Form'}
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
                                        placeholder="e.g. Contact Form"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug *</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        placeholder="e.g. contact-form"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                            </div>

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

                            {/* Fields */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700">Fields</label>
                                    <button onClick={addField} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold">
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
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={e => updateField(idx, { placeholder: e.target.value })}
                                                    placeholder="Placeholder (optional)"
                                                    className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                                                />
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
                                                    disabled={form.fields.length === 1}
                                                    className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="border-t border-slate-100 pt-4 space-y-3">
                                <p className="text-xs font-bold text-slate-700">Settings</p>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Success Message</label>
                                    <input
                                        type="text"
                                        value={form.settings?.successMessage || ''}
                                        onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, successMessage: e.target.value } }))}
                                        placeholder="Thank you for your submission!"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notify Email <span className="font-normal">(optional)</span></label>
                                    <input
                                        type="email"
                                        value={form.settings?.notifyEmail || ''}
                                        onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, notifyEmail: e.target.value } }))}
                                        placeholder="admin@example.com"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    />
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
                                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Form'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                title="Delete Form"
                description="This will permanently delete the form and all its submissions."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
