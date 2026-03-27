'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    MapPinIcon,
    ExclamationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import MediaPickerModal from '@/components/ui/MediaPickerModal';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import { useNotification } from '@/context/NotificationContext';
import { useForm as useFormContext } from '@/context/FormContext';
import { apiRequest } from '@/lib/api';
import ThemeCompatibilityBanner, { useThemeCompatibility } from '@/components/ui/ThemeCompatibilityBanner';
import PostEditor from '@/components/blog/PostEditor';
import PermissionGuard from '@/components/auth/PermissionGuard';

const STATUS_OPTIONS = ['available', 'limited', 'sold', 'hidden'];

function PlotsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showToast } = useNotification();
    const { settings } = useSettings();
    const { isDirty, setIsDirty } = useFormContext();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);
    const { isSupported } = useThemeCompatibility('plots');

    const action = searchParams.get('action');
    const actionId = searchParams.get('id');
    const view = action === 'new' || (action === 'edit' && actionId) ? 'editor' : 'list';

    const [plots, setPlots] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canManageContent, setCanManageContent] = useState(false);

    const defaultFormData = {
        title: '', slug: '', description: '', content: '',
        coverImage: '', gallery: [] as string[],
        status: 'available', categoryId: '',
        location: '', priceFrom: '', priceTo: '',
        areaFrom: '', areaTo: '',
        facing: '', roadAccess: '',
        featured: false,
        seo: { title: '', description: '', keywords: [] as string[], ogImage: '', ogImages: [] as string[] },
    };

    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPlotId, setCurrentPlotId] = useState<string | null>(null);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; plotId: string | null }>({ isOpen: false, plotId: null });
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'cover' | 'gallery'>('cover');

    useEffect(() => { fetchInitialData(); }, []);

    useEffect(() => {
        if (view === 'editor' && action === 'edit' && actionId) {
            const plot = plots.find(p => p.id === actionId);
            if (plot) {
                populateForm(plot);
            } else if (!isLoading && plots.length > 0) {
                fetchPlot(actionId);
            }
        } else if (view === 'editor' && action === 'new') {
            if (currentPlotId !== null) resetForm();
        }
    }, [view, action, actionId, plots, isLoading]);

    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    const fetchInitialData = async () => {
        try {
            const [plotsRes, catsRes, profile] = await Promise.all([
                apiRequest('/plots'),
                apiRequest('/plot-categories').catch(() => []),
                apiRequest('/auth/profile').catch(() => null),
            ]);
            setPlots(Array.isArray(plotsRes) ? plotsRes : []);
            setCategories(Array.isArray(catsRes) ? catsRes : []);
            if (profile?.role?.permissions?.manage_content || profile?.role?.name === 'Super Admin' || profile?.role?.name === 'Admin') {
                setCanManageContent(true);
            }
        } catch (e: any) {
            showToast(e.message || 'Failed to load plots', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPlot = async (id: string) => {
        try {
            const plot = await apiRequest(`/plots/${id}`);
            if (plot) populateForm(plot);
        } catch {
            showToast('Failed to load plot', 'error');
            router.push('/dashboard/plots');
        }
    };

    const populateForm = (plot: any) => {
        const activeTheme = settings['active_theme'];
        const plotTheme = plot.theme;
        if (plotTheme && activeTheme && plotTheme !== activeTheme) {
            setIsReadOnly(true);
            setContentTheme(plotTheme);
        } else {
            setIsReadOnly(false);
            setContentTheme(null);
        }
        const data = {
            title: plot.title || '',
            slug: plot.slug || '',
            description: plot.description || '',
            content: plot.content || '',
            coverImage: plot.coverImage || '',
            gallery: plot.gallery || [],
            status: plot.status || 'available',
            categoryId: plot.categoryId || '',
            location: plot.location || '',
            priceFrom: plot.priceFrom || '',
            priceTo: plot.priceTo || '',
            areaFrom: plot.areaFrom || '',
            areaTo: plot.areaTo || '',
            facing: plot.facing || '',
            roadAccess: plot.roadAccess || '',
            featured: plot.featured || false,
            seo: { title: plot.seo?.title || '', description: plot.seo?.description || '', keywords: plot.seo?.keywords || [], ogImage: plot.seo?.ogImage || '', ogImages: plot.seo?.ogImages || [] },
        };
        setFormData(data);
        setInitialState(data);
        setCurrentPlotId(plot.id);
    };

    const resetForm = () => {
        setIsReadOnly(false);
        setContentTheme(null);
        setFormData({ ...defaultFormData });
        setInitialState({ ...defaultFormData });
        setCurrentPlotId(null);
    };

    const handleCreate = () => {
        resetForm();
        router.push('/dashboard/plots?action=new');
    };

    const handleEdit = (plot: any) => {
        populateForm(plot);
        router.push(`/dashboard/plots?action=edit&id=${plot.id}`);
    };

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedAlert(true);
        } else {
            router.push('/dashboard/plots');
        }
    };

    const handleField = (key: string, value: any) => {
        setFormData((prev: any) => {
            const updated = { ...prev, [key]: value };
            if (key === 'title' && !currentPlotId) {
                updated.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            }
            return updated;
        });
    };

    const handleSave = async () => {
        if (!formData.title.trim()) { showToast('Title is required', 'error'); return; }
        setIsSaving(true);
        try {
            const seo = (formData.seo?.title || formData.seo?.description) ? formData.seo : undefined;
            const payload = { ...formData, categoryId: formData.categoryId || null, seo };
            if (currentPlotId) {
                await apiRequest(`/plots/${currentPlotId}`, { method: 'PATCH', body: payload });
                showToast('Plot updated', 'success');
            } else {
                await apiRequest('/plots', { method: 'POST', body: payload });
                showToast('Plot created', 'success');
            }
            setIsDirty(false);
            setInitialState(formData);
            fetchInitialData();
            router.push('/dashboard/plots');
        } catch (e: any) {
            showToast(e.message || 'Save failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.plotId) return;
        try {
            await apiRequest(`/plots/${deleteConfirmation.plotId}`, { method: 'DELETE' });
            showToast('Plot deleted', 'success');
            fetchInitialData();
        } catch (e: any) {
            showToast(e.message || 'Delete failed', 'error');
        }
        setDeleteConfirmation({ isOpen: false, plotId: null });
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            available: 'bg-green-100 text-green-700',
            limited: 'bg-yellow-100 text-yellow-700',
            sold: 'bg-red-100 text-red-700',
            hidden: 'bg-gray-100 text-gray-500',
        };
        return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-500';
    };

    if (view === 'editor') {
        return (
            <PermissionGuard permission="content_create">
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <UnsavedChangesAlert
                        isOpen={showUnsavedAlert}
                        onSaveAndExit={async () => { await handleSave(); }}
                        onDiscardAndExit={() => {
                            setIsDirty(false);
                            router.push('/dashboard/plots');
                        }}
                        onCancel={() => setShowUnsavedAlert(false)}
                        isSaving={isSaving}
                        variant="success"
                    />

                    {isReadOnly && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-amber-900">Incompatible Theme Content</h3>
                                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                                    This plot was added for the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme.
                                    You can view its details, but to make changes, please switch the active theme in Settings.
                                </p>
                            </div>
                        </div>
                    )}

                    <ThemeCompatibilityBanner moduleName="plots" />

                    {/* Sticky header toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBackClick} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentPlotId ? 'Editing Plot' : 'New Plot'}</p>
                                <h1 className="text-xl font-bold text-slate-900 font-display">{formData.title || 'Untitled Plot'}</h1>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isReadOnly || !isSupported}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CloudArrowUpIcon className="h-4 w-4" />
                            {!isSupported ? 'Unsupported by Theme' : isSaving ? 'Saving...' : 'Save Plot'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Main fields */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Core info */}
                            <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-xl space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Plot Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        disabled={isReadOnly}
                                        onChange={e => handleField('title', e.target.value)}
                                        placeholder="e.g. Shankhapur Green Valley"
                                        className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 font-display bg-transparent mt-2 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        disabled={isReadOnly}
                                        onChange={e => handleField('slug', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/10 mt-2 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Short Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        disabled={isReadOnly}
                                        onChange={e => handleField('description', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 resize-y mt-2 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Pricing & Area */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pricing & Size</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'priceFrom', label: 'Price From (NPR)' },
                                        { key: 'priceTo', label: 'Price To (NPR)' },
                                        { key: 'areaFrom', label: 'Area From (e.g. 3 Anna)' },
                                        { key: 'areaTo', label: 'Area To (e.g. 16 Anna)' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                                            <input
                                                type="text"
                                                value={formData[key]}
                                                disabled={isReadOnly}
                                                onChange={e => handleField(key, e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 mt-1 disabled:opacity-50"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Location Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'location', label: 'Location / Area' },
                                        { key: 'facing', label: 'Facing Direction' },
                                        { key: 'roadAccess', label: 'Road Access' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                                            <input
                                                type="text"
                                                value={formData[key]}
                                                disabled={isReadOnly}
                                                onChange={e => handleField(key, e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 mt-1 disabled:opacity-50"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Full Content */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Content</h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <PostEditor
                                        content={formData.content}
                                        onChange={(html: string) => handleField('content', html)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Publish */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Publish</h3>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                                    <select
                                        value={formData.status}
                                        disabled={isReadOnly}
                                        onChange={e => handleField('status', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 mt-1 disabled:opacity-50"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        disabled={isReadOnly}
                                        onChange={e => handleField('featured', e.target.checked)}
                                        className="w-4 h-4 rounded accent-emerald-600"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Featured on homepage</span>
                                </label>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                                    <select
                                        value={formData.categoryId}
                                        disabled={isReadOnly}
                                        onChange={e => handleField('categoryId', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 mt-1 disabled:opacity-50"
                                    >
                                        <option value="">— None —</option>
                                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cover Image</h3>
                                    {formData.coverImage && !isReadOnly && (
                                        <button onClick={() => handleField('coverImage', '')} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                    )}
                                </div>
                                <div
                                    onClick={() => { if (!isReadOnly) { setMediaTarget('cover'); setIsMediaOpen(true); } }}
                                    className={`aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 ${!isReadOnly ? 'hover:bg-slate-100/50 hover:border-emerald-400 hover:text-emerald-500 cursor-pointer' : 'cursor-not-allowed'} transition-all group overflow-hidden relative`}
                                >
                                    {formData.coverImage ? (
                                        <img
                                            src={formData.coverImage.startsWith('http') ? formData.coverImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${formData.coverImage}`}
                                            alt="cover"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold">Select from Library</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Gallery */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Gallery</h3>
                                {formData.gallery && formData.gallery.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {formData.gallery.map((url: string, idx: number) => {
                                            const src = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`;
                                            return (
                                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => setFormData((prev: any) => ({ ...prev, gallery: prev.gallery.filter((_: string, i: number) => i !== idx) }))}
                                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <XMarkIcon className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {!isReadOnly && (
                                    <button
                                        onClick={() => { setMediaTarget('gallery'); setIsMediaOpen(true); }}
                                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-500 transition-all"
                                    >
                                        <PhotoIcon className="w-4 h-4" /> Add Image
                                    </button>
                                )}
                            </div>

                            {/* SEO */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SEO</h3>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta Title</label>
                                        <span className={`text-xs ${(formData.seo?.title?.length || 0) > 60 ? 'text-red-500' : 'text-slate-400'}`}>{formData.seo?.title?.length || 0}/60</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.seo?.title || ''}
                                        disabled={isReadOnly}
                                        onChange={e => setFormData((prev: any) => ({ ...prev, seo: { ...prev.seo, title: e.target.value } }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 disabled:opacity-50"
                                        placeholder="SEO page title..."
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta Description</label>
                                        <span className={`text-xs ${(formData.seo?.description?.length || 0) > 160 ? 'text-red-500' : 'text-slate-400'}`}>{formData.seo?.description?.length || 0}/160</span>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={formData.seo?.description || ''}
                                        disabled={isReadOnly}
                                        onChange={e => setFormData((prev: any) => ({ ...prev, seo: { ...prev.seo, description: e.target.value } }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 resize-none disabled:opacity-50"
                                        placeholder="Brief description for search engines..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Keywords</label>
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {(formData.seo?.keywords || []).map((kw: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                                                {kw}
                                                <button type="button" disabled={isReadOnly} onClick={() => setFormData((prev: any) => ({ ...prev, seo: { ...prev.seo, keywords: prev.seo.keywords.filter((_: string, j: number) => j !== i) } }))} className="hover:text-red-500 disabled:opacity-50">×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        disabled={isReadOnly}
                                        placeholder="Type keyword and press Enter…"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 disabled:opacity-50"
                                        onKeyDown={(e) => {
                                            if ((e.key === 'Enter' || e.key === ',') && (e.target as HTMLInputElement).value.trim()) {
                                                e.preventDefault();
                                                const kw = (e.target as HTMLInputElement).value.trim();
                                                setFormData((prev: any) => ({ ...prev, seo: { ...prev.seo, keywords: [...(prev.seo?.keywords || []), kw] } }));
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">OG Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.seo?.ogImage || ''}
                                        disabled={isReadOnly}
                                        onChange={e => setFormData((prev: any) => ({ ...prev, seo: { ...prev.seo, ogImage: e.target.value } }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/10 disabled:opacity-50"
                                        placeholder="https://…/og-image.jpg (for social sharing)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <MediaPickerModal
                    isOpen={isMediaOpen}
                    onClose={() => setIsMediaOpen(false)}
                    multiple={mediaTarget === 'gallery'}
                    onSelect={(url: string) => {
                        // Single select — used for cover image
                        handleField('coverImage', url);
                        setIsMediaOpen(false);
                    }}
                    onSelectMultiple={(urls: string[]) => {
                        // Multi-select — used for gallery
                        setFormData((prev: any) => ({ ...prev, gallery: [...(prev.gallery || []), ...urls] }));
                        setIsMediaOpen(false);
                    }}
                />
            </PermissionGuard>
        );
    }

    // List view
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Land <span className="text-emerald-600 font-bold">Plots</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Manage land plot listings.</p>
                </div>
                <div className="flex items-center gap-3">
                    {canManageContent && (
                        <button
                            onClick={handleCreate}
                            disabled={!isSupported}
                            className="inline-flex items-center gap-x-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 leading-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            New Plot
                        </button>
                    )}
                </div>
            </div>

            <ThemeCompatibilityBanner moduleName="plots" />

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plot</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price From</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
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
                            ) : plots.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <MapPinIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No plots yet. Add your first listing!</p>
                                    </td>
                                </tr>
                            ) : (
                                plots.map((plot: any) => (
                                    <tr key={plot.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                                    {plot.coverImage ? (
                                                        <img
                                                            src={plot.coverImage.startsWith('http') ? plot.coverImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${plot.coverImage}`}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                            <MapPinIcon className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{plot.title}</p>
                                                    {plot.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-xs font-semibold text-slate-500">{plot.location || '—'}</td>
                                        <td className="px-4 py-5 text-xs font-bold text-slate-700">
                                            {plot.priceFrom ? `NPR ${Number(plot.priceFrom).toLocaleString('en-NP')}` : '—'}
                                        </td>
                                        <td className="px-4 py-5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusBadge(plot.status)}`}>{plot.status}</span>
                                        </td>
                                        <td className="pr-8 py-5 text-right">
                                            {canManageContent && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(plot)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirmation({ isOpen: true, plotId: plot.id })} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
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
                title="Delete Plot"
                description="This will permanently delete this plot listing. Are you sure?"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, plotId: null })}
            />
        </div>
    );
}

export default function PlotsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        }>
            <PlotsPageContent />
        </Suspense>
    );
}
