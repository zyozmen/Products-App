import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`hu-rounded-2xl hu-border hu-border-slate-200 hu-bg-white hu-shadow-panel ${className}`}>{children}</section>;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const variants = {
    primary: 'hu-bg-blue-700 hu-text-white hover:hu-bg-blue-800 disabled:hu-bg-blue-300',
    secondary: 'hu-border hu-border-slate-300 hu-bg-white hu-text-slate-700 hover:hu-bg-slate-50 disabled:hu-text-slate-400',
    ghost: 'hu-text-slate-600 hover:hu-bg-slate-100',
  };
  return (
    <button
      className={`hu-inline-flex hu-items-center hu-justify-center hu-gap-2 hu-rounded-lg hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-transition hu-disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-text-slate-900 hu-outline-none placeholder:hu-text-slate-400 focus:hu-border-blue-600 focus:hu-ring-2 focus:hu-ring-blue-100 disabled:hu-bg-slate-100 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-text-slate-900 hu-outline-none focus:hu-border-blue-600 focus:hu-ring-2 focus:hu-ring-blue-100 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="hu-grid hu-gap-1.5 hu-text-sm hu-font-medium hu-text-slate-700">
      <span>{label}</span>
      {children}
      {error && <span className="hu-text-xs hu-font-normal hu-text-red-700" role="alert">{error}</span>}
      {!error && hint && <span className="hu-text-xs hu-font-normal hu-text-slate-500">{hint}</span>}
    </label>
  );
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return <div className="hu-rounded-lg hu-border hu-border-red-200 hu-bg-red-50 hu-p-3 hu-text-sm hu-text-red-800" role="alert">{children}</div>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'orange' | 'blue' }) {
  const tones = {
    neutral: 'hu-bg-slate-100 hu-text-slate-700',
    green: 'hu-bg-green-100 hu-text-green-800',
    orange: 'hu-bg-orange-100 hu-text-orange-800',
    blue: 'hu-bg-blue-100 hu-text-blue-800',
  };
  return <span className={`hu-inline-flex hu-items-center hu-rounded-full hu-px-2.5 hu-py-1 hu-text-xs hu-font-semibold ${tones[tone]}`}>{children}</span>;
}
