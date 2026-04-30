'use client';

import PageHeader from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChartBarIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';

export default function SEODashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalPosts: 0,
        postsWithSeo: 0,
        redirects: 0,
        sitemapLastGenerated: null as Date | null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/seo-meta/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch SEO stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const seoScore = stats.totalPosts > 0
        ? Math.round((stats.postsWithSeo / stats.totalPosts) * 100)
        : 0;
    const scoreGradient = seoScore >= 80
        ? 'from-emerald-500 to-emerald-600'
        : seoScore >= 50
            ? 'from-blue-600 to-blue-700'
            : 'from-amber-500 to-amber-600';

    return (
        <>
            <PageHeader
                title="Search Engine"
                accent="Optimization"
                subtitle="Manage your site's search engine optimization and visibility"
                actions={
                    <button onClick={fetchStats} disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all active:scale-95"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Stats
                    </button>
                }
            />

            {/* SEO Coverage & Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Score Card */}
                <div className={`lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${scoreGradient} p-10 text-white shadow-2xl shadow-blue-600/10 transition-all duration-500`}>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">Content Coverage Score</p>
                        {isLoading ? (
                            <div className="h-16 w-40 bg-white/20 rounded-2xl animate-pulse mt-1" />
                        ) : stats.totalPosts === 0 ? (
                            <div>
                                <h2 className="text-3xl font-black">No Content Tracked</h2>
                                <p className="mt-2 text-sm opacity-80 font-medium">Add blog posts or pages to start analyzing SEO metadata.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row md:items-end gap-10">
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black">{seoScore}</span>
                                        <span className="text-2xl font-black opacity-60">%</span>
                                    </div>
                                    <p className="mt-4 text-sm font-bold opacity-90 max-w-xs">
                                        {stats.postsWithSeo} of {stats.totalPosts} content items have been optimized with SEO metadata.
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${seoScore}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <span>Coverage Progress</span>
                                        <span>Target 100%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Decorative Icon */}
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <ChartBarIcon className="h-64 w-64" />
                    </div>
                </div>

                {/* Redirects/Sitemap Quick Info */}
                <div className="space-y-6">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/[0.06] p-8 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Active Redirects</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.redirects}</h3>
                        <p className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Routing Rules</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/[0.06] p-8 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Sitemap Status</p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Healthy</h3>
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last updated: Just now</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Title */}
            <div className="mb-6 flex items-center gap-4">
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Management Console</h2>
                <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <QuickActionCard
                    title="Meta Management"
                    description="Edit page titles, descriptions, and OG tags"
                    icon={DocumentTextIcon}
                    onClick={() => router.push('/dashboard/seo/meta')}
                    color="blue"
                />
                <QuickActionCard
                    title="Redirects"
                    description={`Manage active routing rules`}
                    icon={ArrowPathIcon}
                    onClick={() => router.push('/dashboard/seo/redirects')}
                    color="purple"
                />
                <QuickActionCard
                    title="Robots.txt"
                    description="Configure crawler rules"
                    icon={Cog6ToothIcon}
                    onClick={() => router.push('/dashboard/seo/robots')}
                    color="green"
                />
                <QuickActionCard
                    title="Site Analytics"
                    description="Performance metrics"
                    icon={ChartBarIcon}
                    onClick={() => router.push('/dashboard/analytics')}
                    color="amber"
                />
            </div>

            {/* System Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusCard
                    title="Sitemap Status"
                    status="active"
                    description="Search engines can discover all your public pages via sitemap.xml"
                    action={() => window.open('/sitemap.xml', '_blank')}
                    actionLabel="View Sitemap"
                />
                <StatusCard
                    title="Robots.txt Status"
                    status="active"
                    description="Crawler permissions are correctly configured and live on your domain"
                    action={() => window.open('/robots.txt', '_blank')}
                    actionLabel="View Robots.txt"
                />
            </div>
        </>
    );
}

function QuickActionCard({ title, description, icon: Icon, onClick, color }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10 hover:bg-blue-600 hover:text-white',
        purple: 'bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/10 hover:bg-purple-600 hover:text-white',
        green: 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10 hover:bg-emerald-600 hover:text-white',
        amber: 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/10 hover:bg-amber-600 hover:text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`${colorClasses[color]} p-8 rounded-[2rem] border backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-current/10 text-left group flex flex-col items-start gap-4`}
        >
            <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 shadow-sm group-hover:bg-white/20 transition-colors">
                <Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
                <h3 className="font-black text-sm uppercase tracking-tight mb-1">{title}</h3>
                <p className="text-[10px] font-bold opacity-70 leading-relaxed uppercase tracking-widest">{description}</p>
            </div>
        </button>
    );
}

function StatusCard({ title, status, description, action, actionLabel }: any) {
    return (
        <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-white/[0.06] rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{title}</h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{description}</p>
                </div>
                <div className={`p-3 rounded-2xl ${status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    {status === 'active' ? (
                        <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                        <ExclamationTriangleIcon className="h-6 w-6" />
                    )}
                </div>
            </div>
            <button
                onClick={action}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-300"
            >
                {actionLabel}
            </button>
        </div>
    );
}
