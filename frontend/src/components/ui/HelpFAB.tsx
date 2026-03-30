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
} from '@heroicons/react/24/outline';

const items = [
    {
        label: 'Documentation',
        description: 'Full CMS reference guide',
        href: '/dashboard/docs',
        icon: BookOpenIcon,
        color: 'bg-violet-600 hover:bg-violet-700',
        iconColor: 'text-violet-600',
        iconBg: 'bg-violet-50',
    },
    {
        label: 'Help Center',
        description: 'Coming soon',
        href: '#',
        icon: LifebuoyIcon,
        color: 'bg-blue-600 hover:bg-blue-700',
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        disabled: true,
    },
    {
        label: 'FAQ',
        description: 'Coming soon',
        href: '#',
        icon: ChatBubbleLeftRightIcon,
        color: 'bg-emerald-600 hover:bg-emerald-700',
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        disabled: true,
    },
];

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
                    {items.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 group">
                            {/* Label chip */}
                            <div className="flex flex-col items-end">
                                <span className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 whitespace-nowrap leading-tight">
                                    {item.label}
                                    {item.disabled && (
                                        <span className="ml-1.5 text-[10px] font-normal text-slate-400">· coming soon</span>
                                    )}
                                </span>
                            </div>
                            {/* Icon button */}
                            {item.disabled ? (
                                <button
                                    disabled
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${item.iconBg} opacity-50 cursor-not-allowed`}
                                >
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </button>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 ${item.iconBg}`}
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
                        ? 'bg-slate-800 hover:bg-slate-900 rotate-0 scale-105'
                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:scale-110'
                }`}
                aria-label={open ? 'Close help menu' : 'Help & Documentation'}
            >
                {open ? (
                    <XMarkIcon className="w-6 h-6 text-white" />
                ) : (
                    <QuestionMarkCircleIcon className="w-7 h-7 text-white" />
                )}
            </button>
        </div>
    );
}
