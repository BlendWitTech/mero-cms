'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    FileText, MessageSquare, Mail, HardDrive, TrendingUp, Sparkles, Activity, Users, Globe2, Lock,
    Image as ImageIcon, MessagesSquare, Layers, BadgeCheck, Infinity as InfinityIcon,
} from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useCapabilities } from '@/context/CapabilitiesContext';
import { usePermissions } from '@/context/PermissionsContext';
import { checkPermission } from '@/lib/permissions';

/**
 * Tier-gated analytics for the admin dashboard.
 *
 * What renders by tier
 *   • All tiers — KPI strip (pages, posts, leads, storage). These are
 *     cheap server-side counts; no analytics service needed.
 *   • Premium+ (capabilities.analytics === true) — leads-over-time line
 *     chart and content publishing velocity bar chart.
 *   • Professional / Enterprise (analytics + tier >= 3) — top pages by
 *     views and traffic sources. These need real page-view tracking
 *     (siteData.settings.googleAnalyticsId or in-app tracker), which
 *     the gated tiers ship with.
 *
 * Basic tier sees the KPI strip plus a soft upsell card explaining what
 * the chart panel would show, with a link to the billing page. The card
 * never renders for paid tiers — no nag.
 */

interface KPI {
    label: string;
    /** Primary value rendered in 4xl bold. */
    value: string | number;
    icon: React.ComponentType<any>;
    /** Colour key — see ACCENT_STYLES below. */
    accent: string;
    helper?: string;
    /** When true, render the ∞ infinity icon instead of the limit
        portion of a "used / limit" pair. Used for unlimited storage,
        unlimited team, etc. — looks cleaner than the word "unlimited". */
    unlimited?: boolean;
    /** Permission key gate. When set, the card only renders if the
        signed-in user has this permission. */
    requiresPermission?: string;
}

interface LeadsByDay {
    date: string;     // ISO yyyy-mm-dd
    count: number;
}

interface PostsByWeek {
    week: string;     // 'W12' or human label
    count: number;
}

interface TopPage {
    title: string;
    slug: string;
    views: number;
}

interface AnalyticsBundle {
    kpis: {
        pagesCount: number;
        postsCount: number;
        leadsCount: number;
        mediaCount: number;
        mediaUsedMB: number;
        mediaLimitMB: number;
        usersCount: number;
        commentsCount: number;
    };
    leadsByDay: LeadsByDay[];
    postsByWeek: PostsByWeek[];
    topPages: TopPage[];
    activePackageName: string;
    teamLimit: number;
}

/**
 * Format the storage display nicely.
 *   • 250 GB used / 500 GB limit  → "250 / 500 GB"
 *   • 10 MB used / unlimited      → "10 MB" + ∞ chip rendered separately
 *
 * "unlimited" as a word looked cluttered next to the number. We return
 * just the used portion when limit < 0; the card layout shows the ∞
 * icon as a side glyph instead of inline text.
 */
const formatStorage = (used: number, limit: number) => {
    // Auto-scale the unit. Anything under 1024 MB displays as MB; bigger
    // jumps to GB so the number stays compact.
    const scale = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
    if (limit < 0) return scale(used);
    return `${scale(used)} / ${scale(limit)}`;
};

