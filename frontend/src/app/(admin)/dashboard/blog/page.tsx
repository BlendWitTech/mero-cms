'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    DocumentTextIcon,
    EyeIcon,
    ChatBubbleLeftRightIcon,
    ArrowUpRightIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowLeftIcon,
    CloudArrowUpIcon,
    PhotoIcon,
    CalendarIcon,
    ExclamationCircleIcon,
    CheckIcon,
    DocumentDuplicateIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import PostEditor from '@/components/blog/PostEditor';
import MediaLibrary from '@/components/media/MediaLibrary';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import AlertDialog from '@/components/ui/AlertDialog';
import { useNotification } from '@/context/NotificationContext';
import { useForm } from '@/context/FormContext';
import { apiRequest, getApiBaseUrl } from '@/lib/api';

const API_URL = getApiBaseUrl();
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useSettings } from '@/context/SettingsContext';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

function BlogPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showToast } = useNotification();
    const { isDirty, setIsDirty } = useForm();
    const { settings } = useSettings();

    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentTheme, setContentTheme] = useState<string | null>(null);

    // View derived from URL
    const action = searchParams.get('action');
    const actionId = searchParams.get('id');
    const view = action === 'new' || (action === 'edit' && actionId) ? 'editor' : 'list';

    const [posts, setPosts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canManageContent, setCanManageContent] = useState(false);

    // Form and State
    const defaultFormData = {
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        coverImage: '',
        status: 'DRAFT',
        categories: [],
        tags: [],
        publishedAt: '',
        seo: { title: '', description: '', keywords: [] as string[], ogImage: '', ogImages: [] as string[] }
    };
    const [formData, setFormData] = useState<any>(defaultFormData);
    const [initialState, setInitialState] = useState<any>(defaultFormData);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Effect to handle URL-based data loading for Edit mode
    useEffect(() => {
        if (view === 'editor' && action === 'edit' && actionId) {
            const post = posts.find(p => p.id === actionId);
            if (post) {
                populateForm(post);
            } else if (!isLoading && posts.length > 0) {
                // If loaded but not found (pagination?), fetch specific
                fetchPost(actionId);
            }
        }
    }, [view, action, actionId, posts, isLoading]);

    // Reset form whenever entering 'new' mode (tracks action transitions via ref)
    const prevActionRef = React.useRef<string | null>(null);
    useEffect(() => {
        if (action === 'new' && prevActionRef.current !== 'new') {
            resetForm();
        }
        prevActionRef.current = action;
    }, [action]);

    // Sync isDirty with FormContext
    useEffect(() => {
        const dirty = JSON.stringify(formData) !== JSON.stringify(initialState);
        setIsDirty(dirty);
    }, [formData, initialState, setIsDirty]);

    const fetchInitialData = async () => {
        try {
            const [postsData, catsData, tagsData, profile] = await Promise.all([
                apiRequest('/blogs'),
                apiRequest('/categories').catch(() => []),
                apiRequest('/tags').catch(() => []),
                apiRequest('/auth/profile').catch(() => null),
            ]);

            setPosts(Array.isArray(postsData) ? postsData : []);
            setCategories(Array.isArray(catsData) ? catsData : []);
            setTags(Array.isArray(tagsData) ? tagsData : []);

            if (profile?.role?.permissions?.manage_content || profile?.role?.name === 'Super Admin' || profile?.role?.name === 'Admin') {
                setCanManageContent(true);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
            showToast('Failed to load blog posts', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPost = async (id: string) => {
        try {
            const post = await apiRequest(`/blogs/${id}`);
            if (post) populateForm(post);
        } catch (error) {
            showToast('Failed to load post', 'error');
            router.push('/dashboard/blog');
        }
    };

    const populateForm = (post: any) => {
        // Prefer `publishAt` (the future "scheduled for" field) when the post
        // is still scheduled; otherwise show `publishedAt` (the actual publish
        // timestamp). The single datetime input in the UI maps to whichever
        // is relevant for the current status.
        const dateValue =
            post.status === 'SCHEDULED' && post.publishAt
                ? post.publishAt
                : post.publishedAt || '';
        const data = {
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            status: post.status,
            categories: post.categories?.map((c: any) => c.id) || [],
            tags: post.tags?.map((t: any) => t.name) || [],
            publishedAt: dateValue,
            seo: { title: post.seo?.title || '', description: post.seo?.description || '', keywords: post.seo?.keywords || [], ogImage: post.seo?.ogImage || '', ogImages: post.seo?.ogImages || [] }
        };
        setFormData(data);
        setInitialState(data);
        setCurrentPostId(post.id);

        const activeTheme = settings['active_theme'];
        const postTheme = post.theme;

        if (postTheme && activeTheme && postTheme !== activeTheme) {
            setIsReadOnly(true);
            setContentTheme(postTheme);
        } else {
            setIsReadOnly(false);
            setContentTheme(null);
        }
    };

    const resetForm = () => {
        setFormData(defaultFormData);
        setInitialState(defaultFormData);
        setCurrentPostId(null);
        setIsReadOnly(false);
        setContentTheme(null);
    };

    const handleCreate = () => {
        resetForm();
        router.push('/dashboard/blog?action=new');
    };

    const handleEdit = (post: any) => {
        populateForm(post);
        router.push(`/dashboard/blog?action=edit&id=${post.id}`);
    };

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedAlert(true);
        } else {
            router.back();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const url = currentPostId ? `/blogs/${currentPostId}` : '/blogs';
        const method = currentPostId ? 'PATCH' : 'POST';

        try {
            // Sanitize payload. The datetime-local input feeds a single string
            // in `formData.publishedAt`; send it as `publishAt` (the future
            // "scheduled for" field) when status === 'SCHEDULED', otherwise
            // send it as `publishedAt` (the actual "published at" field) so
            // the back-end content scheduler knows which semantic to apply.
            const pickedAt = formData.publishedAt
                ? new Date(formData.publishedAt).toISOString()
                : undefined;
            const payload: any = {
                ...formData,
                publishAt: formData.status === 'SCHEDULED' ? pickedAt : null,
                publishedAt: formData.status !== 'SCHEDULED' ? pickedAt : undefined,
                seo: (!formData.seo.title && !formData.seo.description && !formData.seo.ogImage && !formData.seo.keywords?.length) ? undefined : formData.seo,
            };

            await apiRequest(url, {
                method,
                body: payload
            });

            showToast('Post saved successfully!', 'success');
            setIsDirty(false);
            fetchInitialData();
            setInitialState(formData);

            router.back();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleCategoryToggle = (id: string) => {
        setFormData((prev: any) => {
            const exists = prev.categories.includes(id);
            const newCategories = exists
                ? prev.categories.filter((c: string) => c !== id)
                : [...prev.categories, id];
            return { ...prev, categories: newCategories };
        });
    };

    // Ensure we reset alert state when view changes
    useEffect(() => {
        setShowUnsavedAlert(false);
    }, [view]);

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, id });
    };

    const handleDuplicate = async (id: string) => {
        try {
            await apiRequest(`/blogs/${id}/duplicate`, { method: 'POST' });
            showToast('Post duplicated as draft', 'success');
            fetchInitialData();
        } catch {
            showToast('Failed to duplicate post', 'error');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = (visibleIds: string[]) => {
        if (visibleIds.every(id => selectedIds.has(id))) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(visibleIds));
        }
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            await apiRequest('/blogs/bulk/delete', { method: 'POST', body: { ids: Array.from(selectedIds) } });
            showToast(`Deleted ${selectedIds.size} post(s)`, 'success');
            setSelectedIds(new Set());
            fetchInitialData();
        } catch {
            showToast('Bulk delete failed', 'error');
        } finally {
            setIsBulkDeleting(false);
            setBulkDeleteConfirm(false);
        }
    };

    const handleBulkStatus = async (status: string) => {
        try {
            const res = await apiRequest('/blogs/bulk/status', { method: 'POST', body: { ids: Array.from(selectedIds), status } });
            showToast(`Updated ${(res as any).updated} post(s) to ${status}`, 'success');
            setSelectedIds(new Set());
            fetchInitialData();
        } catch {
            showToast('Bulk update failed', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.id) return;
        try {
            await apiRequest(`/blogs/${deleteConfirmation.id}`, { method: 'DELETE' });
            showToast('Post deleted successfully', 'success');
            fetchInitialData();
            setDeleteConfirmation({ isOpen: false, id: null });
        } catch (error) {
            console.error(error);
            showToast('Failed to delete post', 'error');
            setDeleteConfirmation({ isOpen: false, id: null });
        }
    };

    const generateSeo = async () => {
        try {
            const res: any = await apiRequest('/ai/generate', {
                method: 'POST',
                body: { 
                    prompt: 'Generate an SEO title (max 60 chars) and meta description (max 160 chars) for this article.', 
                    context: `Title: ${formData.title}\nContent: ${formData.content.slice(0, 1000)}` 
                }
            });
            
            // For mock demo purposes, if it starts with "AI Suggestion" or similar, we'll use it
            const text = res.text || '';
            const lines = text.split('\n').filter((l: string) => l.trim());
            const newTitle = lines[0]?.replace(/^Title:|^SUMMARY:|^AI Suggestion:/i, '').trim() || formData.title;
            const newDesc = lines[1] || text.slice(0, 160);
            
            setFormData((prev: any) => ({
                ...prev,
                seo: {
                    ...prev.seo,
                    title: newTitle.slice(0, 60),
                    description: newDesc.slice(0, 160)
                }
            }));
            showToast('SEO metadata generated!', 'success');
        } catch (error) {
            showToast('AI SEO generation failed', 'error');
        }
    };

    if (view === 'editor') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <AlertDialog
                    isOpen={deleteConfirmation.isOpen}
                    title="Delete Post"
                    description="Are you sure you want to delete this post? This action cannot be undone."
                    confirmLabel="Delete Post"
                    cancelLabel="Cancel"
                    variant="danger"
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
                />
                <UnsavedChangesAlert
                    isOpen={showUnsavedAlert}
                    onSaveAndExit={async () => {
                        const success = await handleSave();
                    }}
                    onDiscardAndExit={() => {
                        setIsDirty(false);
                        router.push('/dashboard/blog');
                    }}
                    onCancel={() => setShowUnsavedAlert(false)}
                    isSaving={isSaving}
                />

                {isReadOnly && (
                    <div className="mx-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl">
                            <ExclamationCircleIcon className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 tracking-tight">Incompatible Theme Post</h3>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-600/80 mt-0.5">
                                This article belongs to the <span className="underline decoration-2 underline-offset-2 capitalize">{contentTheme || 'another'}</span> theme. 
                                It is in read-only mode to prevent layout issues on your active site.
                            </p>
                        </div>
                    </div>
                )}

                {/* Editor Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackClick} className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400 transition-colors">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentPostId ? 'Editing Post' : 'New Post'}</p>
                            <h1 className="text-xl font-bold text-slate-900 font-display">{formData.title || 'Untitled Post'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={formData.status}
                            disabled={isReadOnly}
                            onChange={(e) => {
                                const newStatus = e.target.value;
                                setFormData({ ...formData, status: newStatus });
                            }}
                            className={`border-none text-xs font-bold py-2.5 px-4 rounded-xl focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${formData.status === 'SCHEDULED' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                        <button 
                            onClick={() => handleSave()} 
                            disabled={isSaving || isReadOnly}
                            className="btn-primary"
                        >
                            <CloudArrowUpIcon className="h-4 w-4" />
                            {isSaving ? 'Saving...' : (isReadOnly ? 'Read Only' : 'Save Changes')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Premium Title & Slug Area */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-10 border border-slate-100 dark:border-white/[0.06] shadow-xl shadow-slate-200 dark:shadow-none space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -z-10 group-hover:bg-blue-100/30 transition-colors duration-1000"></div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Master Article Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter a captivating headline..."
                                    value={formData.title}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                                    className="w-full text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 border-none focus:ring-0 p-0 font-display bg-transparent transition-all decoration-blue-600/30 hover:decoration-blue-600/50 disabled:opacity-50"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/[0.06] group/slug hover:border-blue-200 dark:hover:border-blue-500/50 transition-all">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Permalink</span>
                                    <span className="text-slate-300 font-mono text-xs">/blog/</span>
                                    <input
                                        value={formData.slug}
                                        disabled={isReadOnly}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="bg-transparent border-none focus:ring-0 p-0 text-blue-600 font-bold text-xs min-w-[200px] disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Rich Text Editor */}
                        <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
                            <PostEditor key={action === 'new' ? 'new' : currentPostId ?? 'new'} content={formData.content} onChange={(html) => setFormData({ ...formData, content: html })} />
                        </div>
                    </div>

                    {/* Sidebar Metadata */}
                    <div className="space-y-6">
                        {/* Cover Image */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cover Image</h3>
                                {formData.coverImage && !isReadOnly && (
                                    <button onClick={() => setFormData({ ...formData, coverImage: '' })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Remove</button>
                                )}
                            </div>
                             <div
                                onClick={() => !isReadOnly && setIsMediaOpen(true)}
                                className={`aspect-video bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 ${!isReadOnly ? 'hover:bg-slate-100/50 dark:hover:bg-slate-900/50 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all group overflow-hidden relative`}
                            >
                                {formData.coverImage ? (
                                    <img src={formData.coverImage} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <PhotoIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold">Select from Library</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <MediaLibrary
                            isOpen={isMediaOpen}
                            onClose={() => setIsMediaOpen(false)}
                            onSelect={(url) => {
                                setFormData({ ...formData, coverImage: url });
                                setIsMediaOpen(false);
                            }}
                        />

                        {/* Categories */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Categories</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                         <input
                                            type="checkbox"
                                            disabled={isReadOnly}
                                            checked={formData.categories.includes(cat.id)}
                                            onChange={() => handleCategoryToggle(cat.id)}
                                            className="rounded-md border-slate-300 dark:border-white/10 dark:bg-slate-900 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                                        />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                                    </label>
                                ))}
                                {categories.length === 0 && <p className="text-xs text-slate-400 italic">No categories found.</p>}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl rounded-b-none p-6 border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4 relative">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tags</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags.map((tag: string) => (
                                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1">
                                        {tag}
                                        {!isReadOnly && <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) })} className="hover:text-blue-800">×</button>}
                                    </span>
                                ))}
                            </div>
                            <div className="relative">
                                 <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs font-bold px-4 py-3 focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50 text-slate-900 dark:text-white"
                                    placeholder={isReadOnly ? "Read-only tags" : "Search or add tag..."}
                                    disabled={isReadOnly}
                                    value={tagSearch}
                                    onChange={(e) => {
                                        setTagSearch(e.target.value);
                                        setShowTagSuggestions(true);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = tagSearch.trim();
                                            if (val && !formData.tags.includes(val)) {
                                                setFormData((prev: any) => ({ ...prev, tags: [...prev.tags, val] }));
                                                setTagSearch('');
                                                setShowTagSuggestions(false);
                                            }
                                        }
                                    }}
                                    onFocus={() => setShowTagSuggestions(true)}
                                />
                                {showTagSuggestions && (
                                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/[0.06] max-h-48 overflow-y-auto custom-scrollbar p-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest p-2">Suggestions</p>
                                        {tags
                                            .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()) && !formData.tags.includes(t.name))
                                            .map(tag => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => {
                                                        setFormData((prev: any) => ({ ...prev, tags: [...prev.tags, tag.name] }));
                                                        setTagSearch('');
                                                        setShowTagSuggestions(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
                                                >
                                                    {tag.name}
                                                </button>
                                            ))}
                                        {tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()) && !formData.tags.includes(t.name)).length === 0 && (
                                            <p className="p-2 text-xs text-slate-400 italic font-medium">No other tags found.</p>
                                        )}
                                        {tagSearch && !tags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                                            <button
                                                onClick={() => {
                                                    setFormData((prev: any) => ({ ...prev, tags: [...prev.tags, tagSearch] }));
                                                    setTagSearch('');
                                                    setShowTagSuggestions(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-xl transition-all border border-blue-100/50 mt-1"
                                            >
                                                Create "{tagSearch}"
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SEO Metadata */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SEO Metadata</h3>
                                <button 
                                    onClick={generateSeo}
                                    className="btn-ghost px-3 py-1 text-blue-600 dark:text-blue-400"
                                >
                                    <SparklesIcon className="h-3 w-3" />
                                    AI Generate
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Title</label>
                                    <input
                                        type="text"
                                        value={formData.seo.title}
                                        disabled={isReadOnly}
                                        onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                                        placeholder="Title for search engines"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">{formData.seo.title.length}/60</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Description</label>
                                    <textarea
                                        value={formData.seo.description}
                                        disabled={isReadOnly}
                                        onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })}
                                        rows={3}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none disabled:opacity-50"
                                        placeholder="Brief description for search results"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">{formData.seo.description.length}/160</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keywords</label>
                                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                        {(formData.seo.keywords || []).map((kw: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                                                {kw}
                                                <button type="button" disabled={isReadOnly} onClick={() => setFormData({ ...formData, seo: { ...formData.seo, keywords: formData.seo.keywords.filter((_: string, j: number) => j !== i) } })} className="hover:text-red-500 disabled:opacity-50">×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        disabled={isReadOnly}
                                        placeholder="Type keyword and press Enter…"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                                        onKeyDown={(e) => {
                                            if ((e.key === 'Enter' || e.key === ',') && (e.target as HTMLInputElement).value.trim()) {
                                                e.preventDefault();
                                                const kw = (e.target as HTMLInputElement).value.trim();
                                                setFormData({ ...formData, seo: { ...formData.seo, keywords: [...(formData.seo.keywords || []), kw] } });
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">OG Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.seo.ogImage || ''}
                                        disabled={isReadOnly}
                                        onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, ogImage: e.target.value } })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:opacity-50"
                                        placeholder="https://…/og-image.jpg (for social sharing)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Scheduling */}
                        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${formData.status === 'SCHEDULED' ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-500/30' : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/[0.06]'}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest ${formData.status === 'SCHEDULED' ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400'}`}>Publishing</h3>
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${formData.status === 'SCHEDULED' ? 'text-violet-600' : 'text-slate-400'}`}>
                                    {formData.status === 'SCHEDULED' ? 'Scheduled Date *' : 'Publish Date'}
                                </label>
                                <div className="relative">
                                    <CalendarIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${formData.status === 'SCHEDULED' ? 'text-violet-400' : 'text-slate-400'}`} />
                                    <input
                                        type="datetime-local"
                                        value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                                        disabled={isReadOnly}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const isFuture = val && new Date(val) > new Date();
                                            setFormData({
                                                ...formData,
                                                publishedAt: val,
                                                status: isFuture ? 'SCHEDULED' : formData.status === 'SCHEDULED' ? 'DRAFT' : formData.status,
                                            });
                                        }}
                                        className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${formData.status === 'SCHEDULED' ? 'bg-white dark:bg-slate-950 border-violet-300 dark:border-violet-500/50 focus:ring-violet-300/30 text-violet-800 dark:text-violet-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 focus:ring-blue-600/10 text-slate-900 dark:text-white'}`}
                                    />
                                </div>
                                <p className={`text-[10px] mt-2 ml-1 ${formData.status === 'SCHEDULED' ? 'text-violet-500 font-semibold' : 'text-slate-400'}`}>
                                    {formData.status === 'SCHEDULED'
                                        ? `Will auto-publish at the scheduled time.`
                                        : formData.publishedAt && new Date(formData.publishedAt) > new Date()
                                            ? 'Set status to Scheduled to auto-publish.'
                                            : 'Leave empty to publish immediately.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AlertDialog
                isOpen={deleteConfirmation.isOpen}
                title="Delete Post"
                description="Are you sure you want to delete this post? This action cannot be undone."
                confirmLabel="Delete Post"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
            />
            <AlertDialog
                isOpen={bulkDeleteConfirm}
                title={`Delete ${selectedIds.size} post(s)?`}
                description="All selected posts will be permanently deleted. This action cannot be undone."
                confirmLabel={isBulkDeleting ? 'Deleting...' : 'Delete All'}
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirm(false)}
            />
            <PageHeader 
                title="Content" 
                accent="Engine" 
                subtitle="Create, edit and manage your blog posts and articles"
                actions={
                    <PermissionGuard permission="content_create">
                        <button onClick={handleCreate} className="btn-primary">
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            New Post
                        </button>
                    </PermissionGuard>
                }
            />

            {/* Bulk action toolbar */}
            {selectedIds.size > 0 && (
                <div className="mx-2 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 animate-in slide-in-from-top-2 duration-200">
                    <span className="text-sm font-bold text-blue-700">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => handleBulkStatus('PUBLISHED')}
                            className="btn-outline px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 border-emerald-200"
                        >
                            Publish
                        </button>
                        <button
                            onClick={() => handleBulkStatus('DRAFT')}
                            className="btn-outline px-3 py-1.5 text-xs text-amber-700 bg-amber-50 border-amber-200"
                        >
                            Set Draft
                        </button>
                        <button
                            onClick={() => handleBulkStatus('ARCHIVED')}
                            className="btn-outline px-3 py-1.5 text-xs"
                        >
                            Archive
                        </button>
                        <button
                            onClick={() => setBulkDeleteConfirm(true)}
                            className="btn-destructive px-3 py-1.5 text-xs"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="btn-ghost px-3 py-1.5 text-xs"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Search posts by title or slug..."
                }}
                filters={[
                    {
                        label: "All Categories",
                        value: categoryFilter,
                        onChange: setCategoryFilter,
                        options: categories.map(cat => ({ label: cat.name, value: cat.id }))
                    },
                    {
                        label: "All Statuses",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { label: 'Published', value: 'PUBLISHED' },
                            { label: 'Draft', value: 'DRAFT' },
                            { label: 'Scheduled', value: 'SCHEDULED' },
                            { label: 'Archived', value: 'ARCHIVED' }
                        ]
                    }
                ]}
            />

            {/* Unified Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                <th className="pl-10 py-5 w-10">
                                    {canManageContent && (() => {
                                        const visibleIds = posts
                                            .filter(post => {
                                                const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.slug.toLowerCase().includes(searchQuery.toLowerCase());
                                                const matchesCategory = !categoryFilter || post.categories.some((c: any) => c.id === categoryFilter);
                                                const matchesStatus = !statusFilter || post.status === statusFilter;
                                                return matchesSearch && matchesCategory && matchesStatus;
                                            })
                                            .map((p: any) => p.id);
                                        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
                                        return (
                                            <button
                                                onClick={() => toggleSelectAll(visibleIds)}
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-white/20 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-950'}`}
                                            >
                                                {allSelected && <CheckIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                            </button>
                                        );
                                    })()}
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Article</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Author</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Date</th>
                                <th className="pr-10 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} >
                                        <td colSpan={5} className="px-8 py-8"><div className="content-skeleton h-12" /></td>
                                    </tr>
                                ))
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20">
                                        <EmptyState 
                                            naked
                                            icon={DocumentTextIcon}
                                            title="No Blog Posts Yet"
                                            description="Start writing stories and sharing updates with your audience by creating your first post."
                                            action={{
                                                label: "Create your first post",
                                                onClick: () => window.location.href = '/dashboard/blog/new'
                                            }}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                posts
                                    .filter(post => {
                                        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            post.slug.toLowerCase().includes(searchQuery.toLowerCase());
                                        const matchesCategory = !categoryFilter || post.categories.some((c: any) => c.id === categoryFilter);
                                        const matchesStatus = !statusFilter || post.status === statusFilter;
                                        return matchesSearch && matchesCategory && matchesStatus;
                                    })
                                    .map((post) => (
                                        <tr key={post.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="pl-10 py-6">
                                                <button
                                                    onClick={() => toggleSelect(post.id)}
                                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.has(post.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-white/20 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-950'}`}
                                                >
                                                    {selectedIds.has(post.id) && <CheckIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-white/5">
                                                        {post.featuredImage ? (
                                                            <img src={post.featuredImage.startsWith('/') ? `${API_URL}${post.featuredImage}` : post.featuredImage} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                                <PhotoIcon className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{post.title}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest truncate max-w-[200px]">/{post.slug}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${post.status === 'PUBLISHED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-emerald-600/20' :
                                                    post.status === 'DRAFT' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 ring-amber-600/20' :
                                                    post.status === 'SCHEDULED' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 ring-violet-600/20' :
                                                        'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-600/20'
                                                    }`}>
                                                    {post.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                                    {post.author?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="pr-10 py-6 text-right">
                                                {canManageContent && (
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/dashboard/comments?postId=${post.id}`} className="btn-ghost p-2" title="View Comments">
                                                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                        </Link>
                                                        <button onClick={() => handleEdit(post)} title="Edit" className="btn-ghost p-2 text-blue-600">
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDuplicate(post.id)} title="Duplicate to draft" className="btn-ghost p-2 text-violet-600">
                                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(post.id)} title="Delete" className="btn-ghost p-2 text-red-500">
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
        </div>
    );
}

export default function BlogPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <BlogPageContent />
        </Suspense>
    );
}
