'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpenIcon,
  CommandLineIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  CloudArrowUpIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  BoltIcon,
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
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const DOC_CATEGORIES = [
  {
    icon: CommandLineIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hoverBg: 'group-hover:bg-blue-600',
    title: 'Installation',
    desc: 'Get Mero CMS up and running on your local machine or server in under 5 minutes.',
    links: ['Local Setup', 'Environment Variables', 'Database Config', 'Docker Deploy'],
  },
  {
    icon: CubeTransparentIcon,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    hoverBg: 'group-hover:bg-violet-600',
    title: 'Content Modeling',
    desc: 'Define collections, forms, and custom schema extensions for your theme.',
    links: ['Collections API', 'Form Submissions', 'Field Types', 'Media Library'],
  },
  {
    icon: CpuChipIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    hoverBg: 'group-hover:bg-emerald-600',
    title: 'Development',
    desc: 'Deep dive into the core engine, plugin architecture, and custom module development.',
    links: ['Module Pattern', 'Auth Guards', 'Event Hooks', 'Webhooks'],
  },
  {
    icon: BookOpenIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    hoverBg: 'group-hover:bg-amber-600',
    title: 'Theme Building',
    desc: 'Master the Theme SDK and build high-performance Next.js marketing sites.',
    links: ['Theme.json Schema', 'Public API Client', 'Asset Optimization', 'Revalidation'],
  },
];

const QUICK_LINKS = [
  { label: 'Getting Started Guide', href: '#' },
  { label: 'API Reference', href: '#' },
  { label: 'Theme SDK', href: '#' },
  { label: 'Webhook Events', href: '#' },
  { label: 'License Activation', href: '#' },
  { label: 'Deployment', href: '#' },
];

export default function DocsPage() {
  return (
    <div className="overflow-x-hidden bg-white">

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-blue-400/8 blur-[140px]"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700"
          >
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Knowledge Base
          </motion.span>
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-8 text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-[0.88]"
          >
            How can we help you{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              build
            </span>{' '}
            today?
          </motion.h1>

          {/* Quick links */}
          <motion.div variants={fadeUp} custom={2} className="mt-10 flex flex-wrap justify-center gap-3">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── Doc Categories ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOC_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              variants={fadeUp}
              custom={i}
              className="group bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            >
              <div className="flex gap-6">
                <div className={`shrink-0 ${cat.bg} ${cat.color} p-4 rounded-2xl h-fit transition-all duration-300 ${cat.hoverBg} group-hover:text-white`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <div className="space-y-4 flex-1">
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{cat.title}</h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{cat.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.links.map((link) => (
                      <a
                        key={link}
                        href="#"
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <ArrowRightIcon className="h-3 w-3 shrink-0" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ── Quick Start — Dark Section ── */}
      <section className="bg-slate-900 py-28 overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white">
                <BoltIcon className="h-4 w-4 text-blue-400" /> Quick Start
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-[0.9]">
                Deploy the core<br />
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  in seconds
                </span>
                .
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-400 font-medium leading-relaxed">
                Mero CMS is designed for developer velocity. Bootstrap a professional headless environment with a single command.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex items-center gap-4">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg"
                >
                  <CloudArrowUpIcon className="h-4 w-4" /> Get the CLI
                </a>
                <a href="#" className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                  Full Guide <ArrowRightIcon className="h-4 w-4" />
                </a>
              </motion.div>
            </div>

            <motion.div variants={fadeUp} custom={2} className="relative">
              <div className="absolute -inset-4 bg-blue-600/20 blur-2xl rounded-3xl opacity-60" />
              <div className="relative bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 text-[10px] font-mono text-slate-500">bash</span>
                </div>
                <pre className="text-sm font-mono text-blue-300 leading-relaxed space-y-1">
                  <div><span className="text-slate-500">$</span> <span className="text-white">npx create-mero-app@latest</span> my-cms</div>
                  <div><span className="text-slate-500">$</span> <span className="text-white">cd</span> my-cms</div>
                  <div><span className="text-slate-500">$</span> <span className="text-white">npm install</span></div>
                  <div><span className="text-slate-500">$</span> <span className="text-white">npm run dev</span></div>
                  <div className="mt-3 text-emerald-400">✓ Mero CMS running on http://localhost:3000</div>
                </pre>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Support CTA ── */}
      <section className="bg-white py-28">
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-[1.5rem] border border-blue-100 mb-6"
          >
            <AcademicCapIcon className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black text-slate-900 tracking-tighter">
            Need architectural advice?
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-slate-500 font-medium max-w-lg mx-auto">
            Our partner agencies offer professional training and custom development support for Mero CMS.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
            >
              Talk to a Consultant <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

    </div>
  );
}
