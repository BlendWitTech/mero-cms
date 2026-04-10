'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { getPackages, startDemo, formatPrice, type CmsPackage, type WebsiteType } from '@/lib/cms';
import Link from 'next/link';
import {
  UserIcon,
  BuildingOffice2Icon,
  CheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type Step = 'type' | 'package' | 'loading' | 'ready' | 'error';

function DemoSelectorInner() {
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get('package');

  const [step, setStep] = useState<Step>('type');
  const [websiteType, setWebsiteType] = useState<WebsiteType | null>(null);
  const [packages, setPackages] = useState<CmsPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CmsPackage | null>(null);
  const [demoSession, setDemoSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => { getPackages().then(setPackages); }, []);

  useEffect(() => {
    if (preselectedPackage && packages.length > 0) {
      const pkg = packages.find((p) => p.id === preselectedPackage);
      if (pkg) { setWebsiteType(pkg.websiteType); setSelectedPackage(pkg); setStep('package'); }
    }
  }, [preselectedPackage, packages]);

  useEffect(() => {
    if (!demoSession?.expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(demoSession.expiresAt).getTime() - Date.now()) / 1000));
      setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [demoSession]);

  function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async function handleStartDemo(pkg: CmsPackage) {
    setSelectedPackage(pkg);
    setStep('loading');
    setError(null);
    const result = await startDemo(pkg.id);
    if (!result.success || !result.data) {
      setError(result.error || 'Failed to start demo. Please try again.');
      setStep('error');
      return;
    }
    setDemoSession(result.data);
    setStep('ready');
  }

  const filteredPackages = packages.filter((p) => p.websiteType === websiteType);

  // ── Step 1: Choose type ──────────────────────────────────────────────────────
  if (step === 'type') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-32 bg-white">
        <AnimatedSection className="text-center space-y-4 mb-14 max-w-2xl">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700"
          >
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Live Demo — 60 Minutes Free
          </motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9]">
            What type of website are{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              you building?
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 font-medium">
            Select your website type to see the packages available for your needs.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {[
            {
              type: 'personal' as WebsiteType,
              icon: UserIcon,
              label: 'Personal Website',
              sub: 'Portfolio, personal blog, bio',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              hoverBorder: 'hover:border-blue-400',
              hoverGlow: 'hover:shadow-blue-100',
            },
            {
              type: 'organizational' as WebsiteType,
              icon: BuildingOffice2Icon,
              label: 'Organizational Website',
              sub: 'Business, startup, company',
              color: 'text-violet-600',
              bg: 'bg-violet-50',
              hoverBorder: 'hover:border-violet-400',
              hoverGlow: 'hover:shadow-violet-100',
            },
          ].map((opt, i) => (
            <motion.button
              key={opt.type}
              variants={fadeUp}
              custom={i}
              onClick={() => { setWebsiteType(opt.type); setStep('package'); }}
              className={`group flex flex-col items-center gap-5 p-10 bg-white border-2 border-slate-200 rounded-[2rem] ${opt.hoverBorder} hover:shadow-2xl ${opt.hoverGlow} hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`w-16 h-16 ${opt.bg} rounded-2xl flex items-center justify-center transition-colors duration-300`}>
                <opt.icon className={`h-8 w-8 ${opt.color}`} />
              </div>
              <div className="text-center">
                <p className="font-black text-xl text-slate-900">{opt.label}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{opt.sub}</p>
              </div>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${opt.color}`}>
                Choose this <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </AnimatedSection>
      </div>
    );
  }

  // ── Step 2: Choose package ───────────────────────────────────────────────────
  if (step === 'package') {
    return (
      <div className="min-h-screen bg-white px-4 py-32">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center space-y-4 mb-14">
            <motion.button
              variants={fadeUp}
              onClick={() => setStep('type')}
              className="text-sm text-slate-400 hover:text-slate-600 font-bold transition-colors flex items-center gap-1.5 mx-auto"
            >
              ← Change website type
            </motion.button>
            <motion.span variants={fadeUp} custom={1} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              {websiteType === 'personal' ? 'Personal Website' : 'Organizational Website'} Packages
            </motion.span>
            <motion.h2 variants={fadeUp} custom={2} className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              Select a package to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">try free</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={3} className="text-slate-500 font-medium">
              Your free demo environment is ready in under 30 seconds and lasts 60 minutes.
            </motion.p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className={`grid grid-cols-1 md:grid-cols-2 ${filteredPackages.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 items-start`}
          >
            {filteredPackages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                variants={fadeUp}
                custom={i}
                className={`relative flex flex-col rounded-[2rem] p-7 border transition-all duration-300 ${
                  pkg.highlighted
                    ? 'bg-slate-900 border-slate-700 shadow-2xl scale-[1.02]'
                    : 'bg-white border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {pkg.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow uppercase tracking-widest">
                      <SparklesIcon className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    {pkg.aiEnabled && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${pkg.highlighted ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-50 text-violet-600'}`}>
                        <SparklesIcon className="h-3 w-3" /> AI
                      </span>
                    )}
                  </div>
                  <h3 className={`font-black text-xl tracking-tight ${pkg.highlighted ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                  <p className={`font-bold text-lg mt-1 ${pkg.highlighted ? 'text-blue-400' : 'text-blue-600'}`}>{formatPrice(pkg.priceNPR)}</p>
                  <p className={`text-sm mt-1 font-medium ${pkg.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>{pkg.tagline}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {pkg.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckIcon className={`h-4 w-4 shrink-0 mt-0.5 stroke-[3] ${pkg.highlighted ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      <span className={`text-sm font-medium ${pkg.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                  {pkg.features.length > 5 && (
                    <li className={`text-xs font-medium pl-6.5 ${pkg.highlighted ? 'text-slate-500' : 'text-slate-400'}`}>
                      +{pkg.features.length - 5} more features
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => handleStartDemo(pkg)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
                    pkg.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Try This Package <ArrowRightIcon className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Step 3: Loading ──────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8 bg-white">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-200 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-black text-2xl text-slate-900 tracking-tight">Setting up your demo…</p>
          <p className="text-slate-500 font-medium">Provisioning a <strong>{selectedPackage?.name}</strong> environment for you.</p>
        </div>
      </div>
    );
  }

  // ── Step 4: Error ────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8 bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-[1.5rem] border border-red-100 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <p className="font-black text-2xl text-slate-900 tracking-tight">Demo unavailable</p>
          <p className="text-slate-500 font-medium">{error || 'All demo slots are currently in use. Please try again in a few minutes.'}</p>
        </div>
        <button
          onClick={() => setStep('package')}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          <ArrowPathIcon className="h-4 w-4" /> Try Again
        </button>
      </div>
    );
  }

  // ── Step 5: Ready ────────────────────────────────────────────────────────────
  if (step === 'ready' && demoSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-white">
        <AnimatedSection className="flex flex-col items-center gap-8 max-w-lg w-full text-center">
          <motion.div
            variants={fadeUp}
            className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center justify-center"
          >
            <CheckIcon className="h-10 w-10 text-emerald-500 stroke-[3]" />
          </motion.div>

          <div className="space-y-3">
            <motion.span variants={fadeUp} custom={1} className="inline-flex px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              Demo Ready
            </motion.span>
            <motion.h2 variants={fadeUp} custom={2} className="font-black text-4xl text-slate-900 tracking-tight">
              Your demo is live!
            </motion.h2>
            <motion.p variants={fadeUp} custom={3} className="text-slate-500 font-medium">
              You're exploring the <strong className="text-slate-900">{demoSession.package?.name}</strong> package experience.
            </motion.p>
            {countdown !== null && (
              <motion.div variants={fadeUp} custom={4} className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-amber-100">
                <ClockIcon className="h-4 w-4" />
                Session expires in {formatCountdown(countdown)}
              </motion.div>
            )}
          </div>

          <motion.div
            variants={fadeUp}
            custom={5}
            className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-3"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Demo Credentials</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">Email</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{demoSession.demoCredentials?.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">Password</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{demoSession.demoCredentials?.adminPassword}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium pt-1 border-t border-slate-100">These credentials are for this session only and will be deleted when it expires.</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="flex flex-col sm:flex-row gap-3 w-full">
            <a
              href={`${demoSession.instanceUrl}/dashboard`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5"
            >
              Open Dashboard <ArrowRightIcon className="h-4 w-4" />
            </a>
            <Link
              href={`/pricing`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-sm uppercase tracking-widest hover:border-blue-300 transition-all"
            >
              View Pricing
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    );
  }

  return null;
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>
    }>
      <DemoSelectorInner />
    </Suspense>
  );
}
