import { cn } from '@/lib/utils';
import { matchStockImage } from '@/features/cms-images/stock-catalog';

interface CmsRecordImageProps {
  src?: string | null;
  alt: string;
  fallbackTitle?: string;
  className?: string;
  aspect?: 'video' | 'square';
  width?: number;
  height?: number;
}

export default function CmsRecordImage({
  src,
  alt,
  fallbackTitle,
  className,
  aspect = 'video',
  width = 1600,
  height = 900,
}: CmsRecordImageProps) {
  const resolved = src?.trim() || (fallbackTitle ? matchStockImage(fallbackTitle).url : '');
  if (!resolved) return null;
  return (
    <div
      className={cn(
        'overflow-hidden bg-surface-warm',
        aspect === 'square' ? 'aspect-square' : 'aspect-video',
        className
      )}
    >
      {/* CMS media may be served from S3/CDN hosts not listed in next/image remotePatterns. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
