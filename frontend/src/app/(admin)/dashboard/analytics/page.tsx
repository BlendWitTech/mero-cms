'use client';

import PageHeader from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, UsersIcon, EyeIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function AnalyticsPage() {
    const [config, setConfig] = useState({
        ga4MeasurementId: '',
        ga4PropertyId: '',
        serviceAccountEmail: '',
        privateKey: '',
        gscPropertyUrl: '',
        fbPixelId: '',
        isActive: true,
    });
    const [dashboard, setDashboard] = useState<any>(null);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [trend, setTrend] = useState<any[]>([]);
    const [trendDays, setTrendDays] = useState(7);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { showToast } = useNotification();

    useEffect(() => {
        fetchConfig();
        fetchDashboard();
        fetchTrend(trendDays);
    }, []);

    const fetchTrend = async (days: number) => {
        try {
            const data = await apiRequest(`/analytics/trend?days=${days}`);
            setTrend(Array.isArray(data) ? data.map(d => ({
                ...d,
                label: d.date ? `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}` : '',
            })) : []);
        } catch {
            setTrend([]);
        }
    };

    const fetchConfig = async () => {
        try {
            const data = await apiRequest('/analytics/config');
            if (data) {
                setConfig(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics config', error);
        }
    };

    const fetchDashboard = async () => {
        try {
            setDashboardError(null);
            const data = await apiRequest('/analytics/dashboard');
            setDashboard(data);
        } catch (error: any) {
            console.error('Failed to fetch dashboard data', error);
            setDashboardError(error.message || 'Failed to load analytics data');
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const result = await apiRequest('/analytics/test', {
                method: 'POST',
                body: config
            });
            if (result.success) {
                showToast(result.message, 'success');
            }
        } catch (error: any) {
            showToast(error.message || 'Connection test failed', 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiRequest('/analytics/config', {
                method: 'POST',
                body: config,
            });
            showToast('Analytics settings saved successfully', 'success');
            setIsEditing(false);
        } catch (error) {
            showToast('Failed to save analytics settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchConfig(); // Revert changes
    };

    return (
        <>
            <PageHeader
                title="System"
                accent="Analytics"
                subtitle="Track your site's performance and geographic reach"
                actions={
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all active:scale-95 shrink-0"
                    >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Configure Tracking
                    </button>
                }
            />

            {/* Dashboard Metrics */}
            {dashboardError ? (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[2rem] p-8 flex items-start gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-red-900 dark:text-red-300 font-black text-lg mb-1">Connection Interrupted</h3>
                        <p className="text-red-700 dark:text-red-400 text-sm font-medium">{dashboardError}</p>
                        <button onClick={() => setIsEditing(true)} className="mt-4 text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:underline">Reconfigure Settings →</button>
                    </div>
                </div>
            ) : !dashboard ? (
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="content-skeleton h-40 rounded-[2rem]" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="content-skeleton h-32 rounded-[2rem]" />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Primary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Total Page Views"
                            value={dashboard.summary.pageViews.today.toLocaleString()}
                            change={dashboard.summary.pageViews.change}
                            icon={EyeIcon}
                            color="blue"
                            detail="Views Today"
                        />
                        <MetricCard
                            title="Unique Visitors"
                            value={dashboard.summary.visitors.today.toLocaleString()}
                            change={dashboard.summary.visitors.change}
                            icon={UsersIcon}
                            color="purple"
                            detail="Daily Users"
                        />
                        <MetricCard
                            title="Real-time Traffic"
                            value={dashboard.realTimeVisitors.toString()}
                            subtitle="Active now"
                            icon={ArrowTrendingUpIcon}
                            color="emerald"
                            detail="Live Session"
                        />
                        <MetricCard
                            title="Total Sessions"
                            value={dashboard.summary.sessions.today.toLocaleString()}
                            change={dashboard.summary.sessions.change}
                            icon={ChartBarIcon}
                            color="amber"
                            detail="Visit Count"
                        />
                    </div>

                    {dashboard.realTimeVisitors === 0 && (
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-xl border border-amber-100 dark:border-amber-900/40 rounded-[2rem] p-6 flex gap-4">
                            <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-2xl h-fit">
                                <EyeIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="text-sm">
                                <p className="text-amber-900 dark:text-amber-300 font-black uppercase tracking-tight">No Active Visitors Tracked</p>
                                <p className="text-amber-800 dark:text-amber-400 opacity-80 mt-1 font-medium leading-relaxed">
                                    Ensure your <strong>GA4 Property</strong> is active and tracking is enabled. If you are testing locally, ensure you are not using an ad-blocker.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/[0.06] rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Engagement Rate</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{(dashboard.summary.engagementRate.today * 100).toFixed(1)}%</span>
                                <span className={`text-xs font-black flex items-center gap-1 ${dashboard.summary.engagementRate.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {dashboard.summary.engagementRate.change >= 0 ? '↑' : '↓'} {Math.abs(dashboard.summary.engagementRate.change).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/[0.06] rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Avg Duration</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{Math.floor(dashboard.summary.avgSessionDuration.today / 60)}m {Math.floor(dashboard.summary.avgSessionDuration.today % 60)}s</span>
                                <span className={`text-xs font-black flex items-center gap-1 ${dashboard.summary.avgSessionDuration.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {dashboard.summary.avgSessionDuration.change >= 0 ? '↑' : '↓'} {Math.abs(dashboard.summary.avgSessionDuration.change).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/[0.06] rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">User Growth</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{dashboard.summary.newUsers.today.toLocaleString()}</span>
                                <span className={`text-xs font-black flex items-center gap-1 ${dashboard.summary.newUsers.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {dashboard.summary.newUsers.change >= 0 ? '↑' : '↓'} {Math.abs(dashboard.summary.newUsers.change).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Traffic Trend</h2>
                            <div className="flex gap-2">
                                {[7, 14, 30].map(d => (
                                    <button key={d} onClick={() => { setTrendDays(d); fetchTrend(d); }}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${trendDays === d ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </div>
                        {trend.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No trend data — configure GA4 to see charts</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', fontSize: '12px', fontWeight: 700, backgroundColor: '#1e293b', color: '#f1f5f9' }} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                                    <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#2563eb" strokeWidth={2} fill="url(#pvGrad)" dot={false} />
                                    <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#7c3aed" strokeWidth={2} fill="url(#visGrad)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Traffic Sources */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Traffic Sources</h2>
                            {dashboard.trafficSources.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No traffic source data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={dashboard.trafficSources} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', fontSize: '12px', fontWeight: 700, backgroundColor: '#1e293b', color: '#f1f5f9' }} />
                                        <Bar dataKey="visitors" name="Users" fill="#2563eb" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Device Categories */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Devices</h2>
                            {dashboard.devices.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No device data</div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <ResponsiveContainer width="50%" height={180}>
                                        <PieChart>
                                            <Pie data={dashboard.devices} dataKey="visitors" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={75} strokeWidth={0}>
                                                {dashboard.devices.map((_: any, idx: number) => {
                                                    const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];
                                                    return <Cell key={idx} fill={COLORS[idx % COLORS.length]} />;
                                                })}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', fontSize: '12px', fontWeight: 700, backgroundColor: '#1e293b', color: '#f1f5f9' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex-1 space-y-3">
                                        {dashboard.devices.map((d: any, idx: number) => {
                                            const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];
                                            return (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize flex-1">{d.label}</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{d.percentage}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Pages */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Top Content</h2>
                            <div className="overflow-hidden">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                                            <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Page Path</th>
                                            <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Views</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {dashboard.topPages.map((page: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-4 text-xs font-bold text-slate-800 dark:text-slate-300 truncate max-w-[200px]">{page.path}</td>
                                                <td className="py-4 text-xs font-bold text-slate-900 dark:text-white text-right">{page.views.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Locations</h2>
                            <div className="space-y-4">
                                {dashboard.locations.slice(0, 5).map((loc: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">{loc.country}</span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{loc.visitors} users</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Centered Configuration Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
                    onClick={handleCancel}
                />

                {/* Modal Container */}
                <div
                    className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl transition-all duration-300 transform ${isEditing ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Configuration</h2>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">Analytics Tracking Settings</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2 bg-slate-50 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all group"
                        >
                            <XMarkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                        GA4 Measurement ID
                                    </label>
                                    <input
                                        type="text"
                                        value={config.ga4MeasurementId || ''}
                                        onChange={(e) => setConfig({ ...config, ga4MeasurementId: e.target.value })}
                                        placeholder="G-XXXXXXX"
                                        className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/10 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-950/50 dark:text-white focus:bg-white dark:focus:bg-slate-950 transition-all"
                                    />
                                    <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                                        Data Stream settings
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                        Property ID
                                    </label>
                                    <input
                                        type="text"
                                        value={config.ga4PropertyId || ''}
                                        onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/10 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-950/50 dark:text-white focus:bg-white dark:focus:bg-slate-950 transition-all"
                                        placeholder="123456789"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                    Service Email
                                </label>
                                <input
                                    type="email"
                                    value={config.serviceAccountEmail || ''}
                                    onChange={(e) => setConfig({ ...config, serviceAccountEmail: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/10 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-950/50 dark:text-white focus:bg-white dark:focus:bg-slate-950 transition-all"
                                    placeholder="analytics-service@project.iam.gserviceaccount.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                                    <span>Private Key</span>
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Secret</span>
                                </label>
                                <textarea
                                    value={config.privateKey || ''}
                                    onChange={(e) => setConfig({ ...config, privateKey: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/10 rounded-xl font-mono text-[10px] focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-950/50 dark:text-white focus:bg-white dark:focus:bg-slate-950 transition-all shadow-inner"
                                    placeholder="Paste the full -----BEGIN PRIVATE KEY----- block here..."
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-white/10">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Integrations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Search Console URL</label>
                                        <input
                                            type="text"
                                            value={config.gscPropertyUrl || ''}
                                            onChange={(e) => setConfig({ ...config, gscPropertyUrl: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/10 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-950/50 dark:text-white focus:bg-white dark:focus:bg-slate-950 transition-all"
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Facebook Pixel ID</label>
                                        <input
                                            type="text"
                                            value={config.fbPixelId || ''}
                                            onChange={(e) => setConfig({ ...config, fbPixelId: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/10 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-950/50 dark:text-white focus:bg-white dark:focus:bg-slate-950 transition-all"
                                            placeholder="Pixel ID"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 mt-2">
                                <input
                                    type="checkbox"
                                    id="isActiveSidebar"
                                    checked={config.isActive}
                                    onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 dark:text-blue-500 rounded focus:ring-2 focus:ring-blue-600 bg-white dark:bg-slate-900"
                                />
                                <label htmlFor="isActiveSidebar" className="text-sm font-bold text-blue-900 dark:text-blue-300 cursor-pointer select-none">
                                    Enable live analytics tracking globally
                                </label>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 md:p-8 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem] flex flex-col sm:flex-row items-center gap-4 shrink-0">
                        <button
                            onClick={handleTestConnection}
                            disabled={isTesting}
                            className="w-full sm:w-auto px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                        >
                            {isTesting ? 'Testing...' : 'Test GA4 Connection'}
                        </button>

                        <div className="flex-1" />

                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-white/20 transition-all disabled:opacity-50"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 dark:hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function MetricCard({ title, value, change, subtitle, icon: Icon, color, detail }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/5 border-blue-500/10',
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/5 border-purple-500/10',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10',
    };

    return (
        <div className={`group relative overflow-hidden rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/5 border ${colorClasses[color]} hover:-translate-y-1 transition-all duration-500`}>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
                    <div className="flex items-center gap-2 mt-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-current opacity-10`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest`}>{detail || subtitle}</span>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-white/50 dark:bg-white/5 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {change !== undefined && (
                <div className={`absolute bottom-8 right-8 text-xs font-black flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                </div>
            )}
        </div>
    );
}
