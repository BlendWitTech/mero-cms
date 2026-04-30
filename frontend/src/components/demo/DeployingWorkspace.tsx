'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArchitecturalNexus from './ArchitecturalNexus';

interface LogEntry {
  level: string;
  message: string;
}

interface DeployingWorkspaceProps {
  progress: number;
  externalLogs?: LogEntry[];
}

export default function DeployingWorkspace({ progress, externalLogs = [] }: DeployingWorkspaceProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [externalLogs]);

  // Fallback logs if none provided (for initial skeleton)
  const displayLogs = externalLogs.length > 0 ? externalLogs : [
    { level: 'CORE', message: 'Handshaking with provisioning gateway...' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950 font-mono">
      <ArchitecturalNexus />

      <div className="relative z-10 w-full max-w-3xl px-6">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase"
          >
            Provisioning Dedicated Session
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4"
          >
            Synthesizing <span className="text-red-500">Mero</span> CMS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-sm font-medium"
          >
            Your dedicated PostgreSQL sandbox is being crafted in real-time.
          </motion.p>
        </div>

        {/* Console / Log Terminal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>
            <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              provisioning-session.log
            </div>
            <div className="w-12 text-right">
              <span className="text-[10px] font-bold text-red-500 animate-pulse">LIVE</span>
            </div>
          </div>

          {/* Log Area */}
          <div className="h-64 overflow-y-auto p-6 space-y-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {displayLogs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-4 text-[12px] leading-relaxed"
                >
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}]</span>
                  <span className={`font-bold shrink-0 ${
                    log.level === 'INFRA' ? 'text-blue-400' :
                    log.level === 'DB' ? 'text-purple-400' :
                    log.level === 'SEED' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {log.level}:
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <motion.div
              className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Allocating cloud cycles · Estimated time ~30s
          </p>
        </motion.div>
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-slate-900 m-8" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-slate-900 m-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-slate-900 m-8" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-slate-900 m-8" />
    </div>
  );
}
