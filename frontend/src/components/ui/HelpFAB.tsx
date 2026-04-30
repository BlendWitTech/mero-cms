'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    QuestionMarkCircleIcon,
    BookOpenIcon,
    LifebuoyIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    ClockIcon,
    StarIcon,
    UserCircleIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useCapabilities } from '@/context/CapabilitiesContext';
import { useSettings } from '@/context/SettingsContext';

const THEME_URL = process.env.NEXT_PUBLIC_THEME_URL || '';

const items = [
    {
        label: 'Documentation',
        description: 'How to use the CMS admin panel',
        href: '/dashboard/docs',
        icon: BookOpenIcon,
        iconColor: 'text-slate-700 dark:text-slate-300',
        iconBg: 'bg-slate-100 dark:bg-white/[0.08]',
        external: false,
    },
    {
        label: 'Help Center',
        description: 'Guides & support articles',
        href: `${THEME_URL}/help`,
        icon: LifebuoyIcon,
        iconColor: 'text-slate-700 dark:text-slate-300',
        iconBg: 'bg-slate-100 dark:bg-white/[0.08]',
        external: true,
    },
    {
        label: 'FAQ',
        description: 'Frequently asked questions',
        href: `${THEME_URL}/faq`,
        icon: ChatBubbleLeftRightIcon,
        iconColor: 'text-slate-700 dark:text-slate-300',
        iconBg: 'bg-slate-100 dark:bg-white/[0.08]',
        external: true,
    },
];

/**
 * Renders a tier-specific card at the top of the HelpFAB menu explaining
 * what kind of support the customer gets. Dedicated-tier customers also
 * see their assigned account manager (read from settings KV keys
 * `support_manager_name` / `support_manager_email`).
 */
function SupportTierCard() {
    const { activePackage } = useCapabilities();
    const { settings } = useSettings();
    const tier = activePackage?.supportLevel ?? 'email';
    const managerName = settings?.support_manager_name?.trim();
    const managerEmail = settings?.support_manager_email?.trim();

    if (tier === 'dedicated') {
        return (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-xl border border-blue-500/30 space-y-3 min-w-[280px]">
                <div className="flex items-center gap-2">
                    <StarIcon className="w-4 h-4 text-amber-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                        Dedicated Support
                    </span>
                </div>
                {managerName ? (
                    <div className="flex items-start gap-3">
                        <UserCircleIcon className="w-8 h-8 shrink-0 text-white/80" />
                        <div className="min-w-0">
                            <div className="text-sm font-black">{managerName}</div>
                            <div className="text-[11px] text-white/80">Your account manager</div>
                            {managerEmail && (
                                <a
                                    href={`mailto:${managerEmail}`}
                                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 hover:text-amber-100 break-all"
                                >
                                    <EnvelopeIcon className="w-3 h-3 shrink-0" />
                                    {managerEmail}
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-[11px] text-white/80 leading-relaxed">
                        You have 24/7 access to our engineering team. Email{' '}
                        <a href="mailto:support@mero.cms" className="font-bold text-amber-200 hover:text-amber-100">
                            support@mero.cms
                        </a>{' '}
                        any time.
                    </p>
                )}
            </div>
        );
    }

    if (tier === 'priority') {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-white/[0.08] space-y-2 min-w-[280px]">
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                        Priority Support
                    </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Email{' '}
                    <a
                        href="mailto:support@mero.cms"
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        support@mero.cms
                    </a>{' '}
                    — expected response within <strong>24 hours</strong> on business days.
                </p>
            </div>
        );
    }

    // Default: email tier
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-white/[0.08] space-y-2 min-w-[280px]">
            <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Email Support
                </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Email us at{' '}
                <a
                    href="mailto:support@mero.cms"
                    className="font-bold text-slate-700 dark:text-slate-200 hover:underline"
                >
                    support@mero.cms
                </a>{' '}
                and we&rsquo;ll get back to you within a few business days.
            </p>
        </div>
    );
}

export default function HelpFAB() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Close when navigating
    useEffect(() => { setOpen(false); }, [pathname]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
            {/* Menu items — animate up when open */}
            {open && (
                <div className="flex flex-col gap-2 items-end">
                    <SupportTierCard />
                    {items.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 group">
                            {/* Label chip */}
                            <span className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 dark:border-white/[0.08] whitespace-nowrap leading-tight">
                                {item.label}
                            </span>
                            {/* Icon button */}
                            {item.external ? (
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpen(false)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/[0.08] transition-all duration-200 hover:scale-110 ${item.iconBg}`}
                                >
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </a>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/[0.08] transition-all duration-200 hover:scale-110 ${item.iconBg}`}
                                >
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
                    open
                        ? 'bg-slate-700 hover:bg-slate-800 scale-105'
                        : 'bg-slate-900 dark:bg-white hover:scale-110'
                }`}
                aria-label={open ? 'Close help menu' : 'Help & Documentation'}
            >
                {open ? (
                    <XMarkIcon className="w-6 h-6 text-white dark:text-slate-900" />
                ) : (
                    <QuestionMarkCircleIcon className="w-7 h-7 text-white dark:text-slate-900" />
                )}
            </button>
        </div>
    );
}
