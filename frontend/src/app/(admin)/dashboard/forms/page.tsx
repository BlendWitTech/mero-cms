'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ClipboardDocumentListIcon,
    XMarkIcon,
    ChevronRightIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [navigatingId, setNavigatingId] = useState<string | null>(null);

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
            settings: (f.settings as typeof emptyForm.settings) || emptyForm.settings,
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
        setIsDeleting(true);
        try {
            await apiRequest(`/forms/${deleteId}`, { method: 'DELETE' });
            showToast('Form deleted', 'success');
            setDeleteId(null);
            fetchForms();
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
                accent="Forms" 
                subtitle="Build custom forms and manage user submissions"
                actions={
                    <button
                        onClick={openNew}
                        className="btn-primary px-6 py-3 text-sm"
                        disabled={isLoading}
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        New Form
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Find form by name or slug…"
                }}
            />

            {/* Unified Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Forms...</p>
                    </div>
                ) : forms.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={ClipboardDocumentListIcon}
                            title="No Forms Found"
                            description="Build custom forms to collect feedback, leads, or any other user data."
                            action={{
                                label: "Create your first form",
                                onClick: openNew
                            }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                        <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Form Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Structure</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Engagement</th>
                                        <th className="pr-10 py-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {forms
                                        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(f => (
                                        <tr key={f.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="pl-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                        <ClipboardDocumentListIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/forms/${f.id}`)}>{f.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">/{f.slug}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                                    {f.fields?.length || 0} Defined Fields
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{f._count?.submissions || 0}</span>
                                                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">Submissions</span>
                                                </div>
                                            </td>
                                            <td className="pr-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => router.push(`/dashboard/forms/${f.id}`)} className="btn-ghost p-2 text-blue-600" title="View submissions">
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => openEdit(f)} className="btn-ghost p-2 text-blue-600" title="Edit form">
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteId(f.id)} className="btn-ghost p-2 text-red-600" title="Delete form">
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

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200 overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-blue-50 dark:from-blue-950/30 to-white dark:to-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                    <ClipboardDocumentListIcon className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                                    {editingId ? 'Edit Form' : 'New Form'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="btn-ghost p-2 text-slate-400">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
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
                                        placeholder="e.g. Contact Form"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Slug *</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        placeholder="e.g. contact-form"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

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

                            {/* Fields */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Fields</label>
                                    <button onClick={addField} className="btn-ghost flex items-center gap-1 text-xs text-blue-600 h-auto py-1 px-2">
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
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={e => updateField(idx, { placeholder: e.target.value })}
                                                    placeholder="Placeholder (optional)"
                                                    className="col-span-2 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 bg-white dark:bg-white/[0.02] dark:text-white transition-all"
                                                />
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
                                                        className="rounded"
                                                    />
                                                    Req
                                                </label>
                                                <button
                                                    onClick={() => removeField(idx)}
                                                    disabled={form.fields.length === 1}
                                                    className="btn-ghost p-1 text-slate-300 hover:text-red-500"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 space-y-3">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Settings</p>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Success Message</label>
                                    <input
                                        type="text"
                                        value={form.settings?.successMessage || ''}
                                        onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, successMessage: e.target.value } }))}
                                        placeholder="Thank you for your submission!"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1.5">Notify Email <span className="font-normal">(optional)</span></label>
                                    <input
                                        type="email"
                                        value={form.settings?.notifyEmail || ''}
                                        onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, notifyEmail: e.target.value } }))}
                                        placeholder="admin@example.com"
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                            <button onClick={closeModal} className="btn-ghost px-5 py-2.5 text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn-primary px-6 py-2.5 text-sm"
                            >
                                {isSaving && <LoadingSpinner size="sm" variant="white" />}
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
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
