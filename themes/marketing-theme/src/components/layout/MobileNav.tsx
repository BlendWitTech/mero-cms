'use client';

import React from 'react';
import Link from 'next/link';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SiteData, getMenuBySlug } from '@/lib/cms';
import Button from '@/components/ui/Button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  siteData: SiteData;
}

export default function MobileNav({ isOpen, onClose, siteData }: MobileNavProps) {
  const { menus, settings } = siteData;
  const nav = getMenuBySlug(menus, 'main-nav');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="absolute inset-y-0 right-0 w-full max-w-[320px] bg-white shadow-2xl flex flex-col animate-slide-up origin-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-xl shadow-lg shadow-primary-600/20" />
            <span className="text-xl font-black tracking-tighter text-slate-900 font-display">
              Mero<span className="text-primary-600">CMS</span>
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search Trigger */}
        <div className="p-6 pb-0">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-600/5 transition-all"
            />
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
          {nav?.items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              onClick={onClose}
              className="block p-4 rounded-2xl text-base font-black uppercase tracking-widest text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all border border-transparent hover:border-primary-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 space-y-4">
          <Button 
            href="https://demo.mero-cms.com" 
            variant="primary" 
            className="w-full py-4 text-xs font-black uppercase tracking-[0.2em]"
            onClick={onClose}
          >
            Launch Live Demo
          </Button>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
            Professional CMS Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
