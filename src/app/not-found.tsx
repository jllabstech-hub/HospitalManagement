import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: 'Page not found',
  description: `The requested page could not be found on ${APP_CONFIG.appName}.`,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-warm">
      <div className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow text-brand-700">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-base text-ink-muted">
          The page you requested is unavailable, may have moved, or the link may be incorrect.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">
            Back to homepage
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact us
          </Link>
          <Link href="/book-appointment" className="btn-ghost">
            Book appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
