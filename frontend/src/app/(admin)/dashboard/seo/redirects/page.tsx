'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowsRightLeftIcon,
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function RedirectsPage() {
    const [redirects, setRedirects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRedirect, setEditingRedirect] = useState<any>(null);
    const [formData, setFormData] = useState({
        fromPath: '',
        toPath: '',
        type: 301,
        isActive: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useNotification();

    useEffect(() => {
        fetchRedirects();
    }, []);

    const fetchRedirects = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/redirects');
            setRedirects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch redirects', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (redirect: any = null) => {
        if (redirect) {
            setEditingRedirect(redirect);
            setFormData({
                fromPath: redirect.fromPath,
                toPath: redirect.toPath,
                type: redirect.type,
                isActive: redirect.isActive
            });
        } else {
            setEditingRedirect(null);
            setFormData({
                fromPath: '',
                toPath: '',
                type: 301,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const url = editingRedirect ? `/redirects/${editingRedirect.id}` : '/redirects';
            const method = editingRedirect ? 'PATCH' : 'POST';

            await apiRequest(url, {
                method,
                body: formData
            });

            showToast(`Redirect ${editingRedirect ? 'updated' : 'created'} successfully!`, 'success');
            fetchRedirects();
            setIsModalOpen(false);
        } catch (error: any) {
            showToast(error.message || 'Failed to save redirect.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this redirect?')) return;
        try {
            await apiRequest(`/redirects/${id}`, { method: 'DELETE' });
            showToast('Redirect deleted successfully!', 'success');
            fetchRedirects();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete redirect.', 'error');
        }
    };

    const filteredRedirects = redirects.filter(r =>
        r.fromPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.toPath.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        URL <span className="text-blue-600 font-bold">Redirects</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Manage 301 and 302 redirects to prevent 404 errors and preserve SEO.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-x-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 leading-none"
                >
                    <PlusIcon className="h-4 w-4" strokeWidth={3} />
                    New Redirect
                </button>
            </div>

            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative group flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search redirects..."
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
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">From Path</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">
                                    <ArrowsRightLeftIcon className="h-4 w-4 mx-auto" />
                                </th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">To Path / URL</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Type</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Hits</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Status</th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : filteredRedirects.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 text-sm font-bold">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ArrowsRightLeftIcon className="w-8 h-8 text-slate-200" />
                                        </div>
                                        No redirects found. Create your first one to manage traffic!
                                    </td>
                                </tr>
                            ) : (
                                filteredRedirects.map((redirect) => (
                                    <tr key={redirect.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="pl-8 py-5">
                                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{redirect.fromPath}</span>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <ArrowsRightLeftIcon className="h-4 w-4 text-slate-300 mx-auto" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <span className="text-xs font-semibold text-slate-500">{redirect.toPath}</span>
                                        </td>
                                        <td className="px-4 py-5 font-mono text-[10px] font-black">
                                            {redirect.type}
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700">{redirect.hits}</span>
                                                <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(redirect.hits, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            {redirect.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    <CheckCircleIcon className="h-3 w-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    <XCircleIcon className="h-3 w-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="pr-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(redirect)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(redirect.id)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all">
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 font-display">{editingRedirect ? 'Edit Redirect' : 'New Redirect'}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prevent broken links</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <InformationCircleIcon className="h-5 w-5 text-amber-500 shrink-0" />
                                <p className="text-[11px] text-amber-700 leading-relaxed">
                                    Use <b>301 (Permanent)</b> for permanent changes to boost SEO. Use <b>302 (Found)</b> for temporary maintenance redirects.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From Path</label>
                                    <input
                                        type="text"
                                        value={formData.fromPath}
                                        onChange={(e) => setFormData({ ...formData, fromPath: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 mt-1"
                                        placeholder="/old-page-path"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To Path / URL</label>
                                    <input
                                        type="text"
                                        value={formData.toPath}
                                        onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 mt-1"
                                        placeholder="/new-page-path or https://..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Redirect Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 mt-1 appearance-none cursor-pointer"
                                        >
                                            <option value={301}>301 (Permanent)</option>
                                            <option value={302}>302 (Temporary)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                        <div className="flex items-center h-[46px] mt-1 bg-slate-50 rounded-xl border border-slate-200 px-4">
                                            <label className="flex items-center gap-2 cursor-pointer w-full">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/10"
                                                />
                                                <span className="text-xs font-bold text-slate-600">Active</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formData.fromPath || !formData.toPath}
                                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Redirect'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
