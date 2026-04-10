import Link from 'next/link';
import { SiteData, getMenuBySlug } from '@/lib/cms';

export default function Footer({ siteData }: { siteData: SiteData }) {
  const { settings, menus } = siteData;
  const footerNav = getMenuBySlug(menus, 'footer');
  const mainNav = getMenuBySlug(menus, 'main-nav');

  return (
    <footer className="relative z-10 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16">
          
          {/* Brand & Mission */}
          <div className="space-y-6 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-xl" />
              <span className="text-xl font-black tracking-tighter text-slate-900 font-display">
                Mero<span className="text-primary-600">CMS</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xs">
              {settings.site_tagline || 'The modern headless CMS for digital agencies and professional teams.'}
            </p>
            <div className="flex items-center gap-4">
              {settings.social_twitter && (
                <a href={settings.social_twitter} className="text-slate-400 hover:text-primary-600 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
              )}
              {settings.social_github && (
                <a href={settings.social_github} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 sm:mb-8 transition-all hover:text-primary-600 cursor-default">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/pricing" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">Pricing</Link></li>
              <li><Link href="/docs" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">Documentation</Link></li>
              <li><Link href="/#features" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">Features</Link></li>
              {mainNav?.items.map(item => (
                <li key={item.url}><Link href={item.url} className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 sm:mb-8 transition-all hover:text-primary-600 cursor-default">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/blog" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">Expert Blog</Link></li>
              <li><Link href="/contact" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">Contact Sales</Link></li>
              <li><Link href="/privacy" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              {footerNav?.items.map(item => (
                <li key={item.url}><Link href={item.url} className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 sm:mb-8 transition-all hover:text-primary-600 cursor-default">HQ</h4>
            <ul className="space-y-4">
              <li className="text-sm font-bold text-slate-500">{settings.contact_email || 'hello@mero-cms.com'}</li>
              <li className="text-sm font-medium text-slate-400">
                Developed by <a href="https://www.blendwit.com" target="_blank" className="font-black text-slate-900 hover:text-primary-600 transition-colors">Blendwit Tech</a>
              </li>
              <li className="text-sm font-medium text-slate-400">
                Ecosystem: <a href="https://www.merojukx.com" target="_blank" className="font-bold text-slate-500 hover:text-violet-600 transition-colors">Merojukx Platform</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 sm:mt-20 pt-8 sm:pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
            {settings.copyrightText || `© ${new Date().getFullYear()} Mero CMS. All rights reserved.`}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100 animate-pulse">Running Premium Tier</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
