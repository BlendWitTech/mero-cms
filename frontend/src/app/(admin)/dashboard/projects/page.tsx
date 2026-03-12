'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    CalendarIcon,
    CubeIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import MediaLibrary from '@/components/media/MediaLibrary';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import { useNotification } from '@/context/NotificationContext';
import { apiRequest } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

import { useForm } from '@/context/FormContext';
import PermissionGuard from '@/components/auth/PermissionGuard';

function ProjectsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setIsDirty } = useForm();

    // Derived state from URL
    const view = searchParams.get('action') === 'new' || searchParams.get('action') === 'edit' ? 'editor' : 'list';
    const actionId = searchParams.get('id');

    const [projects, setProjects] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canManageContent, setCanManageContent] = useState(false);

    const defaultFormData = {
        title: '',
        slug: '',
        description: '',
        coverImage: '',
        bannerImage: '',
        heroVideo: '',
        gallery: [],
        model3dUrl: '',
        status: 'COMPLETED',
        categoryId: '',
        client: '',
        completionDate: '',
        location: '',
        featured: false,
        seoMeta: { title: '', description: '', keywords: '' }
    };

    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [showExitAlert, setShowExitAlert] = useState(false); // Re-introduced for local back button
    const [isSaving, setIsSaving] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'cover' | 'gallery' | 'banner' | 'heroVideo' | 'model3d'>('cover');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { showToast } = useNotification();

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Sync isDirty with FormContext
    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    useEffect(() => {
        // Handle URL-based initialization
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (!isLoading) {
            if (action === 'new') {
                const initial = { ...defaultFormData, categoryId: categories[0]?.id || '' };
                setFormData(initial);
                setInitialState(initial);
                setCurrentProjectId(null);
            } else if (action === 'edit' && id) {
                const project = projects.find(p => p.id === id);
                if (project) {
                    const data = {
                        title: project.title,
                        slug: project.slug,
                        description: project.description,
                        coverImage: project.coverImage || '',
                        bannerImage: project.bannerImage || '',
                        heroVideo: project.heroVideo || '',
                        gallery: project.gallery || [],
                        model3dUrl: project.model3dUrl || '',
                        status: project.status,
                        categoryId: project.category?.id || '',
                        client: project.client || '',
                        completionDate: project.completionDate || '',
                        location: project.location || '',
                        featured: project.featured,
                        seoMeta: {
                            title: project.seoMeta?.title || '',
                            description: project.seoMeta?.description || '',
                            keywords: project.seoMeta?.keywords?.join(', ') || ''
                        }
                    };
                    setFormData(data);
                    setInitialState(data);
                    setCurrentProjectId(id);
                }
            }
        }
    }, [searchParams, isLoading, projects, categories]); // Re-run when projects load

    const fetchInitialData = async () => {
        try {
            const [projectsData, categoriesData] = await Promise.all([
                apiRequest('/projects'),
                apiRequest('/project-categories')
            ]);

            setProjects(Array.isArray(projectsData) ? projectsData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setCanManageContent(true);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        router.push('/dashboard/projects?action=new');
    };

    const handleEdit = (project: any) => {
        router.push(`/dashboard/projects?action=edit&id=${project.id}`);
    };

    const handleBackClick = () => {
        // Explicit back button click handler
        if (JSON.stringify(formData) !== JSON.stringify(initialState)) {
            setShowExitAlert(true);
        } else {
            router.back();
        }
    };

    const confirmExit = () => {
        setShowExitAlert(false);
        setIsDirty(false);
        router.back();
    };

    const handleSave = async () => {
        setIsSaving(true);
        const url = currentProjectId
            ? `/projects/${currentProjectId}`
            : '/projects';
        const method = currentProjectId ? 'PATCH' : 'POST';

        try {
            await apiRequest(url, {
                method,
                body: formData,
                skipNotification: true
            });

            showToast('Project saved successfully!', 'success');
            setIsDirty(false); // Clear dirty state
            router.back();
            fetchInitialData();
            return true;
        } catch (error: any) {
            showToast(error.message || 'Failed to save project.', 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; projectId: string | null }>({
        isOpen: false,
        projectId: null
    });

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, projectId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.projectId) return;

        try {
            await apiRequest(`/projects/${deleteConfirmation.projectId}`, {
                method: 'DELETE',
                skipNotification: true
            });
            showToast('Project deleted successfully!', 'success');
            fetchInitialData();
            setDeleteConfirmation({ isOpen: false, projectId: null });
        } catch (error: any) {
            showToast(error.message || 'Failed to delete project.', 'error');
            // Keep dialog open or close it? usually close on error or show error.
            // Let's close it to avoid stuck state, toast explains error.
            setDeleteConfirmation({ isOpen: false, projectId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, projectId: null });
    };

    const removeGalleryImage = (index: number) => {
        setFormData({
            ...formData,
            gallery: formData.gallery.filter((_: any, i: number) => i !== index)
        });
    };

    useEffect(() => {
        // No-op for view change side effects if any, or just clean up
    }, [view]);

    if (view === 'editor') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <UnsavedChangesAlert
                    isOpen={showExitAlert}
                    title="Unsaved Changes"
                    description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
                    confirmLabel="Save & Exit"
                    secondaryLabel="Discard & Leave"
                    cancelLabel="Keep Editing"
                    onSaveAndExit={() => handleSave()}
                    onDiscardAndExit={confirmExit}
                    onCancel={() => setShowExitAlert(false)}
                    variant="success"
                />

                {/* Editor Header */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm sticky top-4 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackClick} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentProjectId ? 'Editing Project' : 'New Project'}</p>
                            <h1 className="text-xl font-bold text-slate-900 font-display">{formData.title || 'Untitled Project'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.featured}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-xs font-bold text-slate-600">Featured</span>
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="bg-slate-50 border-none text-xs font-bold text-slate-600 py-2.5 px-4 rounded-xl focus:ring-0 cursor-pointer"
                        >
                            <option value="COMPLETED">Completed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CONCEPT">Concept</option>
                        </select>
                        <button onClick={() => handleSave()} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                            <CloudArrowUpIcon className="h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title & Slug */}
                        <div className="bg-white rounded-2xl p-10 border border-slate-200/60 shadow-xl shadow-slate-200/20 space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -z-10 group-hover:bg-blue-100/30 transition-colors duration-1000"></div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Project Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter project name..."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                                    className="w-full text-4xl lg:text-5xl font-bold text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 font-display bg-transparent"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Slug</span>
                                    <span className="text-slate-300 font-mono text-xs">/projects/</span>
                                    <input
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="bg-transparent border-none focus:ring-0 p-0 text-blue-600 font-bold text-xs min-w-[200px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Description</h3>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={8}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none"
                                placeholder="Describe the project vision, challenges, and solutions..."
                            />
                        </div>

                        {/* Gallery */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Gallery</h3>
                                <button
                                    onClick={() => {
                                        setMediaTarget('gallery');
                                        setIsMediaOpen(true);
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                >
                                    + Add Images
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {formData.gallery.map((url: string, index: number) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                        <img src={url} className="w-full h-full object-cover" alt="" />
                                        <button
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Cover Image */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cover Image</h3>
                                {formData.coverImage && (
                                    <button onClick={() => setFormData({ ...formData, coverImage: '' })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                )}
                            </div>
                            <div
                                onClick={() => {
                                    setMediaTarget('cover');
                                    setIsMediaOpen(true);
                                }}
                                className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer group overflow-hidden relative"
                            >
                                {formData.coverImage ? (
                                    <img src={formData.coverImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <>
                                        <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select from Library</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Banner Image */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Banner Image</h3>
                                {formData.bannerImage && (
                                    <button onClick={() => setFormData({ ...formData, bannerImage: '' })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                )}
                            </div>
                            <div
                                onClick={() => {
                                    setMediaTarget('banner');
                                    setIsMediaOpen(true);
                                }}
                                className="aspect-[21/9] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer group overflow-hidden relative"
                            >
                                {formData.bannerImage ? (
                                    <img src={formData.bannerImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <>
                                        <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select Banner</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hero Video / Media */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Hero Video (35% Slot)</h3>
                                {formData.heroVideo && (
                                    <button onClick={() => setFormData({ ...formData, heroVideo: '' })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                )}
                            </div>
                            <div
                                onClick={() => {
                                    setMediaTarget('heroVideo');
                                    setIsMediaOpen(true);
                                }}
                                className="aspect-[16/9] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer group overflow-hidden relative"
                            >
                                {formData.heroVideo ? (
                                    <video src={formData.heroVideo} className="w-full h-full object-cover" controls />
                                ) : (
                                    <>
                                        <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select Video</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <MediaLibrary
                            isOpen={isMediaOpen}
                            onClose={() => setIsMediaOpen(false)}
                            onSelect={(url) => {
                                if (mediaTarget === 'cover') {
                                    setFormData({ ...formData, coverImage: url });
                                } else if (mediaTarget === 'banner') {
                                    setFormData({ ...formData, bannerImage: url });
                                } else if (mediaTarget === 'heroVideo') {
                                    setFormData({ ...formData, heroVideo: url });
                                } else if (mediaTarget === 'model3d') {
                                    setFormData({ ...formData, model3dUrl: url });
                                } else {
                                    setFormData({ ...formData, gallery: [...formData.gallery, url] });
                                }
                                setIsMediaOpen(false);
                            }}
                        />

                        {/* Category */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Category</h3>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                            >
                                <option value="" disabled>Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400">Manage categories in Taxonomy & Categories</p>
                        </div>

                        {/* 3D Model */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <CubeIcon className="h-4 w-4" />
                                    3D Model URL
                                </span>
                                {formData.model3dUrl && (
                                    <button onClick={() => setFormData({ ...formData, model3dUrl: '' })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                )}
                            </h3>
                            <div
                                onClick={() => {
                                    setMediaTarget('model3d');
                                    setIsMediaOpen(true);
                                }}
                                className="h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100/50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer group overflow-hidden relative"
                            >
                                {formData.model3dUrl ? (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <CubeIcon className="h-6 w-6" />
                                        <span className="text-xs font-bold truncate max-w-[200px]">{formData.model3dUrl.split('/').pop()}</span>
                                    </div>
                                ) : (
                                    <>
                                        <CubeIcon className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select 3D Model</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Client & Location */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                                <input
                                    type="text"
                                    value={formData.client}
                                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 mt-2"
                                    placeholder="Client or organization name"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 mt-2"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        {/* Completion Date */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Completion Date</h3>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={formData.completionDate ? new Date(formData.completionDate).toISOString().slice(0, 10) : ''}
                                    onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                />
                            </div>
                        </div>

                        {/* SEO Metadata */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SEO Metadata</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Title</label>
                                    <input
                                        type="text"
                                        value={formData.seoMeta.title}
                                        onChange={(e) => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, title: e.target.value } })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                        placeholder="Title for search engines"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">{formData.seoMeta.title.length}/60</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Description</label>
                                    <textarea
                                        value={formData.seoMeta.description}
                                        onChange={(e) => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, description: e.target.value } })}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none"
                                        placeholder="Brief description for search results"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">{formData.seoMeta.description.length}/160</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Projects <span className="text-blue-600 font-bold">Portfolio</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Manage your architectural projects and showcase your work.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PermissionGuard permission="content_create">
                        <button onClick={handleCreate} className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 leading-none">
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            New Project
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Projects List */}
            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/10">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="flex-1 md:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 md:w-40 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CONCEPT">Concept</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : projects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <CubeIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No projects found. Create your first one!</p>
                                    </td>
                                </tr>
                            ) : (
                                projects
                                    .filter(project => {
                                        const matchesCategory = !categoryFilter || project.category?.slug === categoryFilter;
                                        const matchesStatus = !statusFilter || project.status === statusFilter;
                                        return matchesCategory && matchesStatus;
                                    })
                                    .map((project) => (
                                        <tr key={project.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="pl-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                                                        {project.coverImage ? (
                                                            <img src={project.coverImage} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                                <CubeIcon className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{project.title}</p>
                                                        <p className="text-[10px] font-semibold text-slate-500 mt-1">{project.client || 'No client'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset bg-blue-50 text-blue-600 ring-blue-600/20">
                                                    {project.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${(()=>{const s=(project.status||'').toLowerCase();if(s==='completed'||s==='available')return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';if(s==='in_progress'||s==='limited')return 'bg-amber-50 text-amber-700 ring-amber-600/20';if(s==='sold')return 'bg-slate-100 text-slate-500 ring-slate-400/20';if(s==='concept')return 'bg-purple-50 text-purple-600 ring-purple-600/20';return 'bg-blue-50 text-blue-700 ring-blue-600/20';})()
                                                    }`}>
                                                    {(project.status||'').replace(/_/g,' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-5 text-xs font-semibold text-slate-500">
                                                {project.completionDate ? new Date(project.completionDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="pr-8 py-5 text-right">
                                                {canManageContent && (
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(project)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(project.id)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            <AlertDialog
                isOpen={deleteConfirmation.isOpen}
                title="Delete Project"
                description="Are you sure you want to delete this project? This action cannot be undone."
                confirmLabel="Delete Project"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div >
    );
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ProjectsPageContent />
        </Suspense>
    );
}
