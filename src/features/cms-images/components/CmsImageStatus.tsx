'use client';

import { cn } from '@/lib/utils';

export default function CmsImageStatus({ imageUrl }: { imageUrl?: string | null }) {
  const available = Boolean(imageUrl?.trim());
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        available ? 'bg-accent-50 text-accent-800' : 'bg-amber-50 text-amber-800'
      )}
    >
      <span aria-hidden>{available ? '✓' : '⚠'}</span>
      <span>Image: {available ? 'Available' : 'Missing'}</span>
    </span>
  );
}
