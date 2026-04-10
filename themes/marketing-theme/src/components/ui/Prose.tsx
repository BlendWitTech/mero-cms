import React from 'react';

interface ProseProps {
  html: string;
  className?: string;
}

export default function Prose({ html, className = '' }: ProseProps) {
  return (
    <div 
      className={`prose prose-slate prose-lg max-w-none 
        prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight 
        prose-a:text-primary-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline 
        prose-img:rounded-[2rem] prose-img:shadow-2xl prose-img:border prose-img:border-slate-100 
        prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:bg-slate-50 prose-blockquote:p-8 prose-blockquote:rounded-r-[2rem]
        ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Use this for smaller content like excerpts or card descriptions
 */
export function ProseSmall({ html, className = '' }: ProseProps) {
  return (
    <div 
      className={`prose prose-slate prose-sm max-w-none 
        prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight 
        prose-a:text-primary-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline 
        prose-img:rounded-3xl prose-img:shadow-xl
        ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
