import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

const buttonVariants = {
  primary: 'hu-bg-green-700 hu-text-white hover:hu-bg-green-800 disabled:hu-bg-green-300',
  secondary: 'hu-border hu-border-slate-300 hu-bg-white hu-text-slate-700 hover:hu-bg-slate-50 disabled:hu-text-slate-400',
  ghost: 'hu-text-slate-600 hover:hu-bg-slate-100',
  destructive: 'hu-bg-red-700 hu-text-white hover:hu-bg-red-800 disabled:hu-bg-red-300',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      className={`hu-inline-flex hu-cursor-pointer hu-items-center hu-justify-center hu-gap-2 hu-rounded-lg hu-border-0 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-transition hu-focus-visible:outline-none hu-focus-visible:ring-2 hu-focus-visible:ring-green-500 hu-focus-visible:ring-offset-2 hu-disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`hu-rounded-2xl hu-border hu-border-slate-200 hu-bg-white hu-shadow-panel ${className}`}>{children}</section>;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`hu-box-border hu-w-full hu-min-w-0 hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-text-slate-900 hu-outline-none placeholder:hu-text-slate-400 focus:hu-border-green-600 focus:hu-ring-2 focus:hu-ring-green-100 disabled:hu-bg-slate-100 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`hu-box-border hu-w-full hu-min-w-0 hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-text-slate-900 hu-outline-none focus:hu-border-green-600 focus:hu-ring-2 focus:hu-ring-green-100 disabled:hu-bg-slate-100 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children,
  hint,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="hu-grid hu-content-start hu-gap-1.5 hu-text-sm hu-font-medium hu-text-slate-700">
      <span>{label}</span>
      {children}
      {error && <span className="hu-text-xs hu-font-normal hu-text-red-700" role="alert">{error}</span>}
      {!error && hint && <span className="hu-text-xs hu-font-normal hu-text-slate-500">{hint}</span>}
    </label>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'orange' | 'blue' | 'red';
}) {
  const tones = {
    neutral: 'hu-bg-slate-100 hu-text-slate-700',
    green: 'hu-bg-green-100 hu-text-green-800',
    orange: 'hu-bg-orange-100 hu-text-orange-800',
    blue: 'hu-bg-blue-100 hu-text-blue-800',
    red: 'hu-bg-red-100 hu-text-red-800',
  };
  return <span className={`hu-inline-flex hu-items-center hu-rounded-full hu-px-2.5 hu-py-1 hu-text-xs hu-font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Table({ className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`hu-w-full hu-caption-bottom hu-text-sm ${className}`} {...props} />;
}

export function TableHeader({ className = '', ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`hu-border-b hu-bg-slate-50 ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`[&_tr:last-child]:hu-border-0 ${className}`} {...props} />;
}

export function TableRow({ className = '', ...props }: TableHTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hu-border-b hu-transition-colors hover:hu-bg-green-50/10 ${className}`} {...props} />;
}

export function TableHead({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`hu-h-11 hu-px-4 hu-text-left hu-align-middle hu-font-semibold hu-text-slate-600 ${className}`} {...props} />;
}

export function TableCell({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`hu-px-4 hu-py-3 hu-align-middle ${className}`} {...props} />;
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return <div className="hu-rounded-lg hu-border hu-border-red-200 hu-bg-red-50 hu-p-3 hu-text-sm hu-text-red-800" role="alert">{children}</div>;
}
