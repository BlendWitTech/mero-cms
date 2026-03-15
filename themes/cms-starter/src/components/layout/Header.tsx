'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { SiteData } from '@/lib/cms';
import { cmsImageUrl } from '@/lib/cms';

interface HeaderProps {
  siteData: SiteData;
}

export default function Header({ siteData }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { settings, menus } = siteData;
  const mainNav = menus.find((m) => m.slug === 'main-nav');
  const navItems = mainNav?.items
    ? [...mainNav.items].sort((a, b) => a.order - b.order)
    : [];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {settings.logoUrl ? (
              <Image
                src={cmsImageUrl(settings.logoUrl)}
                alt={settings.siteTitle || 'Logo'}
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                {settings.siteTitle || 'Mero CMS'}
              </span>
            )}
          </Link>

          {/* Desktop navigation */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => {
                const isLast = index === navItems.length - 1;
                const isExternal =
                  item.url.startsWith('http://') || item.url.startsWith('https://');

                if (isLast) {
                  return (
                    <Link
                      key={item.label}
                      href={item.url}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="ml-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.url}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navItems.map((item, index) => {
              const isLast = index === navItems.length - 1;
              const isExternal =
                item.url.startsWith('http://') || item.url.startsWith('https://');

              return (
                <Link
                  key={item.label}
                  href={item.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={
                    isLast
                      ? 'block mx-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm text-center hover:bg-indigo-700 transition-colors'
                      : 'block px-4 py-2.5 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
