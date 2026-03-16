'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DocumentTextIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    PencilIcon,
    MagnifyingGlassIcon,
    CubeIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';

export default function MetaManagement() {
    const router = useRouter();
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    const filteredContent = content.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Meta <span className="text-blue-600">Management</span>
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 font-medium">
                        View and update SEO metadata for all your pages and posts
                    </p>
                </div>
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Search content..."
                        className="pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
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
                            filteredContent.map((item) => (
                                <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{item.title}</div>
                                        <div className="text-xs text-slate-500 font-mono">{item.slug}</div>
                                    </td>
                                    <td className="p-4">
                                        {item.type === 'page' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                                                <GlobeAltIcon className="h-3 w-3" /> Page
                                            </span>
                                        ) : item.type === 'project' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                                <CubeIcon className="h-3 w-3" /> Project
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                                <DocumentTextIcon className="h-3 w-3" /> Post
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${(item.status === 'PUBLISHED' || item.status === 'ACTIVE')
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
                                        <Link
                                            href={
                                                item.type === 'post'
                                                    ? `/dashboard/blog?action=edit&id=${item.id}&from=seo`
                                                    : `/dashboard/pages/${item.id}?from=seo`
                                            }
                                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                                        >
                                            <PencilIcon className="h-4 w-4" /> Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
