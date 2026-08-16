import Link from 'next/link';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/config';

interface BrandLogoProps {
  href?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  stacked?: boolean;
  className?: string;
}

export default function BrandLogo({
  href = '/',
  variant = 'dark',
  size = 'md',
  showTagline = false,
  stacked = false,
  className,
}: BrandLogoProps) {
  const markSize = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : stacked ? 'h-10 w-10' : 'h-9 w-9';
  const titleSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : stacked ? 'text-[17px] leading-none' : 'text-base';
  const isLight = variant === 'light';

  const content = (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-2.5 sm:gap-3', className)}>
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-[10px]',
          markSize,
          isLight ? 'bg-white/15 ring-1 ring-white/25' : 'bg-brand-800 text-white'
        )}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="h-[52%] w-[52%]" fill="none">
          <path
            d="M16 7v18M7 16h18"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={cn('min-w-0 text-left', !stacked && 'truncate')}>
        {stacked ? (
          <>
            <span
              className={cn(
                'block truncate font-display font-semibold tracking-tight',
                titleSize,
                isLight ? 'text-white' : 'text-brand-900'
              )}
            >
              {APP_CONFIG.shortName}
            </span>
            <span
              className={cn(
                'mt-0.5 block text-[13px] font-medium tracking-wide',
                isLight ? 'text-brand-100/85' : 'text-ink-muted'
              )}
            >
              Hospital
            </span>
          </>
        ) : (
          <span
            className={cn(
              'block truncate font-display font-semibold tracking-tight',
              titleSize,
              isLight ? 'text-white' : 'text-ink'
            )}
          >
            {APP_CONFIG.shortName}
            <span className={cn('font-medium', isLight ? 'text-brand-100' : 'text-brand-600')}>
              {' '}
              Hospital
            </span>
          </span>
        )}
        {showTagline && (
          <span
            className={cn(
              'mt-0.5 hidden truncate text-[11px] font-medium tracking-wide sm:block',
              isLight ? 'text-brand-100/80' : 'text-ink-soft'
            )}
          >
            Patient-first outpatient care
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="group inline-flex min-w-0 max-w-full focus-visible:rounded-lg">
      {content}
    </Link>
  );
}
