import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'white' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  hoverable?: boolean;
}

export default function Card({
  children,
  variant = 'glass',
  padding = 'md',
  className = '',
  hoverable = false,
}: CardProps) {
  const baseStyles = 'rounded-[2rem] overflow-hidden transition-all duration-500';
  
  const variants = {
    glass: 'glass-card',
    white: 'bg-white shadow-xl shadow-slate-200 border border-slate-100',
    outline: 'bg-transparent border-2 border-slate-200',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-12',
  };

  const hoverStyles = hoverable 
    ? 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary-600/10 hover:border-primary-600/20 active:scale-[0.99]' 
    : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-8 pt-6 border-t border-slate-100 ${className}`}>{children}</div>;
}
