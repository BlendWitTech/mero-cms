import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  loading,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-2xl';
  
  const variants = {
    primary: 'bg-primary-600 text-white shadow-xl shadow-primary-600/20 hover:bg-primary-700 hover:shadow-primary-700/30',
    secondary: 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-900 hover:border-primary-600 hover:text-primary-600',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    white: 'bg-white text-primary-600 shadow-xl shadow-white/10 hover:bg-slate-50',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  const content = (
    <>
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} disabled={loading} {...props}>
      {content}
    </button>
  );
}
