'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    CloudArrowUpIcon,
    ExclamationTriangleIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import ThemeNotDetected from '@/components/admin/pages/ThemeNotDetected';
import SectionEditor, { type SchemaSection, type SectionData, type ThemePageConfig } from '@/components/admin/pages/SectionEditor';
import { useNotification } from '@/context/NotificationContext';
import { apiRequest } from '@/lib/api';
import { useSettings } from '@/context/SettingsContext';

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showToast } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [isMissingTheme, setIsMissingTheme] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [contentThemeName, setContentThemeName] = useState<string | null>(null);
    const { settings } = useSettings();

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        description: '',
        status: 'DRAFT',
    });

    // Section editor state
    const [pageSlug, setPageSlug] = useState('');
    const [sectionSchema, setSectionSchema] = useState<ThemePageConfig[]>([]);
    const [sections, setSections] = useState<SectionData[]>([]);

    useEffect(() => {
        fetchPage();
        fetchPageSchema();
    }, []);

    const fetchPage = async () => {
        try {
            const data = await apiRequest(`/pages/${id}`, { skipNotification: true });

            const contentTheme = data.theme;
            const activeTheme = settings['active_theme'];

            if (contentTheme && contentTheme !== activeTheme) {
                setIsReadOnly(true);
                setContentThemeName(contentTheme);
            }

            setFormData({
                title: data.title,
                slug: data.slug,
                content: data.content || '',
                description: data.seo?.description || '',
                status: data.status,
            });

            setPageSlug(data.slug);

            // Load existing section data from page.data.sections
            const existingSections: SectionData[] = data.data?.sections ?? [];
            setSections(existingSections);
        } catch (error: any) {
            const errorMessage = error?.message?.toLowerCase() || '';
            if (error?.status === 404 || errorMessage.includes('not found') || errorMessage.includes('404')) {
                setIsMissingTheme(true);
            } else {
                console.error(error);
                showToast('Failed to fetch page data', 'error');
                router.back();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPageSchema = async () => {
        try {
            const schema = await apiRequest('/themes/active/page-schema', { skipNotification: true });
            if (Array.isArray(schema)) {
                setSectionSchema(schema);
            }
        } catch {
            // No active theme or no schema — section editor stays hidden
        }
    };

    // Find the sections schema for this page's slug
    const pageSectionSchema: SchemaSection[] = (() => {
        if (!sectionSchema.length || !pageSlug) return [];
        const pageConfig = sectionSchema.find((p: ThemePageConfig) => p.slug === pageSlug);
        return pageConfig?.sections ?? [];
    })();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiRequest(`/pages/${id}`, {
                method: 'PATCH',
                body: {
                    ...formData,
                    data: { sections },
                    seo: {
                        title: formData.title,
                        description: formData.description,
                    },
                },
                skipNotification: true,
            });
            showToast('Page updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update page', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 font-bold">Loading editor...</div>;
    }

    if (isMissingTheme) {
        return <ThemeNotDetected />;
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <UnsavedChangesAlert
                isOpen={showUnsavedAlert}
                onSaveAndExit={async () => { await handleSave(); }}
                onDiscardAndExit={() => router.back()}
                onCancel={() => setShowUnsavedAlert(false)}
                isSaving={isSaving}
            />

            {isReadOnly && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-in fade-in duration-500">
                    <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1 leading-none pt-1">Theme Compatibility Warning</h4>
                        <p className="text-xs font-semibold leading-relaxed text-amber-800">
                            This content was created for a different theme ('<strong className="text-amber-900">{contentThemeName}</strong>') and cannot be edited in the current theme.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm sticky top-4 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editing Page</p>
                        <h1 className="text-xl font-bold text-slate-900 font-display">{formData.title || 'Untitled Page'}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        disabled={isReadOnly}
                        className="bg-slate-50 border-none text-xs font-bold text-slate-600 py-2.5 px-4 rounded-xl focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isReadOnly}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CloudArrowUpIcon className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Slug */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200/50 shadow-sm space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Page Title</label>
                            <input
                                type="text"
                                placeholder="Enter page title..."
                                value={formData.title}
                                disabled={isReadOnly}
                                onChange={e => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                                className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 font-display bg-transparent disabled:opacity-75 disabled:text-slate-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Slug</span>
                            <span className="text-slate-300 font-mono text-xs">/</span>
                            <input
                                value={formData.slug}
                                disabled={isReadOnly}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                className="bg-transparent border-none focus:ring-0 p-0 text-blue-600 font-bold text-xs min-w-[200px] disabled:opacity-75 disabled:text-blue-400"
                            />
                        </div>
                    </div>

                    {/* Page Sections (theme-driven) */}
                    {pageSectionSchema.length > 0 && !isReadOnly && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <Squares2X2Icon className="w-4 h-4 text-blue-500" />
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Page Sections</h3>
                            </div>
                            <SectionEditor
                                schema={pageSectionSchema}
                                sections={sections}
                                onChange={setSections}
                            />
                        </div>
                    )}

                    {/* Fallback content editor when no section schema */}
                    {pageSectionSchema.length === 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4 min-h-[500px]">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Page Content</h3>
                            <textarea
                                value={formData.content}
                                disabled={isReadOnly}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full h-[400px] bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none font-mono leading-relaxed disabled:opacity-75 disabled:text-slate-500 disabled:bg-slate-100/50"
                                placeholder="Type page content here..."
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* SEO Settings */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Metadata</h3>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Description</label>
                            <textarea
                                value={formData.description}
                                disabled={isReadOnly}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none mt-2 disabled:opacity-75 disabled:text-slate-500 disabled:bg-slate-100/50"
                                placeholder="Brief description for search engines..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
