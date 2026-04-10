import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-widest rounded-full border';
  
  const variants = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    outline: 'bg-transparent text-slate-500 border-slate-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[8px] sm:text-[9px]',
    md: 'px-3 py-1 text-[10px]',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
