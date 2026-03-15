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
        description: '',
        status: 'DRAFT',
    });

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
                    seo: { title: formData.title, description: formData.description },
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
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm sticky top-4 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create New</p>
                        <h1 className="text-xl font-bold text-slate-900 font-display">New Content Page</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="bg-slate-50 border-none text-xs font-bold text-slate-600 py-2.5 px-4 rounded-xl focus:ring-0 cursor-pointer"
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

            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Page Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="e.g. Privacy Policy"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slug</label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-3 rounded-l-xl border border-r-0 border-slate-200">/</span>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            placeholder="privacy-policy"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-r-xl py-3 px-4 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-300"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Content (HTML)</label>
                    <textarea
                        rows={12}
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        placeholder="<h2>Page Title</h2><p>Your content here...</p>"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-y"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Description (SEO)</label>
                    <textarea
                        rows={2}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description for search engines..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
