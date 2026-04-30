'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeftIcon,
    TrashIcon,
    InboxIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import { apiRequest, getApiBaseUrl } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';

interface FormField {
    name: string;
    label: string;
    type: string;
}

interface Form {
    id: string;
    name: string;
    slug: string;
    fields: FormField[];
}

interface Submission {
    id: string;
    formId: string;
    data: Record<string, any>;
    ip?: string;
    userAgent?: string;
    createdAt: string;
}

export default function FormSubmissionsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { showToast } = useNotification();

    const [form, setForm] = useState<Form | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [formData, subsData] = await Promise.all([
                apiRequest(`/forms/${id}`),
                apiRequest(`/forms/${id}/submissions`),
            ]);
            setForm(formData);
            setSubmissions(Array.isArray(subsData) ? subsData : []);
        } catch {
            showToast('Failed to load submissions', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function handleDelete() {
        if (!deleteId) return;
        try {
            await apiRequest(`/forms/${id}/submissions/${deleteId}`, { method: 'DELETE' });
            showToast('Submission deleted', 'success');
            setDeleteId(null);
            fetchData();
        } catch {
            showToast('Delete failed', 'error');
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleString();
    }

    function getDisplayValue(value: any): string {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return String(value).slice(0, 120) || '—';
    }

    if (isLoading) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="content-skeleton h-8 w-48 mb-6" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="content-skeleton h-16" />)}
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="p-6 max-w-5xl mx-auto text-center py-20">
                <p className="text-slate-500">Form not found.</p>
                <button onClick={() => router.push('/dashboard/forms')} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
                    Back to Forms
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard/forms')}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{form.name}</h1>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {submissions.length > 0 && (
                    <a
                        href={`${getApiBaseUrl()}/forms/${form.id}/submissions/export/csv`}
                        download={`${form.slug}-submissions.csv`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all active:scale-95 whitespace-nowrap"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export CSV
                    </a>
                )}
            </div>

            {/* Empty state */}
            {submissions.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <InboxIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No submissions yet</p>
                    <p className="text-sm text-slate-400">Submissions will appear here once visitors fill out the form</p>
                </div>
            )}

            {/* Submissions list */}
            {submissions.length > 0 && (
                <div className="space-y-3">
                    {submissions.map(sub => {
                        const isExpanded = expandedId === sub.id;
                        // Get first few field values for preview
                        const previewFields = form.fields.slice(0, 3);
                        return (
                            <div
                                key={sub.id}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-200 transition-colors"
                            >
                                {/* Row */}
                                <div
                                    className="flex items-center px-4 py-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {previewFields.map(field => (
                                                <div key={field.name} className="min-w-0">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{field.label}</span>
                                                    <span className="text-sm font-semibold text-slate-700 truncate block max-w-[180px]">
                                                        {getDisplayValue(sub.data[field.name])}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4 shrink-0">
                                        <span className="text-xs text-slate-400">{formatDate(sub.createdAt)}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteId(sub.id); }}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/50">
                                        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {form.fields.map(field => (
                                                <div key={field.name}>
                                                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.label}</dt>
                                                    <dd className="text-sm text-slate-700 mt-0.5 break-words">
                                                        {getDisplayValue(sub.data[field.name])}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {(sub.ip || sub.userAgent) && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-[10px] text-slate-400">
                                                {sub.ip && <span>IP: {sub.ip}</span>}
                                                {sub.userAgent && <span className="truncate max-w-sm">UA: {sub.userAgent}</span>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AlertDialog
                isOpen={!!deleteId}
                title="Delete Submission"
                description="This submission will be permanently deleted."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
