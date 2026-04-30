import React from 'react';

interface PageHeaderProps {
    title: string;
    accent?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, accent, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    {title}{accent && <span className="text-blue-600 dark:text-blue-400"> {accent}</span>}
                </h1>
                {subtitle && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