export default function DashboardAnalytics() {
    const { capabilities, activePackage, isLoading: capsLoading } = useCapabilities();
    const { permissions } = usePermissions();
    const [data, setData] = useState<AnalyticsBundle | null>(null);
    const [loading, setLoading] = useState(true);

    // Pull every analytics endpoint in parallel; fall through to empty
    // values on any failure. Some installs run with modules disabled
    // (leads, blogs, analytics, comments — gated by app.module's `when()`
    // helper), so 404s here are expected. `skipNotification: true`
    // keeps the console clean when that happens.
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [usage, leadsByDay, postsByWeek, topPages, userStats, mediaList, commentsList] = await Promise.all([
                    apiRequest('/packages/usage',                  { skipNotification: true }).catch(() => null),
                    apiRequest('/leads/analytics/by-day?days=30',  { skipNotification: true }).catch(() => []),
                    apiRequest('/blogs/analytics/by-week?weeks=12', { skipNotification: true }).catch(() => []),
                    apiRequest('/analytics/top-pages?limit=5',     { skipNotification: true }).catch(() => []),
                    apiRequest('/users/stats',                     { skipNotification: true }).catch(() => null),
                    apiRequest('/media',                           { skipNotification: true }).catch(() => null),
                    apiRequest('/comments?status=approved',        { skipNotification: true }).catch(() => null),
                ]);
                if (!alive) return;
                setData({
                    kpis: {
                        pagesCount:    usage?.usage?.pagesCount ?? 0,
                        postsCount:    usage?.usage?.postsCount ?? 0,
                        leadsCount:    Array.isArray(leadsByDay) ? leadsByDay.reduce((s, d) => s + d.count, 0) : 0,
                        mediaCount:    Array.isArray(mediaList) ? mediaList.length : 0,
                        mediaUsedMB:   usage?.usage?.mediaUsed ?? 0,
                        mediaLimitMB:  usage?.limits?.mediaLimit ?? -1,
                        usersCount:    userStats?.active ?? userStats?.total ?? 0,
                        commentsCount: Array.isArray(commentsList) ? commentsList.length : (commentsList?.total ?? 0),
                    },
                    leadsByDay:        Array.isArray(leadsByDay) ? leadsByDay : [],
                    postsByWeek:       Array.isArray(postsByWeek) ? postsByWeek : [],
                    topPages:          Array.isArray(topPages) ? topPages : [],
                    activePackageName: usage?.package?.name || 'Basic',
                    teamLimit:         usage?.limits?.teamLimit ?? -1,
                });
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const tier = activePackage?.tier ?? 1;
    const hasAnalytics = !!capabilities?.analytics;
    const isPro = hasAnalytics && tier >= 3;

    /**
     * Two rows of 4 cards each.
     *
     * Row 1 — Content metrics.   What the customer is producing.
     * Row 2 — System metrics.    What the install is consuming.
     *
     * Each card declares an optional `requiresPermission` so users with
     * narrower roles see only what they have access to. Cards without
     * a permission key show to everyone (counts are non-sensitive).
     */
    const contentRow: KPI[] = useMemo(() => {
        if (!data) return [
            { label: 'Pages',          value: '—', icon: FileText,       accent: 'blue' },
            { label: 'Posts',          value: '—', icon: MessageSquare,  accent: 'indigo' },
            { label: 'Leads (30d)',    value: '—', icon: Mail,           accent: 'emerald', helper: 'last 30 days' },
            { label: 'Comments',       value: '—', icon: MessagesSquare, accent: 'rose' },
        ];
        return [
            { label: 'Pages',          value: data.kpis.pagesCount,    icon: FileText,       accent: 'blue' },
            { label: 'Posts',          value: data.kpis.postsCount,    icon: MessageSquare,  accent: 'indigo' },
            { label: 'Leads (30d)',    value: data.kpis.leadsCount,    icon: Mail,           accent: 'emerald', helper: 'last 30 days', requiresPermission: 'leads_view' },
            { label: 'Comments',       value: data.kpis.commentsCount, icon: MessagesSquare, accent: 'rose',    requiresPermission: 'content_view' },
        ];
    }, [data]);

    const systemRow: KPI[] = useMemo(() => {
        if (!data) return [
            { label: 'Team members',   value: '—', icon: Users,         accent: 'violet' },
            { label: 'Media files',    value: '—', icon: ImageIcon,     accent: 'cyan' },
            { label: 'Storage',        value: '—', icon: HardDrive,     accent: 'amber' },
            { label: 'Active plan',    value: '—', icon: BadgeCheck,    accent: 'emerald' },
        ];
        return [
            {
                label: 'Team members',
                value: data.kpis.usersCount,
                icon: Users,
                accent: 'violet',
                helper: data.teamLimit < 0 ? 'unlimited seats' : `of ${data.teamLimit} seats`,
                unlimited: data.teamLimit < 0,
                requiresPermission: 'user_view',
            },
            {
                label: 'Media files',
                value: data.kpis.mediaCount,
                icon: ImageIcon,
                accent: 'cyan',
            },
            {
                label: 'Storage',
                value: formatStorage(data.kpis.mediaUsedMB, data.kpis.mediaLimitMB),
                icon: HardDrive,
                accent: 'amber',
                helper: data.kpis.mediaLimitMB < 0 ? 'unlimited' : 'used / total',
                unlimited: data.kpis.mediaLimitMB < 0,
            },
            {
                label: 'Active plan',
                value: data.activePackageName,
                icon: BadgeCheck,
                accent: 'emerald',
                helper: 'tap License to manage',
            },
        ];
    }, [data]);

    /** Filter cards by the signed-in user's permissions. */
    const visibleContentRow = contentRow.filter(k => !k.requiresPermission || checkPermission(permissions, k.requiresPermission as any));
    const visibleSystemRow  = systemRow.filter (k => !k.requiresPermission || checkPermission(permissions, k.requiresPermission as any));

    if (capsLoading) {
        return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />;
    }

    return (
        <div className="space-y-6">
            {/* Row 1 — content metrics. Cards filter by user permissions
                so a Contributor doesn't see leads they can't read. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleContentRow.map(k => <KpiCard key={k.label} kpi={k} loading={loading} />)}
            </div>

            {/* Row 2 — system metrics. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleSystemRow.map(k => <KpiCard key={k.label} kpi={k} loading={loading} />)}
            </div>

            {/* Premium+ analytics. */}
            {hasAnalytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <LeadsChart data={data?.leadsByDay ?? []} />
                    <ContentVelocityChart data={data?.postsByWeek ?? []} />
                </div>
            ) : (
                <UpgradeCard tier={tier} />
            )}

            {/* Pro / Enterprise — top pages by view count. */}
            {isPro ? (
                <TopPagesPanel data={data?.topPages ?? []} />
            ) : hasAnalytics ? (
                <ProUpgradeHint />
            ) : null}
        </div>
    );
}

