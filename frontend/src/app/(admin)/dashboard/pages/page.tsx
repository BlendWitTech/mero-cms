'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Edit3,
    Globe,
    Hash,
    Layers,
    Layout,
    Search,
    ExternalLink,
    Plus,
    Trash2,
    SearchX
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';
import AlertDialog from '@/components/ui/AlertDialog';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

interface PageItem {
    id: string;
    title: string;
    slug: string;
    type: 'theme' | 'content' | 'category' | 'tag';
    lastUpdated?: string;
    seo?: any;
    editableContent?: boolean; // content pages (privacy, terms etc.) can be fully edited
}

export default function PagesIndex() {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingPage, setEditingPage] = useState<PageItem | null>(null);
    const [seoFormData, setSeoFormData] = useState({ title: '', description: '', keywords: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [deletePageModal, setDeletePageModal] = useState<{ isOpen: boolean; page: PageItem | null }>({ isOpen: false, page: null });
    const [activeThemeName, setActiveThemeName] = useState<string | null>(null);
    const [themeBaseUrl, setThemeBaseUrl] = useState('http://localhost:3002');
    const { showToast } = useNotification();
    const { settings } = useSettings();

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        setIsLoading(true);
        try {
            const [pageSchema, dynamicPages, categories, tags, themeConfig] = await Promise.all([
                apiRequest('/themes/active/page-schema', { skipNotification: true }).catch(() => []),
                apiRequest('/pages', { skipNotification: true }).catch(() => []),
                apiRequest('/categories', { skipNotification: true }).catch(() => []),
                apiRequest('/tags', { skipNotification: true }).catch(() => []),
                apiRequest('/themes/active/config', { skipNotification: true }).catch(() => ({})),
            ]);
            setThemeBaseUrl(themeConfig?.deployedUrl || 'http://localhost:3002');

            // Theme pages from pageSchema (dynamic, not hardcoded)
            const schemaPages: PageItem[] = Array.isArray(pageSchema)
                ? pageSchema.map((p: any) => ({
                    id: p.slug,
                    title: p.label || p.slug,
                    slug: p.slug === 'home' ? '/' : `/${p.slug}`,
                    type: 'theme' as const,
                }))
                : [];

            // Content pages from DB (privacy, terms, etc.) — filtered by active theme via backend
            // Exclude slugs already covered by schema
            const schemaSlugs = new Set(schemaPages.map(p => p.slug.replace(/^\//, '') || 'home'));
            const contentPages: PageItem[] = Array.isArray(dynamicPages)
                ? dynamicPages
                    .filter((p: any) => !schemaSlugs.has(p.slug))
                    .map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        slug: `/${p.slug}`,
                        type: 'content' as const,
                        lastUpdated: p.updatedAt,
                        editableContent: true,
                    }))
                : [];

            const allPages: PageItem[] = [
                ...schemaPages,
                ...contentPages,
                ...(Array.isArray(categories) ? categories.map((c: any) => ({
                    id: c.id,
                    title: `Category: ${c.name}`,
                    slug: `/blog/category/${c.slug}`,
                    type: 'category' as const,
                    lastUpdated: c.updatedAt,
                })) : []),
                ...(Array.isArray(tags) ? tags.map((t: any) => ({
                    id: t.id,
                    title: `Tag: ${t.name}`,
                    slug: `/blog/tag/${t.slug}`,
                    type: 'tag' as const,
                    lastUpdated: t.updatedAt,
                })) : []),
            ];

            setPages(allPages);

            // Read active theme from settings context
            setActiveThemeName((settings as any)?.active_theme || null);
        } catch (error) {
            console.error('Failed to fetch pages', error);
            showToast('Failed to load pages.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSeo = async (page: PageItem) => {
        setEditingPage(page);
        try {
            const pageType = page.type === 'theme' ? 'static'
                : page.type === 'content' ? 'page'
                : page.type === 'category' ? 'category'
                : 'tag';

            const seo = await apiRequest(`/seo-meta/${pageType}/${page.id}`, { skipNotification: true });
            setSeoFormData({
                title: seo?.title || '',
                description: seo?.description || '',
                keywords: seo?.keywords?.join(', ') || '',
            });
        } catch {
            setSeoFormData({ title: '', description: '', keywords: '' });
        }
    };

    const handleSaveSeo = async () => {
        if (!editingPage) return;
        setIsSaving(true);
        try {
            const pageType = editingPage.type === 'theme' ? 'static'
                : editingPage.type === 'content' ? 'page'
                : editingPage.type === 'category' ? 'category'
                : 'tag';

            await apiRequest('/seo-meta', {
                method: 'POST',
                body: {
                    pageType,
                    pageId: editingPage.id,
                    title: seoFormData.title,
                    description: seoFormData.description,
                    keywords: seoFormData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
                },
            });

            showToast('SEO metadata saved.', 'success');
            setEditingPage(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to save SEO.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePage = (page: PageItem) => {
        setDeletePageModal({ isOpen: true, page });
    };

    const confirmDeletePage = async () => {
        if (!deletePageModal.page) return;

        try {
            await apiRequest(`/pages/${deletePageModal.page.id}`, { method: 'DELETE' });
            showToast('Page deleted.', 'success');
            setDeletePageModal({ isOpen: false, page: null });
            fetchPages();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete page.', 'error');
        }
    };


    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const typeConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
        theme:          { label: 'Theme Page',      bg: 'bg-blue-50 dark:bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',   icon: <Layout className="h-4 w-4" /> },
        content:        { label: 'Content Page',    bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: <FileText className="h-4 w-4" /> },
        category:       { label: 'Blog Category',   bg: 'bg-amber-50 dark:bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400',  icon: <Layers className="h-4 w-4" /> },
        tag:            { label: 'Tag',             bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: <Hash className="h-4 w-4" /> },
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="Site" 
                accent="Routes" 
                subtitle="Configure SEO and managed paths for your website"
                actions={
                    <>
                        {activeThemeName && (
                            <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                                {activeThemeName}
                            </div>
                        )}
                        <button
                            onClick={() => window.location.href = '/dashboard/pages/new'}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0"
                        >
                            <Plus className="h-4 w-4" strokeWidth={3} />
                            New Document
                        </button>
                    </>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Find route by name or slug…"
                }}
            />

            <div className="flex flex-wrap gap-3 px-2 mb-2">
                {Object.entries(typeConfig).map(([type, cfg]) => (
                    <span key={type} className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} border border-black/5 dark:border-white/5 shadow-sm`}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                ))}
            </div>

            {/* Empty state — rendered directly when no results, no card wrapper */}
            {!isLoading && filteredPages.length === 0 ? (
                <div className="py-16">
                    <EmptyState
                        icon={SearchX}
                        title="No Routes Found"
                        description="We couldn't find any routes matching your search. Try adjusting your query or creating a new document."
                    />
                </div>
            ) : (
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/30 dark:bg-white/[0.01]">
                                <th className="pl-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Category</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptor</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Path</th>
                                <th className="pr-10 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-5"><div className="h-10 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : (
                                filteredPages.map((page) => {
                                    const cfg = typeConfig[page.type];
                                    return (
                                        <tr key={`${page.type}-${page.id}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="pl-10 py-6">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-black/5 ${cfg.bg} ${cfg.text} border border-black/5 dark:border-white/[0.06]`}>
                                                    {cfg.icon}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{page.title}</p>
                                                <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                                    <div className={`h-1 w-1 rounded-full ${cfg.bg.replace('bg-', 'bg-')}`} />
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cfg.label}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold border border-slate-100 dark:border-white/[0.06]">
                                                    {page.slug}
                                                </div>
                                            </td>
                                            <td className="pr-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`${themeBaseUrl}${page.slug}`}
                                                        target="_blank"
                                                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                        title="View URL"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                    {page.editableContent && (
                                                        <button
                                                            onClick={() => window.location.href = `/dashboard/pages/${page.id}`}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm"
                                                            title="Edit Content"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                            Edit
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditSeo(page)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm"
                                                    >
                                                        <Globe className="h-3.5 w-3.5" />
                                                        SEO
                                                    </button>
                                                    {page.editableContent && (
                                                        <button
                                                            onClick={() => handleDeletePage(page)}
                                                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}

                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* SEO Modal */}
            {editingPage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-xl shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-white/[0.06]">
                        <div className="p-10 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tight">Index Protocol</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingPage.title} · {editingPage.slug}</p>
                            </div>
                            <button onClick={() => setEditingPage(null)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/[0.06] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all text-2xl leading-none shadow-sm">×</button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Meta Title</label>
                                <input
                                    type="text"
                                    value={seoFormData.title}
                                    onChange={(e) => setSeoFormData({ ...seoFormData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-slate-950 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
                                    placeholder="Enter search engine title..."
                                />
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[9px] text-slate-400 font-bold italic">Recommended: 50-60 characters</p>
                                    <p className={`text-[10px] font-black ${seoFormData.title.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>{seoFormData.title.length}/60</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Meta Description</label>
                                <textarea
                                    value={seoFormData.description}
                                    onChange={(e) => setSeoFormData({ ...seoFormData, description: e.target.value })}
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-slate-950 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner resize-none"
                                    placeholder="Enter a brief, compelling summary..."
                                />
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[9px] text-slate-400 font-bold italic">Recommended: 120-160 characters</p>
                                    <p className={`text-[10px] font-black ${seoFormData.description.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>{seoFormData.description.length}/160</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Search Keywords</label>
                                <input
                                    type="text"
                                    value={seoFormData.keywords}
                                    onChange={(e) => setSeoFormData({ ...seoFormData, keywords: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-slate-950 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
                                    placeholder="cms, content management, website builder..."
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-6">
                            <button onClick={() => setEditingPage(null)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSeo}
                                disabled={isSaving}
                                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Synchronizing...' : 'Update Meta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AlertDialog
                isOpen={deletePageModal.isOpen}
                title="Delete Page"
                description={`Delete "${deletePageModal.page?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                isLoading={false}
                onConfirm={confirmDeletePage}
                onCancel={() => setDeletePageModal({ isOpen: false, page: null })}
            />
        </div>
    );
}
