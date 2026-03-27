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

function CommentsContent() {
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
            // If filtering by post, we might want to use a specific endpoint or just filter client/server side
            // For now, assuming backend returns all and we filter or backend supports query
            // Let's try fetching all and filtering client side for now to be safe, 
            // or if backend supports it: /comments?postId=...
            const data = await apiRequest('/comments');
            let filtered = Array.isArray(data) ? data : [];

            if (postIdFilter) {
                filtered = filtered.filter(c => c.postId === postIdFilter);
            }

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
            await apiRequest(`/comments/${id}/status`, {
                method: 'PATCH',
                body: { status }
            });
            showToast('Comment status updated', 'success');
            fetchComments(); // Refresh to reflect changes
        } catch (error) {
            console.error(error);
            showToast('Failed to update status', 'error');
        }
    };

    const deleteComment = async (id: string) => {
        try {
            await apiRequest(`/comments/${id}`, {
                method: 'DELETE',
                skipNotification: true
            });
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        User <span className="text-blue-600 font-bold">Comments</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">
                        {postIdFilter ? 'Showing comments for selected post.' : 'Moderate and manage user interaction.'}
                    </p>
                </div>
            </div>

            {/* Email notification note */}
            <div className="mx-2 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                    Comment notification emails are sent to your company&apos;s contact email address configured in{' '}
                    <a href="/dashboard/settings" className="underline underline-offset-2 hover:text-blue-900">Settings → Website &amp; Social</a>.
                </p>
            </div>

            {/* List */}
            <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/10 gap-4">
                    <div className="relative max-w-sm w-full group">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search comments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="pl-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/2">Comment</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Article</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="pr-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr className="animate-pulse">
                                    <td colSpan={5} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl" /></td>
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
                                                <button onClick={() => updateStatus(comment.id, 'APPROVED')} title="Approve" className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => updateStatus(comment.id, 'SPAM')} title="Mark Spam" className="p-2 rounded-lg bg-white border border-slate-200 text-amber-500 hover:bg-amber-50 hover:border-amber-200 transition-all">
                                                    <XCircleIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteDialog({ isOpen: true, id: comment.id })} title="Delete" className="p-2 rounded-lg bg-white border border-slate-200 text-red-400 hover:text-red-500 hover:border-red-200 transition-all">
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
        <Suspense fallback={<div>Loading...</div>}>
            <CommentsContent />
        </Suspense>
    );
}
