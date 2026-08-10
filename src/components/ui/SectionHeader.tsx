import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        Boolean(action) && 'sm:flex-row sm:items-end sm:justify-between sm:text-left',
        className
      )}
    >
      <div className={cn(align === 'center' && !action && 'mx-auto max-w-2xl')}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-display text-display-sm text-ink sm:text-display-md text-balance">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
