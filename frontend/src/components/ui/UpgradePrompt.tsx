'use client';

import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { useCapabilities, type Capabilities } from '@/context/CapabilitiesContext';

interface UpgradePromptProps {
    feature: keyof Capabilities;
    title: string;
    description?: string;
    minTier?: string; // e.g. "Premium" or "Professional"
    className?: string;
}

/**
 * Inline upgrade prompt for gated features. Renders nothing if the user's plan
 * already includes the capability. Otherwise shows a polite "upgrade required"
 * card pointing at the billing settings page.
 */
export default function UpgradePrompt({
    feature,
    title,
    description,
    minTier = 'Premium',
    className = '',
}: UpgradePromptProps) {
    const { has, activePackage, isLoading } = useCapabilities();

    if (isLoading) return null;
    if (has(feature)) return null;

    const currentPlan = activePackage?.name ? `your ${activePackage.name} plan` : 'your current plan';

    return (
        <div
            className={`rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-500/5 dark:to-transparent p-8 ${className}`}
        >
            <div className="flex items-start gap-4">
                <div className="flex-none w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center">
                    <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                            {minTier}+ feature
                        </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    {description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {description}
                        </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                        Not available on {currentPlan}.
                    </p>
                    <div className="mt-5 flex gap-2">
                        <Link
                            href="/dashboard/settings?tab=billing"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition"
                        >
                            View plans →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
