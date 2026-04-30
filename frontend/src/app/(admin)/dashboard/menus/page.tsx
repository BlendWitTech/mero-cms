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
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AlertDialog from '@/components/ui/AlertDialog';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';

export default function MenusManagement() {
    const router = useRouter();
    const [menus, setMenus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
        setDeleteId(id);
        setDeleteName(name);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await apiRequest(`/menus/${deleteId}`, { method: 'DELETE' });
            showToast('Menu deleted', 'success');
            setDeleteId(null);
            fetchMenus();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete menu', 'error');
        } finally {
            setIsDeleting(false);
        }
    };



    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <PageHeader
                title="Navigation" 
                accent="Menus" 
                subtitle="Menus are automatically extracted from your theme. Edit names and URLs as needed."
                actions={
                    <>
                        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-4 py-2.5 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                            <Bars3Icon className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Auto-Synced</span>
                        </div>
                        <Link
                            href="/dashboard/menus/new"
                            className="btn-primary px-6 py-3 text-sm"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            New Menu
                        </Link>
                    </>
                }
            />

            <FilterBar 
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: "Search menus by name or slug…"
                }}
            />

            {/* Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Menus...</p>
                    </div>
                ) : menus.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="pl-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Menu Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">API Slug</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Links Count</th>
                                    <th className="pr-10 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {menus
                                    .filter(menu => 
                                        menu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        menu.slug.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((menu) => (
                                    <tr key={menu.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    <Bars3Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/menus/${menu.id}`)}>{menu.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">Global Navigation</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-mono">
                                                {menu.slug}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{(menu.links as any)?.length || 0}</span>
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-0.5">Active Links</span>
                                            </div>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => router.push(`/dashboard/menus/${menu.id}`)}
                                                    className="btn-ghost p-2 text-blue-600"
                                                    title="Edit links"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(menu.id, menu.name)}
                                                    className="btn-ghost p-2 text-red-600"
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
                    <div className="py-24">
                        <EmptyState 
                            naked
                            icon={Bars3Icon}
                            title="No Menus Found"
                            description="Menus will be automatically extracted when you upload a theme. Upload a theme to get started."
                            action={{
                                label: "Go to Themes",
                                href: "/dashboard/themes"
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                isOpen={!!deleteId}
                title="Delete Menu"
                description={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
