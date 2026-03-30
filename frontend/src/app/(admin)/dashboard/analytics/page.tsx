'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, UsersIcon, EyeIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { showToast } = useNotification();

    useEffect(() => {
        fetchConfig();
        fetchDashboard();
    }, []);

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
        <div className="p-8">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Analytics <span className="text-blue-600">Dashboard</span>
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 font-medium">
                        Track your site's performance and geographic reach
                    </p>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Configure
                </button>
            </div>

            {/* Dashboard Metrics */}
            {dashboardError ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-900 font-bold mb-1">Analytics Error</h3>
                        <p className="text-red-700 text-sm">{dashboardError}</p>
                        <p className="text-red-600 text-xs mt-2">
                            Please check your configuration below and use the "Test Connection" button.
                        </p>
                    </div>
                </div>
            ) : dashboard ? (
                <div className="space-y-8 mb-8">
                    {/* Primary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Page Views"
                            value={dashboard.summary.pageViews.today.toLocaleString()}
                            change={dashboard.summary.pageViews.change}
                            icon={EyeIcon}
                            color="blue"
                        />
                        <MetricCard
                            title="Active Users"
                            value={dashboard.summary.visitors.today.toLocaleString()}
                            change={dashboard.summary.visitors.change}
                            icon={UsersIcon}
                            color="purple"
                        />
                        <MetricCard
                            title="Real-time"
                            value={dashboard.realTimeVisitors.toString()}
                            subtitle="Active now"
                            icon={ArrowTrendingUpIcon}
                            color="green"
                        />
                        <MetricCard
                            title="Sessions"
                            value={dashboard.summary.sessions.today.toLocaleString()}
                            change={dashboard.summary.sessions.change}
                            icon={ChartBarIcon}
                            color="amber"
                        />
                    </div>

                    {dashboard.realTimeVisitors === 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg h-fit">
                                <EyeIcon className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="text-sm">
                                <p className="text-amber-900 font-bold">Not seeing your visits?</p>
                                <p className="text-amber-800 opacity-80">
                                    If you are visiting the site but the real-time count remains 0, ensure your <strong>AdBlocker</strong> is disabled and that <strong>Active Tracking</strong> is enabled in the configuration below.
                                    Also, check the browser console for "[Analytics] Initializing" logs.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Engagement Rate</p>
                            <div className="flex items-end gap-3">
                                <span className="text-2xl font-black text-slate-900">{(dashboard.summary.engagementRate.today * 100).toFixed(1)}%</span>
                                <span className={`text-xs font-bold mb-1 ${dashboard.summary.engagementRate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {dashboard.summary.engagementRate.change >= 0 ? '↑' : '↓'} {Math.abs(dashboard.summary.engagementRate.change).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Session Duration</p>
                            <div className="flex items-end gap-3">
                                <span className="text-2xl font-black text-slate-900">{Math.floor(dashboard.summary.avgSessionDuration.today / 60)}m {Math.floor(dashboard.summary.avgSessionDuration.today % 60)}s</span>
                                <span className={`text-xs font-bold mb-1 ${dashboard.summary.avgSessionDuration.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {dashboard.summary.avgSessionDuration.change >= 0 ? '↑' : '↓'} {Math.abs(dashboard.summary.avgSessionDuration.change).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Users</p>
                            <div className="flex items-end gap-3">
                                <span className="text-2xl font-black text-slate-900">{dashboard.summary.newUsers.today.toLocaleString()}</span>
                                <span className={`text-xs font-bold mb-1 ${dashboard.summary.newUsers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {dashboard.summary.newUsers.change >= 0 ? '↑' : '↓'} {Math.abs(dashboard.summary.newUsers.change).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Traffic Sources */}
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <h2 className="text-xl font-black text-slate-900 mb-6">Traffic Sources</h2>
                            <div className="space-y-4">
                                {dashboard.trafficSources.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">No traffic source data</div>
                                ) : (
                                    dashboard.trafficSources.map((source: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <span className="text-xs font-bold text-slate-900 min-w-[100px]">{source.label}</span>
                                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${source.percentage}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 ml-4">{source.visitors} users</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Device Categories */}
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <h2 className="text-xl font-black text-slate-900 mb-6">Devices</h2>
                            <div className="space-y-4">
                                {dashboard.devices.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">No device data</div>
                                ) : (
                                    dashboard.devices.map((device: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <span className="text-xs font-bold text-slate-900 min-w-[100px] capitalize">{device.label}</span>
                                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${device.percentage}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 ml-4">{device.visitors} users</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Pages */}
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <h2 className="text-xl font-black text-slate-900 mb-6">Top Content</h2>
                            <div className="overflow-hidden">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page Path</th>
                                            <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Views</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {dashboard.topPages.map((page: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-4 text-xs font-bold text-slate-800 truncate max-w-[200px]">{page.path}</td>
                                                <td className="py-4 text-xs font-bold text-slate-900 text-right">{page.views.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                            <h2 className="text-xl font-black text-slate-900 mb-6">Locations</h2>
                            <div className="space-y-4">
                                {dashboard.locations.slice(0, 5).map((loc: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">{loc.country}</span>
                                        <span className="text-xs font-bold text-slate-500">{loc.visitors} users</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Centered Configuration Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    onClick={handleCancel}
                />

                {/* Modal Container */}
                <div
                    className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-[2rem] shadow-2xl transition-all duration-300 transform ${isEditing ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configuration</h2>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Analytics Tracking Settings</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all group"
                        >
                            <XMarkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">
                                        GA4 Measurement ID
                                    </label>
                                    <input
                                        type="text"
                                        value={config.ga4MeasurementId || ''}
                                        onChange={(e) => setConfig({ ...config, ga4MeasurementId: e.target.value })}
                                        placeholder="G-XXXXXXX"
                                        className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all"
                                    />
                                    <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                        Data Stream settings
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">
                                        Property ID
                                    </label>
                                    <input
                                        type="text"
                                        value={config.ga4PropertyId || ''}
                                        onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all"
                                        placeholder="123456789"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">
                                    Service Email
                                </label>
                                <input
                                    type="email"
                                    value={config.serviceAccountEmail || ''}
                                    onChange={(e) => setConfig({ ...config, serviceAccountEmail: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all"
                                    placeholder="analytics-service@project.iam.gserviceaccount.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
                                    <span>Private Key</span>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Secret</span>
                                </label>
                                <textarea
                                    value={config.privateKey || ''}
                                    onChange={(e) => setConfig({ ...config, privateKey: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-mono text-[10px] focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all shadow-inner"
                                    placeholder="Paste the full -----BEGIN PRIVATE KEY----- block here..."
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Integrations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-900 mb-2 uppercase tracking-tight">Search Console URL</label>
                                        <input
                                            type="text"
                                            value={config.gscPropertyUrl || ''}
                                            onChange={(e) => setConfig({ ...config, gscPropertyUrl: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all"
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-900 mb-2 uppercase tracking-tight">Facebook Pixel ID</label>
                                        <input
                                            type="text"
                                            value={config.fbPixelId || ''}
                                            onChange={(e) => setConfig({ ...config, fbPixelId: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white transition-all"
                                            placeholder="Pixel ID"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mt-2">
                                <input
                                    type="checkbox"
                                    id="isActiveSidebar"
                                    checked={config.isActive}
                                    onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600 bg-white"
                                />
                                <label htmlFor="isActiveSidebar" className="text-sm font-bold text-blue-900 cursor-pointer select-none">
                                    Enable live analytics tracking globally
                                </label>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 rounded-b-[2rem] flex flex-col sm:flex-row items-center gap-4 shrink-0">
                        <button
                            onClick={handleTestConnection}
                            disabled={isTesting}
                            className="w-full sm:w-auto px-6 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                        >
                            {isTesting ? 'Testing...' : 'Test GA4 Connection'}
                        </button>
                        
                        <div className="flex-1" />
                        
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, subtitle, icon: Icon, color }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
    };

    return (
        <div className={`${colorClasses[color]} border-2 rounded-2xl p-6`}>
            <div className="flex items-start justify-between mb-4">
                <Icon className="h-8 w-8" />
                {change !== undefined && (
                    <span className={`text-xs font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                )}
            </div>
            <div className="text-3xl font-black mb-1">{value}</div>
            <div className="text-xs font-bold opacity-75">{subtitle || title}</div>
        </div>
    );
}
