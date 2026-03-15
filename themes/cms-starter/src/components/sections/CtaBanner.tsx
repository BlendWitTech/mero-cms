import Link from 'next/link';
import type { SiteSettings } from '@/lib/cms';

interface CtaBannerProps {
  settings: SiteSettings;
}

export default function CtaBanner({ settings }: CtaBannerProps) {
  const ctaUrl =
    settings.ctaUrl || 'https://github.com/BlendWitTech/blendwit-cms-saas';

  return (
    <section className="py-20 bg-indigo-700 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600 rounded-full opacity-50" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-700 rounded-full opacity-50" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
          <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          Free &amp; Open Source
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Ready to build something great?
        </h2>

        <p className="text-indigo-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Join developers and teams who have simplified their content workflow with Mero CMS.
          Deploy in minutes. Manage content yourself. Scale without limits.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaUrl}
            target={ctaUrl.startsWith('http') ? '_blank' : undefined}
            rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="w-full sm:w-auto bg-white text-indigo-700 px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started on GitHub
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto border-2 border-white/50 text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-white/10 hover:border-white transition-colors"
          >
            View Dashboard →
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-white">100%</div>
            <div className="text-indigo-300 text-xs mt-1">Open Source</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-white">REST</div>
            <div className="text-indigo-300 text-xs mt-1">API Included</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-white">∞</div>
            <div className="text-indigo-300 text-xs mt-1">Themes</div>
          </div>
        </div>
      </div>
    </section>
  );
}
