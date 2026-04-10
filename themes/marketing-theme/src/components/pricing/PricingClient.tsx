'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { formatPrice, type CmsPackage, type WebsiteType, SiteData } from '@/lib/cms';
import Link from 'next/link';
import {
  CheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const FAQ_ITEMS = [
  { q: 'Is the license one-time or recurring?', a: 'One-time. You pay once and own the software forever for a single website on a single domain. No monthly subscription fees ever.' },
  { q: 'What AI features are included?', a: 'Professional and Enterprise packages include AI Content Writer, AI SEO Optimizer (meta titles & descriptions), and AI Image Alt Text Generator. AI Chatbot is coming soon.' },
  { q: 'Can I upgrade my package later?', a: 'Yes. Purchase a higher-tier license at any time and contact us — we apply a credit for your original purchase.' },
  { q: 'How do I receive my license after payment?', a: 'After successful payment via Khalti or eSewa, your license key is auto-generated and emailed within minutes with setup instructions.' },
  { q: 'What is included in the theme?', a: 'Every package includes at least one pre-built professional starter theme. Premium and Enterprise include multiple theme choices plus full customisation.' },
  { q: 'What payment methods do you accept?', a: "Khalti and eSewa — Nepal's most trusted digital payment gateways. All prices are in Nepali Rupees (NPR)." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-base font-bold text-slate-900">{q}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-5 text-sm font-medium text-slate-500 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: CmsPackage }) {
  const tierLabel: Record<number, string> = { 1: 'Basic', 2: 'Premium', 3: 'Enterprise', 4: 'Custom' };
  const isHighlighted = pkg.highlighted;

  return (
    <motion.div
      variants={fadeUp}
      className={`relative flex flex-col rounded-[2.5rem] p-8 border transition-all duration-500 ${
        isHighlighted
          ? 'bg-slate-900 border-slate-700 shadow-2xl shadow-slate-900/30 scale-[1.02]'
          : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
            <SparklesIcon className="h-3 w-3" /> Most Popular
          </span>
        </div>
      )}

      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
            isHighlighted ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'
          }`}>
            {tierLabel[pkg.tier] || 'Basic'}
          </span>
          {pkg.aiEnabled && (
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 ${
              isHighlighted ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-50 text-violet-600'
            }`}>
              <SparklesIcon className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        <h3 className={`text-2xl font-black tracking-tight mt-3 ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>
          {pkg.name}
        </h3>
        <div className="flex items-baseline gap-1 mt-2">
          {pkg.priceNPR === 'custom' ? (
            <span className={`text-3xl font-black tracking-tighter ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>Custom</span>
          ) : (
            <span className={`text-3xl font-black tracking-tighter ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>
              {formatPrice(pkg.priceNPR)}
            </span>
          )}
        </div>
        <p className={`text-sm font-medium leading-relaxed mt-1 ${isHighlighted ? 'text-slate-400' : 'text-slate-500'}`}>
          {pkg.tagline}
        </p>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              isHighlighted ? 'bg-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'
            }`}>
              <CheckIcon className={`h-3 w-3 stroke-[3] ${isHighlighted ? 'text-emerald-400' : 'text-emerald-500'}`} />
            </div>
            <span className={`text-sm font-medium ${isHighlighted ? 'text-slate-300' : 'text-slate-700'}`}>{feature}</span>
          </li>
        ))}
        {pkg.comingSoon?.map((feature) => (
          <li key={feature} className="flex items-start gap-3 opacity-50">
            <div className="shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
              <ClockIcon className="h-3 w-3 text-slate-400 stroke-[2]" />
            </div>
            <span className={`text-sm font-medium italic ${isHighlighted ? 'text-slate-400' : 'text-slate-500'}`}>
              {feature} <span className="not-italic text-[10px] font-bold uppercase tracking-widest">Soon</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        {pkg.priceNPR === 'custom' ? (
          <Link
            href="/contact"
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
              isHighlighted
                ? 'bg-white text-slate-900 hover:bg-slate-100'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" /> Contact Sales
          </Link>
        ) : (
          <Link
            href={`/contact?package=${pkg.id}`}
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
              isHighlighted
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
            }`}
          >
            Get Started <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
        <Link
          href={`/demo?package=${pkg.id}`}
          className={`block text-center text-sm font-bold py-2 transition-colors ${
            isHighlighted ? 'text-slate-400 hover:text-white' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          Try free demo →
        </Link>
      </div>
    </motion.div>
  );
}

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

interface PricingClientProps {
    packages: CmsPackage[];
    siteData: SiteData;
}

export default function PricingClient({ packages, siteData }: PricingClientProps) {
  const [activeType, setActiveType] = useState<WebsiteType>('personal');
  const filtered = packages.filter((p) => p.websiteType === activeType);

  return (
    <div className="overflow-x-hidden bg-white">

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-400/8 blur-[120px]"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Simple, One-Time Pricing
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-8 text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-[0.88]"
          >
            The right package for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              your website
            </span>
            .
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-6 text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            One-time license. No monthly fees. Full ownership. Pre-built themes included in every package.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10 flex justify-center">
            <div className="inline-flex bg-slate-100 rounded-2xl p-1.5 gap-1">
              {(['personal', 'organizational'] as WebsiteType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeType === type
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type === 'personal' ? 'Personal Website' : 'Organizational Website'}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Package Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <motion.div
            key={activeType}
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className={`grid grid-cols-1 md:grid-cols-2 ${filtered.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 items-start`}
          >
            {filtered.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center font-bold text-slate-400">
                    No packages found for this type. Ensure backend packages are configured.
                </div>
            )}
          </motion.div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <motion.span
                variants={fadeUp}
                className="inline-flex text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
              >
                FAQ
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                Frequently asked questions
              </motion.h2>
            </div>
            <motion.div variants={fadeUp} custom={2} className="md:col-span-2 bg-white rounded-[2rem] border border-slate-200 px-8 py-4 shadow-sm">
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
