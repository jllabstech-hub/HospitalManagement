import { cn } from '@/lib/utils';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
}

export default function PageHero({ title, subtitle, eyebrow, className }: PageHeroProps) {
  return (
    <section className={cn('border-b border-border bg-surface-muted/40 py-12 sm:py-16', className)}>
      <div className="container-page">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-display-sm text-ink sm:text-display-md text-balance">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
