'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export default function SearchBox({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className = '',
}: SearchBoxProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [value, onSearch, debounceMs]);

  const clear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/20 active:scale-[0.99] transition-all shadow-sm group-hover:bg-slate-50"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
