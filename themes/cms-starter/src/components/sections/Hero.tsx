import Link from 'next/link';
import type { SiteSettings } from '@/lib/cms';

interface HeroProps {
  settings: SiteSettings;
}

export default function Hero({ settings }: HeroProps) {
  const title = settings.heroTitle || 'Build Powerful Websites — Without the Complexity';
  const subtitle =
    settings.heroSubtitle ||
    'Mero CMS gives developers and businesses a clean content management system with a beautiful dashboard, theme switching, media library, and a public REST API.';
  const ctaText = settings.ctaText || 'Get Started Free';
  const ctaUrl = settings.ctaUrl || 'https://github.com/BlendWitTech/blendwit-cms-saas';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Open Source &amp; Self-Hostable
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-indigo-100 leading-relaxed mb-10 max-w-3xl mx-auto">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ctaUrl}
              target={ctaUrl.startsWith('http') ? '_blank' : undefined}
              rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="w-full sm:w-auto bg-white text-indigo-700 px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl"
            >
              {ctaText}
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto border-2 border-white/60 text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-white/10 hover:border-white transition-colors backdrop-blur-sm"
            >
              Live Demo →
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-indigo-200 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              No vendor lock-in
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              REST API included
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Deploy in minutes
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Switchable themes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