// ─── KPI card ────────────────────────────────────────────────────────
//
// Beefed-up gradient cards — these are the only "big number" cards on
// the dashboard now that the duplicate legacy stat cards are gone.
// Visual weight matches what the dashboard expects in its top slot.

const ACCENT_STYLES: Record<string, {
    gradient: string;
    shadow: string;
    ring: string;
    iconBg: string;
}> = {
    blue: {
        gradient: 'from-blue-500 to-blue-700',
        shadow:   'shadow-blue-500/30',
        ring:     'ring-blue-500/20',
        iconBg:   'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    indigo: {
        gradient: 'from-indigo-500 to-indigo-700',
        shadow:   'shadow-indigo-500/30',
        ring:     'ring-indigo-500/20',
        iconBg:   'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    emerald: {
        gradient: 'from-emerald-500 to-emerald-700',
        shadow:   'shadow-emerald-500/30',
        ring:     'ring-emerald-500/20',
        iconBg:   'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    amber: {
        gradient: 'from-amber-500 to-amber-700',
        shadow:   'shadow-amber-500/30',
        ring:     'ring-amber-500/20',
        iconBg:   'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    rose: {
        gradient: 'from-rose-500 to-rose-700',
        shadow:   'shadow-rose-500/30',
        ring:     'ring-rose-500/20',
        iconBg:   'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    violet: {
        gradient: 'from-violet-500 to-violet-700',
        shadow:   'shadow-violet-500/30',
        ring:     'ring-violet-500/20',
        iconBg:   'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    cyan: {
        gradient: 'from-cyan-500 to-cyan-700',
        shadow:   'shadow-cyan-500/30',
        ring:     'ring-cyan-500/20',
        iconBg:   'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
};

function KpiCard({ kpi, loading }: { kpi: KPI; loading: boolean }) {
    const Icon = kpi.icon;
    const style = ACCENT_STYLES[kpi.accent] || ACCENT_STYLES.blue;
    return (
        <div
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-white/[0.07] p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 cursor-default"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] mb-2">
                        {kpi.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                            {loading
                                ? <span className="inline-block h-9 w-24 bg-slate-100 dark:bg-white/10 rounded animate-pulse" />
                                : kpi.value}
                        </p>
                        {/* ∞ glyph for unlimited resources. Sits as a
                            small chip next to the value — much cleaner
                            than the word "unlimited" on the same line. */}
                        {kpi.unlimited && !loading && (
                            <span
                                title="Unlimited"
                                className={`inline-flex items-center justify-center h-6 px-1.5 rounded-md text-xs font-black ${style.iconBg}`}
                            >
                                <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                        )}
                    </div>
                    {kpi.helper && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                            {kpi.helper}
                        </p>
                    )}
                </div>

                <div
                    className={`h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg ${style.shadow} ring-4 ${style.ring}`}
                >
                    <Icon className="h-7 w-7 text-white" strokeWidth={1.75} />
                </div>
            </div>

            {/* Decorative fade orb — same flourish the legacy cards had. */}
            <div
                className={`pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${style.gradient} opacity-10 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
            />
        </div>
    );
}

// ─── Charts ──────────────────────────────────────────────────────────

function LeadsChart({ data }: { data: LeadsByDay[] }) {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leads — last 30 days</h3>
                    <p className="text-xs text-slate-400">Daily new leads from contact forms and demo signups</p>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
            <div className="h-56 w-full" style={{ minHeight: 224 }}>
                {data.length === 0 ? (
                    <EmptyChart label="No leads yet" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(100,116,139,0.1)" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgb(100,116,139)' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'rgb(100,116,139)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: '1px solid rgb(226,232,240)', borderRadius: 12, fontSize: 12 }}
                                labelStyle={{ fontWeight: 600 }}
                            />
                            <Line type="monotone" dataKey="count" stroke="rgb(16,185,129)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

function ContentVelocityChart({ data }: { data: PostsByWeek[] }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Publishing velocity</h3>
                    <p className="text-xs text-slate-400">Posts published per week, last 12 weeks</p>
                </div>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                    <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>
            <div className="h-56 w-full" style={{ minHeight: 224 }}>
                {data.length === 0 ? (
                    <EmptyChart label="No posts published yet" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(100,116,139,0.1)" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'rgb(100,116,139)' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'rgb(100,116,139)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: '1px solid rgb(226,232,240)', borderRadius: 12, fontSize: 12 }}
                                labelStyle={{ fontWeight: 600 }}
                            />
                            <Bar dataKey="count" fill="rgb(99,102,241)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

function TopPagesPanel({ data }: { data: TopPage[] }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top pages by views</h3>
                    <p className="text-xs text-slate-400">Last 30 days · from your in-app analytics</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">
                    <Sparkles className="h-3 w-3" /> Pro / Enterprise
                </div>
            </div>
            {data.length === 0 ? (
                <EmptyChart label="No view data yet — check back after some traffic" />
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-white/5">
                    {data.map((p, i) => (
                        <li key={p.slug} className="flex items-center gap-4 py-3">
                            <span className="text-[11px] font-black text-slate-400 w-6">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.title}</p>
                                <p className="text-xs text-slate-400 truncate">{p.slug}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{p.views.toLocaleString()}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">views</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Upsell ──────────────────────────────────────────────────────────

function UpgradeCard({ tier }: { tier: number }) {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shrink-0">
                    <Lock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-1">Available on Premium</p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">See your leads, content velocity, and traffic at a glance.</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Premium unlocks 30-day leads trends, weekly publishing velocity, and a recent activity feed. Professional and Enterprise add top pages by views and traffic sources.
                    </p>
                    <Link
                        href="/dashboard/settings?tab=billing"
                        className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                    >
                        Upgrade to Premium
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ProUpgradeHint() {
    return (
        <div className="bg-blue-50/40 dark:bg-blue-500/[0.04] border border-blue-200/40 dark:border-blue-500/10 rounded-2xl p-5 flex items-center gap-3">
            <Globe2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">
                Top pages and traffic sources are available on Professional / Enterprise.{' '}
                <Link href="/dashboard/settings?tab=billing" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    Compare plans →
                </Link>
            </p>
        </div>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="h-full flex items-center justify-center text-xs text-slate-400">
            {label}
        </div>
    );
}
