'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowRightCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getDemoStatus } from '@/lib/cms';

export default function DemoBanner() {
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [nextResetAt, setNextResetAt] = useState<string | null>(null);

  useEffect(() => {
    const checkDemo = async () => {
      try {
        const { demoMode, nextResetAt } = await getDemoStatus();
        if (demoMode) {
          setShow(true);
          setNextResetAt(nextResetAt);
        }
      } catch (error) {
        // Silently fail if not a demo instance
      }
    };

    checkDemo();
  }, []);

  useEffect(() => {
    if (!nextResetAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const reset = new Date(nextResetAt).getTime();
      const diff = reset - now;

      if (diff <= 0) {
        setTimeLeft('Resetting...');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [nextResetAt]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-8 sm:w-[400px] z-[100] animate-slide-up">
      <div className="glass-card !bg-slate-900/90 !text-white !p-6 shadow-[0_20px_50px_rgba(37,99,235,0.2)] border-white/10 group">
        <button 
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex gap-4">
          <div className="bg-primary-600/20 p-3 rounded-2xl h-fit border border-primary-600/30">
            <ExclamationTriangleIcon className="h-6 w-6 text-primary-400" />
          </div>
          <div className="space-y-4 pr-4">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary-400 mb-1">Mero CMS Demo</h4>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-300 leading-relaxed">
                You are viewing a live seeded demo. All changes will be purged in:
                <span className="block mt-1 font-mono text-white text-base font-bold text-emerald-400">{timeLeft || '--h --m --s'}</span>
              </p>
            </div>
            
            <a 
              href="/pricing"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              Get License
              <ArrowRightCircleIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Shine Animation */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}
