'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';

type ThemeDesign = {
    key: string;
    label: string;
    description: string;
    isDefault: boolean;
    sectionVariants: Record<string, string>;
};

/**
 * Theme Design Gallery.
 *
 * Lists every top-level "design" (complete page composition) a theme ships
 * with — each one bundles a consistent look across Home, About, Services, etc.
 * This is the "show all designs" view linked from the theme preview modal.
 *
 * Underneath each design we also show the per-section variant mapping so
 * advanced users can see exactly which hero/platform/CTA variants it uses.
 */
export default function ThemeDesignsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [designs, setDesigns] = useState<ThemeDesign[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiRequest(`/themes/${slug}/designs`, { skipNotification: true })
            .then((d: ThemeDesign[]) => setDesigns(d || []))
            .catch(err => setError(err?.message || 'Failed to load designs'));
    }, [slug]);

    return (
        <div className="space-y-8 pb-10">
            <PageHeader
                title={`${slug} designs`}
                subtitle="Every complete page design this theme ships with. Each design applies coherently across Home, About, and Services."
                actions={
                    <Link
                        href="/dashboard/themes"
                        className="btn-outline px-4 py-2 text-sm inline-flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Themes
                    </Link>
                }
            />

            {error && (
                <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-4 text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {designs === null && !error && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-8 text-sm text-slate-400 animate-pulse">
                    Loading designs…
                </div>
            )}

            {designs && designs.length === 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-8 text-sm text-slate-500 dark:text-slate-400">
                    This theme doesn't declare multiple designs. It ships with a single default composition.
                </div>
            )}

            {designs && designs.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                    {designs.map((d, i) => (
                        <div
                            key={d.key}
                            className={`rounded-2xl bg-white dark:bg-slate-900 border p-6 space-y-4 ${
                                d.isDefault
                                    ? 'border-blue-200 dark:border-blue-500/30 shadow-sm'
                                    : 'border-slate-100 dark:border-white/[0.06]'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            #{i + 1}
                                        </span>
                                        <code className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                                            {d.key}
                                        </code>
                                        {d.isDefault && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                        {d.label}
                                    </h3>
                                </div>
                            </div>
                            {d.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {d.description}
                                </p>
                            )}
                            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.05]">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                    Section layouts
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(d.sectionVariants).map(([section, variant]) => (
                                        <span
                                            key={section}
                                            className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-md px-2 py-0.5 text-slate-600 dark:text-slate-400"
                                        >
                                            <span className="text-slate-400 dark:text-slate-600">{section}:</span>{' '}
                                            <span className="font-bold">{variant}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
