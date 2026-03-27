'use client';

import React, { useState, useEffect } from 'react';
import {
    DocumentMagnifyingGlassIcon,
    CloudArrowUpIcon,
    ShieldCheckIcon,
    NoSymbolIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function RobotsPage() {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const { showToast } = useNotification();

    useEffect(() => {
        fetchRobotsTxt();
    }, []);

    const fetchRobotsTxt = async () => {
        setIsLoading(true);
        try {
            const config = await apiRequest('/api/robots');
            setContent(config?.content || '');
            setLastUpdated(config?.updatedAt || null);
        } catch (error) {
            console.error('Failed to fetch robots.txt', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiRequest('/api/robots', {
                method: 'POST',
                body: { content }
            });
            showToast('Robots.txt updated successfully!', 'success');
            fetchRobotsTxt();
        } catch (error: any) {
            showToast(error.message || 'Failed to save robots.txt.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const insertDirective = (directive: string) => {
        const lines = content.split('\n');
        lines.push(directive);
        setContent(lines.join('\n'));
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <ArrowPathIcon className="h-10 w-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-500">Loading robots.txt configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                        Robots.txt <span className="text-blue-600 font-bold">Manager</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 font-semibold tracking-tight">Control how search engine crawlers interact with your website content.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRobotsTxt}
                        className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-x-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 leading-none disabled:opacity-50"
                    >
                        <CloudArrowUpIcon className="h-4 w-4" strokeWidth={3} />
                        {isSaving ? 'Saving...' : 'Publish Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200 overflow-hidden">
                        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">robots.txt editor</span>
                            </div>
                            {lastUpdated && (
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
                            )}
                        </div>
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-[500px] bg-slate-900 text-slate-300 font-mono text-xs p-8 focus:outline-none resize-none leading-relaxed selection:bg-blue-500/30"
                                placeholder="# Add your robots.txt rules here..."
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4">
                        <InformationCircleIcon className="h-6 w-6 text-blue-500 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-blue-900">Pro Tip</h4>
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                Robots.txt is a standard used by websites to communicate with web crawlers and other web robots.
                                Use it to hide private sections or prevent duplicate content from being indexed.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Actions</h3>

                        <div className="space-y-3">
                            <button
                                onClick={() => insertDirective('User-agent: *')}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Target All</p>
                                        <p className="text-xs font-bold text-slate-700">User-agent: *</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => insertDirective('Allow: /')}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Allow All</p>
                                        <p className="text-xs font-bold text-slate-700">Allow: /</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => insertDirective('Disallow: /api/')}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <NoSymbolIcon className="h-5 w-5 text-red-500" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Hide API</p>
                                        <p className="text-xs font-bold text-slate-700">Disallow: /api/</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => insertDirective('Disallow: /dashboard/')}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <NoSymbolIcon className="h-5 w-5 text-red-500" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Hide Admin</p>
                                        <p className="text-xs font-bold text-slate-700">Disallow: /dashboard/</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-2">Public Access</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-6">Your robots.txt file is publicly accessible at:</p>
                        <a
                            href="/robots.txt"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-mono text-xs hover:text-white transition-colors"
                        >
                            /robots.txt
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
