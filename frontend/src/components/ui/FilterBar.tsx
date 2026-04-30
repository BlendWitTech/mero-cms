import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterBarProps {
    search: {
        value: string;
        onChange: (val: string) => void;
        placeholder?: string;
    };
    filters?: {
        label?: string;
        value: string;
        onChange: (val: string) => void;
        options: FilterOption[];
        icon?: React.ComponentType<any>;
    }[];
    inline?: boolean;
}

export default function FilterBar({ search, filters, inline }: FilterBarProps) {
    const containerClasses = inline 
        ? "p-6 flex flex-col md:flex-row items-center gap-3" 
        : "bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/[0.06] rounded-3xl p-3 flex flex-col md:flex-row items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500";

    return (
        <div className={containerClasses}>
            {/* Search Input */}
            <div className="relative flex-1 w-full group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                    type="text"
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    placeholder={search.placeholder || "Search items..."}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all shadow-inner"
                />
            </div>

            {/* Filters */}
            {filters && filters.length > 0 && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {filters.map((filter, idx) => (
                        <div key={idx} className="relative flex-1 md:w-48 group">
                            {filter.icon ? (
                                <filter.icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            ) : (
                                <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            )}
                            <select
                                value={filter.value}
                                onChange={(e) => filter.onChange(e.target.value)}
                                className="w-full pl-10 pr-8 py-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all appearance-none cursor-pointer shadow-inner"
                            >
                                {filter.label && <option value="">{filter.label}</option>}
                                {filter.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
