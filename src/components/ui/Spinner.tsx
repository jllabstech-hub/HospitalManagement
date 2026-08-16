import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

export default function Spinner({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: SpinnerSize;
}) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent',
        SIZE_CLASS[size],
        className
      )}
      aria-hidden
    />
  );
}

export function BusyLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner />
      <span>{children}</span>
    </span>
  );
}
