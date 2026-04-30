'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    ChatBubbleLeftRightIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import AlertDialog from '@/components/ui/AlertDialog';

import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';

function CommentsContent() {
    // ... logic remains
    const searchParams = useSearchParams();
    const postIdFilter = searchParams.get('postId');
    const { showToast } = useNotification();

    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        fetchComments();
    }, [postIdFilter]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/comments');
            let filtered = Array.isArray(data) ? data : [];
            if (postIdFilter) { filtered = filtered.filter(c => c.postId === postIdFilter); }
            setComments(filtered);
        } catch (error) {
            console.error(error);
            showToast('Failed to load comments', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await apiRequest(`/comments/${id}/status`, { method: 'PATCH', body: { status } });
            showToast('Comment status updated', 'success');
            fetchComments();
        } catch (error) {
            console.error(error);
            showToast('Failed to update status', 'error');
        }
    };

    const deleteComment = async (id: string) => {
        try {
            await apiRequest(`/comments/${id}`, { method: 'DELETE', skipNotification: true });
            showToast('Comment deleted', 'success');
            fetchComments();
        } catch (error) {
            console.error(error);
            showToast('Failed to delete comment', 'error');
        }
    };

    const filteredComments = comments.filter(comment =>
        comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comment.authorName && comment.authorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader 
                title="User" 
                accent="Comments" 
                subtitle={postIdFilter ? 'Showing comments for selected post.' : 'Moderate and manage user interaction.'} 
            />

            {/* Email notification note */}
            <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 rounded-[2rem] px-6 py-4">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed uppercase tracking-widest opacity-80">
                    Comment notification emails are sent to your company&apos;s contact email address configured in{' '}
                    <a href="/dashboard/settings" className="underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-200">Settings</a>.
                </p>
            </div>

            <FilterBar 
                search={{
                    value: searchTerm,
                    onChange: setSearchTerm,
                    placeholder: "Search comments by author or content..."
                }}
            />

            {/* Unified Content Card */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 dark:border-white/[0.06] overflow-hidden transition-all duration-500">

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/30 dark:bg-transparent">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">User</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/2">Comment</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Article</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="pr-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr >
                                    <td colSpan={5} className="px-8 py-8"><div className="content-skeleton h-12" /></td>
                                </tr>
                            ) : filteredComments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">
                                            {postIdFilter ? 'No comments found for this post.' : 'No comments yet.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredComments.map((comment) => (
                                    <tr key={comment.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="pl-8 py-5">
                                            <p className="text-sm font-bold text-slate-900">{comment.authorName || comment.user?.name || 'Anonymous'}</p>
                                            <p className="text-xs text-slate-400">{comment.authorEmail || comment.user?.email}</p>
                                        </td>
                                        <td className="px-4 py-5 text-sm text-slate-600 font-medium leading-relaxed">
                                            "{comment.content}"
                                        </td>
                                        <td className="px-4 py-5 font-bold text-xs text-blue-600">
                                            {comment.post?.slug || '-'}
                                        </td>
                                        <td className="px-4 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${comment.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 ring-emerald-600/20' :
                                                    comment.status === 'SPAM' ? 'bg-red-50 text-red-600 ring-red-600/20' :
                                                        'bg-amber-50 text-amber-600 ring-amber-600/20'
                                                }`}>
                                                {comment.status}
                                            </span>
                                        </td>
                                        <td className="pr-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => updateStatus(comment.id, 'APPROVED')} title="Approve" className="btn-ghost p-2 text-emerald-500 hover:text-emerald-600">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => updateStatus(comment.id, 'SPAM')} title="Mark Spam" className="btn-ghost p-2 text-amber-500 hover:text-amber-600">
                                                    <XCircleIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteDialog({ isOpen: true, id: comment.id })} title="Delete" className="btn-ghost p-2 text-red-400 hover:text-red-500">
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

            <AlertDialog
                isOpen={deleteDialog.isOpen}
                variant="danger"
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={() => {
                    if (deleteDialog.id) deleteComment(deleteDialog.id);
                    setDeleteDialog({ isOpen: false, id: null });
                }}
                onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
            />
        </div>
    );
}

export default function CommentsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 animate-pulse px-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 h-64" />
            </div>
        }>
            <CommentsContent />
        </Suspense>
    );
}
