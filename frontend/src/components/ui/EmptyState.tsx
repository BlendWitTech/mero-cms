import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
    naked?: boolean;
}

export default function EmptyState({ icon: Icon, title, description, action, naked }: EmptyStateProps) {
    const containerClasses = naked
        ? "flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500"
        : "flex flex-col items-center justify-center py-20 px-8 text-center bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-[2.5rem] shadow-sm animate-in fade-in zoom-in-95 duration-500";

    return (
        <div className={containerClasses}>
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Icon className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-sm mx-auto">
                {description}
            </p>
            {action && (
                <div className="mt-8">
                    {action.href ? (
                        <Link
                            href={action.href}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            {action.label}
                        </Link>
                    ) : (
                        <button
                            onClick={action.onClick}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
