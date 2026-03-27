'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    PencilSquareIcon,
    Bars3Icon,
    LinkIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { format } from 'date-fns';

export default function MenusManagement() {
    const [menus, setMenus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useNotification();

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            const data = await apiRequest('/menus');
            setMenus(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch menus', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete menu "${name}"? This cannot be undone.`)) return;
        try {
            await apiRequest(`/menus/${id}`, { method: 'DELETE' });
            showToast('Menu deleted', 'success');
            fetchMenus();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete menu', 'error');
        }
    };



    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Navigation <span className="text-blue-600">Menus</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Menus are automatically extracted from your theme. Edit names and URLs as needed.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-2xl border border-blue-200">
                        <Bars3Icon className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Auto-Synced</span>
                    </div>
                    <Link
                        href="/dashboard/menus/new"
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-sm"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
                        New Menu
                    </Link>
                </div>
            </div>

            {/* Menus List */}
            <div className="mx-2 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Menus...</p>
                    </div>
                ) : menus.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu Details</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">API Slug</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Links Count</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {menus.map((menu) => (
                                    <tr key={menu.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                    <Bars3Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{menu.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-300 mt-0.5 whitespace-nowrap">CREATED {format(new Date(menu.createdAt), 'MMM dd, yyyy')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 font-mono">
                                                {menu.slug}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">
                                                    {menu.items ? menu.items.length : 0} items
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/menus/${menu.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
                                                    title="Edit Menu Items"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                    Edit Items
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(menu.id, menu.name)}
                                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Delete menu"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6">
                            <Bars3Icon className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">No Menus Found</h3>
                        <p className="text-slate-500 font-medium mt-2 max-w-sm">
                            Menus will be automatically extracted when you upload a theme. Upload a theme to get started.
                        </p>
                        <Link
                            href="/dashboard/themes"
                            className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                            Go to Themes
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
