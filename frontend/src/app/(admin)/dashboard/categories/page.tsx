'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FolderIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    EyeIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';
import { apiRequest } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function CategoriesPage() {
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '', slug: '' });
    const [initialFormData, setInitialFormData] = useState({ name: '', description: '', slug: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: '' });
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/categories');
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const isDirty = () => {
        return JSON.stringify(formData) !== JSON.stringify(initialFormData);
    };

    const handleCloseAttempt = () => {
        if (isModalOpen && isDirty()) {
            setShowUnsavedAlert(true);
        } else {
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', slug: '' });
        setShowUnsavedAlert(false);
        setIsReadOnlyMode(false);
        setContentTheme(null);
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        const initial = { name: '', description: '', slug: '' };
        setFormData(initial);
        setInitialFormData(initial);
        setIsModalOpen(true);
    };

    const openEditModal = (cat: any) => {
        setEditingCategory(cat);
        const initial = { name: cat.name, description: cat.description || '', slug: cat.slug };
        setFormData(initial);
        setInitialFormData(initial);

        const activeTheme = settings['active_theme'];
        const catTheme = cat.theme;

        if (catTheme && activeTheme && catTheme !== activeTheme) {
            setIsReadOnlyMode(true);
            setContentTheme(catTheme);
        } else {
            setIsReadOnlyMode(false);
            setContentTheme(null);
        }

        setIsModalOpen(true);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const url = editingCategory
            ? `/categories/${editingCategory.id}`
            : '/categories';
        const method = editingCategory ? 'PATCH' : 'POST';

        try {
            await apiRequest(url, {
                method,
                body: formData,
                skipNotification: true
            });

            showToast(editingCategory ? 'Category updated successfully' : 'Category created successfully', 'success');
            closeModal();
            fetchCategories();
        } catch (error: any) {
            showToast(error.message || 'Failed to save category', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await apiRequest(`/categories/${confirmModal.id}`, {
                method: 'DELETE',
                skipNotification: true
            });
            showToast('Category deleted successfully', 'success');
            setConfirmModal({ isOpen: false, id: '' });
            fetchCategories();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete category', 'error');
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: '' })}
                onConfirm={handleDelete}
                title="Delete Category?"
                message="Are you sure you want to delete this blog category?"
                variant="danger"
            />

            <UnsavedChangesAlert
                isOpen={showUnsavedAlert}
                onSaveAndExit={() => handleSave()}
                onDiscardAndExit={closeModal}
                onCancel={() => setShowUnsavedAlert(false)}
            />

            {/* Modal */}
            {isModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCloseAttempt} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Modal header */}
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-blue-50 dark:from-blue-950/30 to-white dark:to-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                    <FolderIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                                        {editingCategory ? (isReadOnlyMode ? 'Viewing' : 'Editing') : 'Creating New'}
                                    </p>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        Blog Category
                                    </h2>
                                </div>
                                <button type="button" onClick={handleCloseAttempt} className="ml-auto p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 transition-all">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="px-8 py-6 space-y-5 dark:bg-slate-900">
                            {isReadOnlyMode && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <ExclamationCircleIcon className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                        This category belongs to the <span className="font-black capitalize">{contentTheme || 'another'}</span> theme. Editing is disabled.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Category Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        disabled={isReadOnlyMode}
                                        value={formData.name}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            name: e.target.value,
                                            slug: !editingCategory ? e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : formData.slug
                                        })}
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50"
                                        placeholder="e.g. Residential, Commercial..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Slug (URL)</label>
                                    <input
                                        type="text"
                                        disabled={isReadOnlyMode}
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50"
                                        placeholder="residential"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={formData.description}
                                        disabled={isReadOnlyMode}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none disabled:opacity-50"
                                        placeholder="Optional description..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={handleCloseAttempt} className="flex-1 py-3.5 font-bold text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors border border-slate-100 dark:border-white/[0.06]">
                                        {isReadOnlyMode ? 'Close' : 'Cancel'}
                                    </button>
                                    {!isReadOnlyMode && (
                                        <button type="submit" className="flex-2 flex-1 py-3.5 font-semibold text-sm rounded-2xl transition-all active:scale-95 border border-blue-600/60 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/[0.08]">
                                            {editingCategory ? 'Update Category' : 'Create Category'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <PageHeader
                title="Taxonomy &"
                accent="Categories"
                subtitle="Organize your blog content into logical groups"
                actions={
                    <button
                        onClick={openCreateModal}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0 disabled:opacity-50"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        New Category
                    </button>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Find category by name or slug…"
                }}
            />

            {/* Unified Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="px-10 py-12 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="content-skeleton h-16" />)}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={FolderIcon}
                            title="No Categories Found"
                            description="Organize your blog content into logical groups by creating your first category."
                            action={{
                                label: "Create your first category",
                                onClick: openCreateModal
                            }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Slug</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                                        Posts
                                    </th>
                                    <th className="pr-10 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {categories
                                    .filter(cat => 
                                        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((cat) => (
                                    <tr key={cat.id} className="group border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                    <FolderIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">{cat.theme || 'Default Theme'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                                {cat.slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{cat._count?.posts || 0}</span>
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-0.5">Articles</span>
                                            </div>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(cat)} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all shadow-sm">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                {(() => {
                                                    const activeTheme = settings['active_theme'];
                                                    const catTheme = cat.theme;
                                                    const isReadOnly = catTheme && activeTheme && catTheme !== activeTheme;
                                                    if (isReadOnly) return null;
                                                    return (
                                                        <button onClick={() => setConfirmModal({ isOpen: true, id: cat.id })} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/50 transition-all shadow-sm">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    );
                                                })()}
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
    );
}
