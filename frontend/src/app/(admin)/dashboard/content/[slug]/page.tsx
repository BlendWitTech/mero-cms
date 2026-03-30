'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    TableCellsIcon,
    MagnifyingGlassIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function CollectionContentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [collection, setCollection] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useNotification();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [slug]);

    useEffect(() => {
        if (!isLoading && collection && collection.type === 'SINGLETON') {
            if (items.length > 0) {
                // Redirect immediately to edit the first (and only) item
                window.location.href = `/dashboard/content/${slug}/${items[0].id}`;
            } else {
                // Redirect to create the first item
                window.location.href = `/dashboard/content/${slug}/new`;
            }
        }
    }, [isLoading, collection, items, slug]);

    const fetchData = async () => {
        try {
            // Fetch collection schema
            // We need a find-by-slug endpoint or we just fetch all and filter for now
            // Actually, let's assume we have /collections/slug/:slug
            const collections = await apiRequest('/collections');
            const col = collections.find((c: any) => c.slug === slug);

            if (!col) {
                showToast('Collection not found', 'error');
                return;
            }
            setCollection(col);

            // Fetch items for this collection
            const contentItems = await apiRequest(`/content-items?collectionId=${col.id}`);
            setItems(contentItems);
        } catch (error) {
            console.error(error);
            showToast('Failed to load content', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            await apiRequest(`/content-items/${itemToDelete}`, { method: 'DELETE' });
            showToast('Item deleted successfully', 'success');
            setItems(items.filter(item => item.id !== itemToDelete));
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            showToast('Failed to delete item', 'error');
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (!collection) return <div className="p-10 text-center text-red-500 font-bold">Collection not found</div>;

    // Determine which fields to show in the table (max 4-5)
    const tableFields = collection.fields.slice(0, 4);

    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Entry"
                message="Are you sure you want to delete this entry? This action cannot be undone."
                confirmText="Delete Entry"
                variant="danger"
            />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/collections" className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                            {collection.name}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                            Manage entries for {collection.name}.
                        </p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/content/${slug}/new`}
                    className="inline-flex items-center gap-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 leading-none"
                >
                    <PlusIcon className="h-4 w-4" strokeWidth={3} />
                    Add New Entry
                </Link>
            </div>

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/10">
                    <div className="relative flex-1 group">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${collection.name}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                {tableFields.map((field: any) => (
                                    <th key={field.name} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {field.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={tableFields.length + 3} className="px-8 py-20 text-center">
                                        <TableCellsIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No entries found.</p>
                                    </td>
                                </tr>
                            ) : (
                                items
                                    .filter(item => {
                                        // Simple search across all data values
                                        const values = Object.values(item.data).join(' ').toLowerCase();
                                        return values.includes(searchQuery.toLowerCase());
                                    })
                                    .map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            {tableFields.map((field: any) => (
                                                <td key={field.name} className="px-6 py-5">
                                                    {field.type === 'image' ? (
                                                        item.data[field.name] ? (
                                                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                                                <img src={item.data[field.name]} className="h-full w-full object-cover" />
                                                            </div>
                                                        ) : <span className="text-slate-300">-</span>
                                                    ) : field.type === 'color' ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: item.data[field.name] }} />
                                                            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">{item.data[field.name]}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-700 truncate max-w-[200px] block">
                                                            {String(item.data[field.name] || '')}
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${item.isPublished ? 'bg-emerald-50 text-emerald-600 ring-emerald-600/20' : 'bg-amber-50 text-amber-600 ring-amber-600/20'}`}>
                                                    {item.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="pr-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/content/${slug}/${item.id}`}
                                                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => confirmDelete(item.id)}
                                                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
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
