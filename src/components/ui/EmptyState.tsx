import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-[#c9d5db] bg-surface-muted px-6 py-12 text-center',
        className
      )}
    >
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {actionHref && actionLabel && (
        <div className="mt-5">
          <Link href={actionHref} className="btn-primary">
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
