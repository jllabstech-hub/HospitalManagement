import type { Metadata } from 'next';
import { APP_CONFIG } from '@/config';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://carepulse.hospital';

export function getSiteUrl() {
  return SITE_URL;
}

/** Build Metadata with absolute OG/canonical when a path is known. */
export function publicPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = `${SITE_URL}${opts.path.startsWith('/') ? opts.path : `/${opts.path}`}`;
  const title = opts.absoluteTitle
    ? { absolute: opts.title }
    : opts.title;

  return {
    title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: typeof title === 'string' ? title : opts.title,
      description: opts.description,
      url,
      siteName: APP_CONFIG.appName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: typeof title === 'string' ? title : opts.title,
      description: opts.description,
    },
  };
}
