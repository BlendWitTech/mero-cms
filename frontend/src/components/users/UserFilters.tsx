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
}

export default function UserFilters({ onFilterChange }: UserFiltersProps) {
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [security, setSecurity] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange({ search, role, security });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, role, security]);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200 p-2 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[280px] relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, or IP..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                />
            </div>

            <div className="h-10 w-px bg-slate-200/60 hidden sm:block" />

            {/* Role Filter (Simple Select for now, but styled) */}
            <div className="relative group">
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="appearance-none bg-transparent px-5 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-white hover:shadow-lg hover:shadow-slate-200 transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer border-none"
                >
                    <option value="">All Roles</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Author">Author</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none group-hover:rotate-180 transition-transform duration-500" />
            </div>

            {/* Security Filter */}
            <div className="relative group">
                <select
                    value={security}
                    onChange={(e) => setSecurity(e.target.value)}
                    className="appearance-none bg-transparent px-5 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-white hover:shadow-lg hover:shadow-slate-200 transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer border-none"
                >
                    <option value="">All Security</option>
                    <option value="2FA">2FA Enabled</option>
                    <option value="IP">IP Whitelisted</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none group-hover:rotate-180 transition-transform duration-500" />
            </div>

            <div className="h-10 w-px bg-slate-200/60 hidden sm:block" />

            {/* Clear All */}
            <button
                onClick={() => { setSearch(''); setRole(''); setSecurity(''); }}
                className="px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
            >
                Clear
            </button>
        </div>
    );
}
