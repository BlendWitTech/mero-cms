import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    MapPinIcon,
    CalendarIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';

interface UserFiltersProps {
    onFilterChange: (filters: any) => void;
    inline?: boolean;
}

export default function UserFilters({ onFilterChange, inline }: UserFiltersProps) {
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [security, setSecurity] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange({ search, role, security });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, role, security]);

    const containerClasses = inline
        ? "p-4 sm:p-3 flex flex-wrap items-center gap-4 sm:gap-3"
        : "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/60 dark:shadow-none p-4 sm:p-3 flex flex-wrap items-center gap-4 sm:gap-3";

    return (
        <div className={containerClasses}>
            {/* Search Input */}
            <div className="flex-1 min-w-[280px] relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, or IP..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-600/5 dark:focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-600/50 transition-all"
                />
            </div>

            <div className="h-10 w-px bg-slate-200/60 dark:bg-white/10 hidden sm:block" />

            {/* Role Filter */}
            <div className="relative group">
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="appearance-none bg-transparent dark:bg-transparent px-5 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-200 dark:hover:shadow-none transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer border-none"
                >
                    <option value="">All Roles</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Author">Author</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 dark:text-slate-600 pointer-events-none group-hover:rotate-180 transition-transform duration-500" />
            </div>

            {/* Security Filter */}
            <div className="relative group">
                <select
                    value={security}
                    onChange={(e) => setSecurity(e.target.value)}
                    className="appearance-none bg-transparent dark:bg-transparent px-5 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-200 dark:hover:shadow-none transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer border-none"
                >
                    <option value="">All Security</option>
                    <option value="2FA">2FA Enabled</option>
                    <option value="IP">IP Whitelisted</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 dark:text-slate-600 pointer-events-none group-hover:rotate-180 transition-transform duration-500" />
            </div>

            <div className="h-10 w-px bg-slate-200/60 dark:bg-white/10 hidden sm:block" />

            {/* Clear All */}
            <button
                onClick={() => { setSearch(''); setRole(''); setSecurity(''); }}
                className="px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-95"
            >
                Clear
            </button>
        </div>
    );
}
