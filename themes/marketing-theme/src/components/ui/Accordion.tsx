'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AccordionProps {
  items: {
    id: string;
    title: string;
    content: React.ReactNode;
  }[];
  defaultOpen?: string;
  className?: string;
}

export default function Accordion({ items, defaultOpen, className = '' }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen || null);

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          isOpen={openId === item.id}
          onClick={() => setOpenId(openId === item.id ? null : item.id)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

function AccordionItem({ title, isOpen, onClick, children }: { title: string; isOpen: boolean; onClick: () => void; children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | string>(0);

  useEffect(() => {
    if (isOpen) {
      const contentHeight = contentRef.current?.scrollHeight || 0;
      setHeight(contentHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className={`glass-card !rounded-3xl border transition-all duration-300 ${isOpen ? 'border-primary-600/20 shadow-2xl shadow-primary-600/5' : 'border-white/10 hover:border-white/30'}`}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 sm:p-8 text-left focus:outline-none group"
      >
        <span className={`text-base sm:text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-primary-600' : 'text-slate-900 group-hover:text-primary-600'}`}>
          {title}
        </span>
        <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-primary-600 text-white rotate-180 shadow-lg shadow-primary-600/20' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
          <ChevronDownIcon className="h-4 w-4" strokeWidth={3} />
        </div>
      </button>
      <div
        style={{ height }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div ref={contentRef} className="p-6 sm:p-8 pt-0 prose prose-sm sm:prose-base !max-w-none text-slate-600 border-t border-slate-50 mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
