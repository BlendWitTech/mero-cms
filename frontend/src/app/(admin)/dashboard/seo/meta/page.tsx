'use client';

import { useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    PencilIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    HomeIcon,
    XMarkIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { useNotification } from '@/context/NotificationContext';

interface SeoMeta { title?: string; description?: string; keywords?: string[]; ogImage?: string; ogImages?: string[]; }
interface ContentItem {
    id: string; title: string; slug: string; type: string; status: string;
    seo: SeoMeta | null;
}

function TypeBadge({ type }: { type: string }) {
    if (type === 'static') return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <HomeIcon className="h-3 w-3" /> Theme Page
        </span>
    );
    if (type === 'page') return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            <GlobeAltIcon className="h-3 w-3" /> Page
        </span>
    );
    if (type === 'plot') return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <MapPinIcon className="h-3 w-3" /> Plot
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            <DocumentTextIcon className="h-3 w-3" /> Post
        </span>
    );
}

function InlineSeoEditor({
    item,
    onSave,
    onClose,
}: {
    item: ContentItem;
    onSave: (item: ContentItem, meta: SeoMeta) => Promise<void>;
    onClose: () => void;
}) {
    const [meta, setMeta] = useState<SeoMeta>({
        title: item.seo?.title || '',
        description: item.seo?.description || '',
        keywords: item.seo?.keywords || [],
        ogImage: item.seo?.ogImage || '',
        ogImages: item.seo?.ogImages || [],
    });
    const [kwInput, setKwInput] = useState('');
    const [ogImgInput, setOgImgInput] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(item, meta);
        setSaving(false);
    };

    return (
        <tr className="bg-indigo-50/60 border-l-4 border-indigo-400">
            <td colSpan={5} className="px-6 py-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm font-bold text-slate-800">Edit SEO for: <span className="text-indigo-600">{item.title}</span></p>
                        <p className="text-xs text-slate-500 font-mono">{item.slug}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                        <XMarkIcon className="h-4 w-4 text-slate-500" />
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                            SEO Title <span className="text-slate-400 font-normal normal-case">({(meta.title || '').length}/60 chars)</span>
                        </label>
                        <input
                            type="text"
                            value={meta.title || ''}
                            onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
                            placeholder={`${item.title} | KTM Plots`}
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                            Meta Description <span className="text-slate-400 font-normal normal-case">({(meta.description || '').length}/160 chars)</span>
                        </label>
                        <textarea
                            value={meta.description || ''}
                            onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                            placeholder="Brief description of this page for search engines…"
                            rows={2}
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition-colors resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Keywords</label>
                        <div className="flex flex-wrap gap-1 mb-1">
                            {(meta.keywords || []).map((kw, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                    {kw}
                                    <button type="button" onClick={() => setMeta(m => ({ ...m, keywords: (m.keywords || []).filter((_, j) => j !== i) }))} className="hover:text-red-500">×</button>
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
                                    setMeta(m => ({ ...m, keywords: [...(m.keywords || []), kwInput.trim()] }));
                                    setKwInput('');
                                }
                            }}
                            placeholder="Type keyword and press Enter…"
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">OG Image (Primary)</label>
                        <input
                            type="url"
                            value={meta.ogImage || ''}
                            onChange={e => setMeta(m => ({ ...m, ogImage: e.target.value }))}
                            placeholder="https://…/og-image.jpg"
                            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Additional OG Images</label>
                        <div className="flex flex-col gap-1 mb-1">
                            {(meta.ogImages || []).map((url, i) => (
                                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                    <span className="flex-1 text-xs text-slate-600 truncate">{url}</span>
                                    <button type="button" onClick={() => setMeta(m => ({ ...m, ogImages: (m.ogImages || []).filter((_, j) => j !== i) }))} className="text-slate-400 hover:text-red-500 text-xs font-bold">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={ogImgInput}
                                onChange={e => setOgImgInput(e.target.value)}
                                placeholder="https://…/another-og-image.jpg"
                                className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => { if (ogImgInput.trim()) { setMeta(m => ({ ...m, ogImages: [...(m.ogImages || []), ogImgInput.trim()] })); setOgImgInput(''); } }}
                                className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 border border-indigo-200"
                            >Add</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : 'Save SEO'}
                    </button>
                    <button onClick={onClose} className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function MetaManagement() {
    const { showToast } = useNotification();
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const data = await apiRequest('/seo-meta/content-list');
            setContent(data);
        } catch (error) {
            console.error('Failed to fetch content list', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInline = async (item: ContentItem, meta: SeoMeta) => {
        try {
            const pageId = item.type === 'static'
                ? item.id.replace('static-', '') // e.g. 'static-home' → 'home'
                : item.id;
            await apiRequest('/seo-meta', {
                method: 'POST',
                body: { pageType: item.type, pageId, ...meta },
            });
            // Optimistically update local state
            setContent(prev => prev.map(c =>
                c.id === item.id ? { ...c, seo: meta } : c
            ));
            setEditingId(null);
            showToast('SEO metadata saved.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to save SEO.', 'error');
        }
    };

    const filteredContent = content.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Meta <span className="text-blue-600">Management</span>
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 font-medium">
                        View and update SEO metadata for all pages, posts, and plots
                    </p>
                </div>
                <div className="relative w-full sm:w-auto">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Search content..."
                        className="w-full sm:w-auto pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b-2 border-slate-100">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Content</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">SEO Status</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td>
                            </tr>
                        ) : filteredContent.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">No content found.</td>
                            </tr>
                        ) : (
                            filteredContent.flatMap((item) => {
                                const rows = [
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{item.title}</div>
                                            <div className="text-xs text-slate-500 font-mono">{item.slug}</div>
                                        </td>
                                        <td className="p-4">
                                            <TypeBadge type={item.type} />
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                                (item.status === 'PUBLISHED' || item.status === 'ACTIVE')
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {item.seo ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                    <span className="text-xs font-bold">Configured</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-500">
                                                    <ExclamationCircleIcon className="h-5 w-5" />
                                                    <span className="text-xs font-bold">Missing</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                >
                                                    <PencilIcon className="h-4 w-4" /> Edit SEO
                                                </button>
                                                {item.type !== 'static' && (
                                                    <Link
                                                        href={
                                                            item.type === 'post'
                                                                ? `/dashboard/blog?action=edit&id=${item.id}&from=seo`
                                                                : item.type === 'plot'
                                                                ? `/dashboard/plots?action=edit&id=${item.id}&from=seo`
                                                                : `/dashboard/pages/${item.id}?from=seo`
                                                        }
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                                    >
                                                        <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Content
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ];

                                if (editingId === item.id) {
                                    rows.push(
                                        <InlineSeoEditor
                                            key={`${item.id}-editor`}
                                            item={item}
                                            onSave={handleSaveInline}
                                            onClose={() => setEditingId(null)}
                                        />
                                    );
                                }

                                return rows;
                            })
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
