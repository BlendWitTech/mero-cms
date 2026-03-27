'use client';

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
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        SEO <span className="text-blue-600">Dashboard</span>
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 font-medium">
                        Manage your site's search engine optimization and visibility
                    </p>
                </div>
                <button onClick={fetchStats} disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all disabled:opacity-50">
                    <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* SEO Score Card */}
            <div className={`mb-8 bg-gradient-to-br ${scoreGradient} rounded-3xl p-8 text-white shadow-2xl`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest opacity-90 mb-2">SEO Coverage</p>
                        {isLoading ? (
                            <div className="h-16 w-40 bg-white/20 rounded-xl animate-pulse mt-1" />
                        ) : stats.totalPosts === 0 ? (
                            <div>
                                <p className="text-2xl font-black opacity-80">No content yet</p>
                                <p className="mt-2 text-sm opacity-75">Add blog posts, plots, or pages to start tracking SEO</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black">{seoScore}</span>
                                    <span className="text-2xl font-bold opacity-75">%</span>
                                </div>
                                <p className="mt-3 text-sm opacity-90">
                                    {stats.postsWithSeo} of {stats.totalPosts} content items have SEO metadata
                                </p>
                            </>
                        )}
                    </div>
                    <div className="h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <ChartBarIcon className="h-16 w-16" />
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <QuickActionCard
                    title="Meta Management"
                    description="Edit page titles, descriptions, and Open Graph tags"
                    icon={DocumentTextIcon}
                    onClick={() => router.push('/dashboard/seo/meta')}
                    color="blue"
                />
                <QuickActionCard
                    title="Redirects"
                    description={`Manage ${stats.redirects} active redirects`}
                    icon={ArrowPathIcon}
                    onClick={() => router.push('/dashboard/seo/redirects')}
                    color="purple"
                />
                <QuickActionCard
                    title="Robots.txt"
                    description="Configure search engine crawler rules"
                    icon={Cog6ToothIcon}
                    onClick={() => router.push('/dashboard/seo/robots')}
                    color="green"
                />
                <QuickActionCard
                    title="Analytics"
                    description="View traffic and performance metrics"
                    icon={ChartBarIcon}
                    onClick={() => router.push('/dashboard/analytics')}
                    color="amber"
                />
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusCard
                    title="Sitemap Status"
                    status="active"
                    description="Last generated: Just now"
                    action={() => window.open('/sitemap.xml', '_blank')}
                    actionLabel="View Sitemap"
                />
                <StatusCard
                    title="Robots.txt Status"
                    status="active"
                    description="Configured and active"
                    action={() => window.open('/robots.txt', '_blank')}
                    actionLabel="View Robots.txt"
                />
            </div>
        </div>
    );
}

function QuickActionCard({ title, description, icon: Icon, onClick, color }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
        green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
        amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
    };

    return (
        <button
            onClick={onClick}
            className={`${colorClasses[color]} p-6 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg text-left group`}
        >
            <Icon className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-black text-sm mb-1">{title}</h3>
            <p className="text-xs opacity-75 font-medium">{description}</p>
        </button>
    );
}

function StatusCard({ title, status, description, action, actionLabel }: any) {
    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-black text-slate-900 mb-1">{title}</h3>
                    <p className="text-xs text-slate-600 font-medium">{description}</p>
                </div>
                {status === 'active' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                )}
            </div>
            <button
                onClick={action}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
                {actionLabel} →
            </button>
        </div>
    );
}
