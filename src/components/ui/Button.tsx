'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { BusyLabel } from '@/components/ui/Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'btn-secondary',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: '',
  lg: 'px-6 py-3.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  className,
  loading = false,
  children,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const formStatus = useFormStatus();
  const classes = cn(variantClass[variant], sizeClass[size], className);
  const busy = loading || (type === 'submit' && formStatus.pending);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? 'button'} className={classes} disabled={disabled || busy} aria-busy={busy} {...props}>
      {busy ? <BusyLabel>{children}</BusyLabel> : children}
    </button>
  );
}
