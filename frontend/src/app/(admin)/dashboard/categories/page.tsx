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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Modal header */}
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                                    <FolderIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                                        {editingCategory ? (isReadOnlyMode ? 'Viewing' : 'Editing') : 'Creating New'}
                                    </p>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                        Blog Category
                                    </h2>
                                </div>
                                <button type="button" onClick={handleCloseAttempt} className="ml-auto p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                        </div>

                        <div className="px-8 py-6 space-y-5">
                            {isReadOnlyMode && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                    <ExclamationCircleIcon className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs font-semibold text-amber-800">
                                        This category belongs to the <span className="font-black capitalize">{contentTheme || 'another'}</span> theme. Editing is disabled.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category Name <span className="text-red-500">*</span></label>
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
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all disabled:opacity-50"
                                        placeholder="e.g. Residential, Commercial..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug (URL)</label>
                                    <input
                                        type="text"
                                        disabled={isReadOnlyMode}
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 focus:bg-white transition-all disabled:opacity-50"
                                        placeholder="residential"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={formData.description}
                                        disabled={isReadOnlyMode}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all resize-none disabled:opacity-50"
                                        placeholder="Optional description..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={handleCloseAttempt} className="flex-1 py-3.5 font-bold text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200">
                                        {isReadOnlyMode ? 'Close' : 'Cancel'}
                                    </button>
                                    {!isReadOnlyMode && (
                                        <button type="submit" className="flex-2 flex-1 py-3.5 font-bold text-sm text-white rounded-2xl transition-all shadow-lg active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20">
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

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Taxonomy & <span className="text-blue-600 font-bold">Categories</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Organize your content into logical groups.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 leading-none"
                >
                    <PlusIcon className="h-4 w-4" strokeWidth={3} />
                    New Blog Category
                </button>
            </div>

            {/* Tabs */}
            <div className="mx-2 p-1 bg-slate-100 rounded-xl inline-flex gap-1">
                <button
                    className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 bg-white text-slate-900 shadow-sm"
                >
                    <DocumentTextIcon className="h-4 w-4" />
                    Blog Categories
                </button>
            </div>

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
                    <div className="relative max-w-sm w-full group">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                        />
                    </div>
                    <button onClick={fetchCategories} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all">
                        <ArrowPathIcon className={classNames("h-5 w-5", isLoading ? "animate-spin" : "")} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slug</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    Posts
                                </th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-6"><div className="h-10 bg-slate-50 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <FolderIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No categories found.</p>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="pl-8 py-5">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-none">{cat.name}</p>
                                                {cat.description && <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate max-w-xs">{cat.description}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-xs font-mono text-slate-400">
                                            /{cat.slug}
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg font-mono">
                                                {cat._count?.posts || 0}
                                            </span>
                                        </td>
                                        <td className="pr-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                 <button onClick={() => openEditModal(cat)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                                    {(() => {
                                                        const activeTheme = settings['active_theme'];
                                                        const catTheme = cat.theme;
                                                        const isReadOnly = catTheme && activeTheme && catTheme !== activeTheme;
                                                        return isReadOnly ? <EyeIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />;
                                                    })()}
                                                </button>
                                                {(() => {
                                                    const activeTheme = settings['active_theme'];
                                                    const catTheme = cat.theme;
                                                    const isReadOnly = catTheme && activeTheme && catTheme !== activeTheme;
                                                    if (isReadOnly) return null;
                                                    return (
                                                        <button onClick={() => setConfirmModal({ isOpen: true, id: cat.id })} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
