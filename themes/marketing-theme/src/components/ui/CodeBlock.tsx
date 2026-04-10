'use client';

import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export default function CodeBlock({ code, language = 'bash', className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative rounded-[2rem] bg-slate-950 p-1 border border-white/5 shadow-2xl overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
          <span className="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{language}</span>
        </div>
        <button
          onClick={copy}
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-400 hover:text-white group/btn flex items-center gap-2"
        >
          {copied ? (
            <>
              <span className="text-[10px] font-bold text-emerald-400">Copied!</span>
              <CheckIcon className="h-4 w-4 text-emerald-400" />
            </>
          ) : (
            <ClipboardIcon className="h-4 w-4 group-hover/btn:scale-110" />
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-8 font-mono text-sm sm:text-base text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
        <pre>
          <code>{code}</code>
        </pre>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
