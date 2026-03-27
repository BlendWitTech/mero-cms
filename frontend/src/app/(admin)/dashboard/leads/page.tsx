'use client';

import React, { useState, useEffect } from 'react';
import {
    PencilSquareIcon,
    TrashIcon,
    EnvelopeIcon,
    PhoneIcon,
    UserIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '@/context/NotificationContext';
import { apiRequest } from '@/lib/api';

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ total: 0, newLeads: 0, contacted: 0, converted: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [canManageContent, setCanManageContent] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const { showToast } = useNotification();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [leadsData, statsData, profile] = await Promise.all([
                apiRequest('/leads'),
                apiRequest('/leads/stats'),
                apiRequest('/auth/profile'),
            ]);

            setLeads(Array.isArray(leadsData) ? leadsData : []);
            setStats(statsData || { total: 0, newLeads: 0, contacted: 0, converted: 0 });

            if (profile.role?.permissions?.manage_content || profile.role?.name === 'Super Admin' || profile.role?.name === 'Admin') {
                setCanManageContent(true);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await apiRequest(`/leads/${id}/status`, {
                method: 'PATCH',
                body: { status: newStatus },
            });
            showToast('Lead status updated!', 'success');
            fetchInitialData();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to update status.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            await apiRequest(`/leads/${id}`, { method: 'DELETE' });
            showToast('Lead deleted successfully!', 'success');
            fetchInitialData();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to delete lead.', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Lead <span className="text-blue-600 font-bold">Management</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Track and manage incoming leads from your website.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Leads</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-blue-200/50 shadow-sm bg-blue-50/30">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">New</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.newLeads}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-amber-200/50 shadow-sm bg-amber-50/30">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Contacted</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{stats.contacted}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-emerald-200/50 shadow-sm bg-emerald-50/30">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Converted</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.converted}</p>
                </div>
            </div>

            {/* Leads List */}
            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/10">
                    <div className="relative flex-1 md:w-48 group">
                        <FunnelIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-all" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="CONVERTED">Converted</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="pr-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
                                    </tr>
                                ))
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <UserIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No leads found.</p>
                                    </td>
                                </tr>
                            ) : (
                                leads
                                    .filter(lead => !statusFilter || lead.status === statusFilter)
                                    .map((lead) => (
                                        <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="pl-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <EnvelopeIcon className="h-3 w-3" />
                                                        <span>{lead.email}</span>
                                                    </div>
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <PhoneIcon className="h-3 w-3" />
                                                            <span>{lead.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-xs text-slate-600 line-clamp-2">{lead.message || 'No message'}</p>
                                            </td>
                                            <td className="px-4 py-5 text-xs font-semibold text-slate-500">{lead.originPage || 'Unknown'}</td>
                                            <td className="px-4 py-5">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    className={`text-[10px] font-black uppercase tracking-widest rounded-lg px-2.5 py-1 border-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer ${lead.status === 'NEW' ? 'bg-blue-50 text-blue-600' :
                                                        lead.status === 'CONTACTED' ? 'bg-amber-50 text-amber-600' :
                                                            lead.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-600' :
                                                                'bg-slate-50 text-slate-600'
                                                        }`}
                                                >
                                                    <option value="NEW">New</option>
                                                    <option value="CONTACTED">Contacted</option>
                                                    <option value="CONVERTED">Converted</option>
                                                    <option value="ARCHIVED">Archived</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-5 text-xs font-semibold text-slate-500">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="pr-8 py-5 text-right">
                                                {canManageContent && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleDelete(lead.id)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
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
