'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function NewPage() {
    const router = useRouter();
    const { showToast } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        seoTitle: '',
        description: '',
        keywords: [] as string[],
        ogImage: '',
        status: 'DRAFT',
    });
    const [kwInput, setKwInput] = useState('');

    const handleTitleChange = (title: string) => {
        const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        setFormData(prev => ({ ...prev, title, slug: prev.slug || autoSlug }));
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.slug.trim()) {
            showToast('Title and slug are required.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const page = await apiRequest('/pages', {
                method: 'POST',
                body: {
                    ...formData,
                    seo: {
                        title: formData.seoTitle || formData.title,
                        description: formData.description,
                        keywords: formData.keywords,
                        ogImage: formData.ogImage,
                    },
                },
            });
            showToast('Page created.', 'success');
            router.push(`/dashboard/pages/${page.id}`);
        } catch (error: any) {
            showToast(error.message || 'Failed to create page.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Create New</p>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">New Content Page</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 py-2.5 px-4 rounded-xl focus:ring-0 cursor-pointer"
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Creating...' : 'Create Page'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/[0.06] space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Page Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="e.g. Privacy Policy"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Slug</label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-3 py-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-white/10">/</span>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            placeholder="privacy-policy"
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-r-xl py-3 px-4 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Content (HTML)</label>
                    <textarea
                        rows={12}
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        placeholder="<h2>Page Title</h2><p>Your content here...</p>"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-xl py-3 px-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-y"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">SEO Title <span className="normal-case font-normal text-slate-300 dark:text-slate-600">({(formData.seoTitle || '').length}/60)</span></label>
                    <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                        placeholder={formData.title || 'Page title for search engines...'}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Meta Description <span className="normal-case font-normal text-slate-300 dark:text-slate-600">({(formData.description || '').length}/160)</span></label>
                    <textarea
                        rows={2}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description for search engines..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keywords</label>
                    <div className="flex flex-wrap gap-1 mb-1">
                        {formData.keywords.map((kw, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                {kw}
                                <button type="button" onClick={() => setFormData(f => ({ ...f, keywords: f.keywords.filter((_, j) => j !== i) }))} className="hover:text-red-500">×</button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={kwInput}
                        onChange={e => setKwInput(e.target.value)}
                        onKeyDown={e => {
                            if ((e.key === 'Enter' || e.key === ',') && kwInput.trim()) {
                                e.preventDefault();
                                setFormData(f => ({ ...f, keywords: [...f.keywords, kwInput.trim()] }));
                                setKwInput('');
                            }
                        }}
                        placeholder="Type keyword and press Enter…"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">OG Image URL</label>
                    <input
                        type="url"
                        value={formData.ogImage}
                        onChange={e => setFormData({ ...formData, ogImage: e.target.value })}
                        placeholder="https://…/og-image.jpg"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                    />
                </div>
            </div>
        </div>
    );
}
