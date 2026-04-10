'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteData, getMenuBySlug, cmsImageUrl } from '@/lib/cms';
import Button from '@/components/ui/Button';
import MobileNav from './MobileNav';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Header({ siteData }: { siteData: SiteData }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { settings, menus } = siteData;
  const nav = getMenuBySlug(menus, 'main-nav');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'py-3 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-900/5 border-b border-slate-200/50' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-10 group flex items-center gap-3">
            <div className={`transition-all duration-500 ${isScrolled ? 'scale-90' : 'scale-100'}`}>
              {settings.logoUrl ? (
                <img 
                  src={cmsImageUrl(settings.logoUrl)} 
                  alt={settings.siteTitle || 'Mero CMS'} 
                  className="h-9 w-auto object-contain" 
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-xl rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-primary-600/20" />
                  <span className="text-xl font-black tracking-tighter text-slate-900 font-display">
                    Mero<span className="text-primary-600">CMS</span>
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50">
            {nav?.items.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link 
                  key={item.url} 
                  href={item.url}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
              <MagnifyingGlassIcon className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>
            <Button 
                href="https://demo.mero-cms.com" 
                variant="primary" 
                size="md"
                className={isScrolled ? 'py-2 px-5' : ''}
            >
              Try Demo
            </Button>
            <button 
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Bars3Icon className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      <MobileNav 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
        siteData={siteData} 
      />
    </header>
  );
}
