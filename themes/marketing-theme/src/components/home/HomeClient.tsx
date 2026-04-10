'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRightIcon,
  CheckIcon,
  BoltIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { SiteData, CmsPackage, formatPrice, cmsImageUrl } from '@/lib/cms';

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.7, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// --- Animated Section Wrapper ---
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// --- Dashboard Preview Component ---
function DashboardPreview() {
  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-6 bg-gradient-to-br from-blue-600/15 via-violet-500/10 to-cyan-500/10 rounded-3xl blur-3xl" />

      {/* Browser chrome wrapper */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-900/20 bg-white">

        {/* Browser address bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] font-mono text-slate-400 w-52 text-center">
              dashboard.mero-cms.com
            </div>
          </div>
        </div>

        {/* Scale container */}
        <div className="relative overflow-hidden" style={{ height: 420 }}>
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ width: 900, transform: 'scale(0.62)' }}
          >
            <div className="flex bg-slate-50" style={{ minHeight: Math.round(420 / 0.62) }}>
              {/* Sidebar */}
              <div className="w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col p-4 gap-1">
                <div className="flex items-center gap-2 px-3 py-3 mb-3">
                  <div className="w-7 h-7 bg-blue-600 rounded-xl" />
                  <span className="text-base font-black text-slate-900">Mero<span className="text-blue-600">CMS</span></span>
                </div>
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'Blog Posts', active: false },
                  { label: 'Site Pages', active: false },
                  { label: 'Media Library', active: false },
                  { label: 'Themes', active: false },
                  { label: 'Users', active: false },
                  { label: 'Settings', active: false },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-slate-300'}`} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div className="flex-1 p-8 space-y-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard <span className="text-blue-600">Overview</span></h1>
                    <p className="text-sm text-slate-500 font-semibold mt-1">System metrics and recent activity for your project.</p>
                  </div>
                </div>
                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-5">
                  <div className="relative overflow-hidden rounded-[2rem] p-6 bg-slate-900 border border-slate-700 shadow-xl col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-white/10 rounded-2xl ring-1 ring-white/20">
                        <BoltIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/20 text-white uppercase tracking-widest">Enterprise</span>
                    </div>
                    <div className="mt-7">
                      <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest">License Status</p>
                      <p className="text-lg font-extrabold text-white mt-1">Verified & Active</p>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-[2rem] p-6 bg-white border border-blue-200 shadow-sm col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-blue-100 rounded-2xl ring-1 ring-black/5">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-7">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Posts</p>
                      <p className="text-3xl font-extrabold text-slate-900 mt-1">128</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HomeClientProps {
    siteData: SiteData;
    packages: CmsPackage[];
}

