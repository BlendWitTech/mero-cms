'use client';

import React, { useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    PencilSquareIcon,
    GlobeAltIcon,
    HashtagIcon,
    Square3Stack3DIcon,
    Squares2X2Icon,
    MagnifyingGlassIcon,
    ArrowTopRightOnSquareIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/context/SettingsContext';

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

    const handleDeletePage = async (page: PageItem) => {
        if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
        try {
            await apiRequest(`/pages/${page.id}`, { method: 'DELETE' });
            showToast('Page deleted.', 'success');
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
        theme:   { label: 'Theme Page',    bg: 'bg-blue-50',   text: 'text-blue-600',   icon: <Squares2X2Icon className="h-5 w-5" /> },
        content: { label: 'Content Page',  bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <DocumentTextIcon className="h-5 w-5" /> },
        category:{ label: 'Category',      bg: 'bg-amber-50',  text: 'text-amber-600',  icon: <Square3Stack3DIcon className="h-5 w-5" /> },
        tag:     { label: 'Tag',           bg: 'bg-purple-50', text: 'text-purple-600', icon: <HashtagIcon className="h-5 w-5" /> },
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        All <span className="text-blue-600 font-bold">Pages</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        Manage SEO metadata for all routes.
                        {activeThemeName && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {activeThemeName}
                            </span>
                        )}
                    </p>
                </div>
                <a
                    href="/dashboard/pages/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Page
                </a>
            </div>

            {/* Legend */}
            <div className="px-2 flex flex-wrap gap-3">
                {Object.entries(typeConfig).map(([type, cfg]) => (
                    <span key={type} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                ))}
            </div>

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/10">
                    <div className="relative group max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search pages and routes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">Type</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page / Route</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slug</th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-5"><div className="h-10 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : filteredPages.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 text-sm font-bold">No pages found.</td>
                                </tr>
                            ) : (
                                filteredPages.map((page) => {
                                    const cfg = typeConfig[page.type];
                                    return (
                                        <tr key={`${page.type}-${page.id}`} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="pl-8 py-5">
                                                <div className={`p-2 rounded-xl w-fit ${cfg.bg} ${cfg.text}`}>
                                                    {cfg.icon}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="font-bold text-slate-900 text-sm">{page.title}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${cfg.text}`}>{cfg.label}</p>
                                            </td>
                                            <td className="px-4 py-5 font-mono text-[10px] text-blue-500 font-bold">{page.slug}</td>
                                            <td className="pr-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`${themeBaseUrl}${page.slug}`}
                                                        target="_blank"
                                                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                                                        title="View on theme"
                                                    >
                                                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                                    </a>
                                                    {page.editableContent && (
                                                        <a
                                                            href={`/dashboard/pages/${page.id}`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all font-bold text-[10px] uppercase tracking-widest"
                                                            title="Edit Content"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            Edit
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditSeo(page)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-[10px] uppercase tracking-widest"
                                                    >
                                                        <GlobeAltIcon className="h-4 w-4" />
                                                        SEO
                                                    </button>
                                                    {page.editableContent && (
                                                        <button
                                                            onClick={() => handleDeletePage(page)}
                                                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
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

            {/* SEO Modal */}
            {editingPage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 font-display">SEO Metadata</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingPage.title} · {editingPage.slug}</p>
                            </div>
                            <button onClick={() => setEditingPage(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Title</label>
                                <input
                                    type="text"
                                    value={seoFormData.title}
                                    onChange={(e) => setSeoFormData({ ...seoFormData, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                    placeholder="Enter search engine title..."
                                />
                                <p className="text-[10px] text-slate-400 text-right">{seoFormData.title.length}/60</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Description</label>
                                <textarea
                                    value={seoFormData.description}
                                    onChange={(e) => setSeoFormData({ ...seoFormData, description: e.target.value })}
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none"
                                    placeholder="Enter a brief, compelling summary..."
                                />
                                <p className="text-[10px] text-slate-400 text-right">{seoFormData.description.length}/160</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keywords</label>
                                <input
                                    type="text"
                                    value={seoFormData.keywords}
                                    onChange={(e) => setSeoFormData({ ...seoFormData, keywords: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                                    placeholder="land nepal, kathmandu plots, real estate..."
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button onClick={() => setEditingPage(null)} className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSeo}
                                disabled={isSaving}
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Metadata'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
