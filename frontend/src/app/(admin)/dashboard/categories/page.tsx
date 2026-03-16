'use client';

import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FolderIcon,
    ArrowPathIcon,
    SwatchIcon,
    DocumentTextIcon,
    EyeIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';
import { useModules } from '@/context/ModulesContext';
import { apiRequest } from '@/lib/api';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

type TabType = 'blog' | 'plots';

export default function CategoriesPage() {
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const { enabledModules } = useModules();
    const plotsEnabled = enabledModules.includes('plots');
    const [activeTab, setActiveTab] = useState<TabType>('blog');
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
    const [plotsAlias, setPlotsAlias] = useState('Plot');

    useEffect(() => {
        setMounted(true);
        // Load module aliases to rename the "Project Categories" tab per active theme
        apiRequest('/themes/active/module-aliases')
            .then((res: any) => {
                const raw = res?.moduleAliases?.plots || res?.moduleAliases?.['plot-categories'];
                if (raw) {
                    setPlotsAlias(raw.replace(/s$/i, ''));
                }
            })
            .catch(() => {});
        return () => setMounted(false);
    }, []);

    const { createPortal } = require('react-dom');

    const endpoints = {
        blog: '/categories',
        plots: '/plot-categories'
    };

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest(endpoints[activeTab]);
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
    }, [activeTab]);

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
        const baseEndpoint = endpoints[activeTab];
        const url = editingCategory
            ? `${baseEndpoint}/${editingCategory.id}`
            : baseEndpoint;
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
            const baseEndpoint = endpoints[activeTab];
            await apiRequest(`${baseEndpoint}/${confirmModal.id}`, {
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
                message={`Are you sure you want to delete this ${activeTab === 'blog' ? 'blog' : plotsAlias.toLowerCase()} category?`}
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
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCloseAttempt} />
                    <div className="relative bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-xl font-bold">
                            {editingCategory ? (isReadOnlyMode ? 'View' : 'Edit') : 'New'} {activeTab === 'blog' ? 'Blog' : plotsAlias} Category
                        </h2>

                        {isReadOnlyMode && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <ExclamationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-amber-900">Incompatible Theme Category</p>
                                    <p className="text-[10px] font-semibold text-amber-700 mt-0.5">
                                        This category is tied to the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme. Modifications are disabled.
                                    </p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
                                 <input
                                    type="text"
                                    required
                                    disabled={isReadOnlyMode}
                                    value={formData.name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        name: e.target.value,
                                        slug: !editingCategory ? e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : formData.slug
                                    })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slug</label>
                                 <input
                                    type="text"
                                    disabled={isReadOnlyMode}
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                 <textarea
                                    value={formData.description}
                                    disabled={isReadOnlyMode}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all resize-none disabled:opacity-50"
                                />
                            </div>
                             <div className="flex gap-3 pt-4">
                                <button type="button" onClick={handleCloseAttempt} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">{isReadOnlyMode ? 'Close View' : 'Cancel'}</button>
                                {!isReadOnlyMode && <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Save Category</button>}
                            </div>
                        </form>
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
                    New {activeTab === 'blog' ? 'Blog' : plotsAlias} Category
                </button>
            </div>

            {/* Tabs */}
            <div className="mx-2 p-1 bg-slate-100 rounded-xl inline-flex gap-1">
                <button
                    onClick={() => setActiveTab('blog')}
                    className={classNames(
                        "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        activeTab === 'blog'
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                >
                    <DocumentTextIcon className="h-4 w-4" />
                    Blog Categories
                </button>
                {plotsEnabled && (
                    <button
                        onClick={() => setActiveTab('plots')}
                        className={classNames(
                            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                            activeTab === 'plots'
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        <SwatchIcon className="h-4 w-4" />
                        {plotsAlias} Categories
                    </button>
                )}
            </div>

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
                    <div className="relative max-w-sm w-full group">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab} categories...`}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                        />
                    </div>
                    <button onClick={fetchCategories} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all">
                        <ArrowPathIcon className={classNames("h-5 w-5", isLoading ? "animate-spin" : "")} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slug</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    {activeTab === 'blog' ? 'Posts' : `${plotsAlias}s`}
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
                                                {cat._count?.posts || cat._count?.plots || 0}
                                            </span>
                                        </td>
                                        <td className="pr-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