export default function HomeClient({ siteData, packages }: HomeClientProps) {
  const { settings, services, testimonials } = siteData;
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [pricingTab, setPricingTab] = useState<'personal' | 'organizational'>('personal');

  const filteredPackages = packages.filter(p => p.websiteType === pricingTab);

  return (
    <div className="overflow-x-hidden bg-white">
      {/* --- HERO --- */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
        <motion.div className="absolute inset-0 -z-10" style={{ y: heroY, opacity: heroOpacity }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/40" />
          <motion.div
            className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[120px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-400/10 blur-[100px]"
            animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />
        </motion.div>

        <div className="container-custom w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            <motion.div variants={staggerContainer} className="space-y-8">
              <motion.div variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm text-sm font-bold text-slate-700 backdrop-blur-sm">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute h-2 w-2 rounded-full bg-blue-500 opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-blue-600" />
                  </span>
                  {settings.siteTitle || 'Mero CMS'} — Premium Infrastructure
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter text-slate-900 font-display leading-[0.88]"
              >
                {settings.heroTitle || 'Build your website '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    {settings.heroSubtitle || 'the smart way'}
                  </span>
                  <motion.span
                    className="absolute bottom-1 left-0 h-[3px] w-full bg-gradient-to-r from-blue-600 to-violet-600 rounded-full opacity-30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                  />
                </span>
                .
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg sm:text-xl text-slate-500 font-medium leading-relaxed max-w-xl"
              >
                {settings.tagline || 'Fully-featured content management system with pre-built themes, AI writing tools, and a one-time license.'}
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/pricing"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-[15px]"
                >
                  {settings.ctaText || 'View Pricing'}
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-[15px]"
                >
                  Try Live Demo
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="relative hidden lg:block">
              <DashboardPreview />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- SERVICES / FEATURES SECTION --- */}
      <Section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-2xl mb-16 space-y-5">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                Capabilities
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
              {settings.aboutTitle || 'Everything you need.'}<br />
              <span className="text-slate-400">Nothing you don't.</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, i) => (
              <motion.div
                key={service.id || i}
                variants={fadeUp}
                custom={i * 0.5}
                className="group relative p-7 rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all duration-300 cursor-default hover:border-blue-200 hover:shadow-blue-600/5"
              >
                {service.icon && (
                    <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300">
                        <RocketLaunchIcon className="h-6 w-6" />
                    </div>
                )}
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{service.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
            {services.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold italic">
                    Add services in the CMS to see them appear here.
                </div>
            )}
          </div>
        </div>
      </Section>

      {/* --- PRICING SECTION --- */}
      <Section className="section-padding bg-slate-50">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div className="space-y-5 text-center sm:text-left">
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-violet-50 text-violet-700 border border-violet-100">
                  Pricing
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
                One-time pricing.<br />
                <span className="text-slate-400">Lifetime value.</span>
              </motion.h2>
            </div>
          </div>

          {/* Tab switcher */}
          <motion.div variants={fadeUp} custom={2} className="flex justify-center mb-10">
            <div className="inline-flex bg-white shadow-sm border border-slate-200 rounded-2xl p-1.5 gap-1">
              {(['personal', 'organizational'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPricingTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 capitalize ${
                    pricingTab === tab
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredPackages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                variants={fadeUp}
                custom={i}
                className={`relative flex flex-col rounded-[2rem] border p-8 transition-all duration-300 ${
                  pkg.highlighted
                    ? 'bg-slate-900 border-slate-700 shadow-2xl scale-[1.03] z-10'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl'
                }`}
              >
                {pkg.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                    ✦ Most Popular
                  </div>
                )}

                <div className="mb-8 space-y-4">
                  <h3 className={`text-2xl font-black font-display tracking-tight ${pkg.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.name}
                  </h3>
                  <div>
                    <span className={`text-4xl font-black tracking-tighter ${pkg.highlighted ? 'text-white' : 'text-slate-900'}`}>
                      {formatPrice(pkg.priceNPR)}
                    </span>
                    <span className={`text-sm font-semibold ml-2 ${pkg.highlighted ? 'text-slate-400' : 'text-slate-400'}`}>
                      one-time
                    </span>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed ${pkg.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                    {pkg.tagline}
                  </p>

                  <div className="pt-2 space-y-2.5">
                    {pkg.features.map((f) => (
                      <div key={f} className="flex items-start gap-3">
                        <CheckIcon className={`h-4 w-4 mt-0.5 stroke-[3] ${pkg.highlighted ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <span className={`text-sm font-medium ${pkg.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/demo?package=${pkg.id}`}
                  className={`mt-auto block w-full text-center py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
                    pkg.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Try For Free
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- TESTIMONIALS SECTION --- */}
      {testimonials.length > 0 && (
          <Section className="section-padding bg-white">
            <div className="container-custom">
              <div className="max-w-xl mb-14 space-y-5">
                <motion.div variants={fadeUp} custom={0}>
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Trusted
                  </span>
                </motion.div>
                <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
                  Loved by teams.<br />
                  <span className="text-slate-400">Verified success.</span>
                </motion.h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <motion.div
                    key={t.id || i}
                    variants={fadeUp}
                    custom={i}
                    className="bg-slate-50 rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                      <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-md">
                        {t.clientName.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{t.clientName}</p>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.clientRole}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
      )}

      {/* --- FINAL CTA --- */}
      <Section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            variants={fadeUp}
            className="relative rounded-[3rem] bg-slate-900 overflow-hidden px-8 py-24 sm:px-20 text-center"
          >
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight font-display leading-[0.9]">
                Ready to build with <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{settings.siteTitle || 'Mero CMS'}?</span>
              </h2>
              <p className="text-lg text-slate-400 font-medium leading-relaxed">
                Join hundreds of developers building the future of the web in Nepal. One license, infinite possibilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/pricing"
                  className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs"
                >
                  Buy License Now
                </Link>
                <Link
                  href="/demo"
                  className="px-10 py-5 bg-white/10 text-white font-black rounded-2xl border border-white/20 hover:bg-white/20 transition-all uppercase tracking-widest text-xs"
                >
                  Try Free Demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>
    </div>
  );
}
