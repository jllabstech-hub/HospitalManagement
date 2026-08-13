'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Something went wrong
        </h2>
        <p className="text-gray-600">
          We&apos;ve encountered an unexpected error. Our engineering team has been
          notified and is looking into it.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Refresh Page
          </button>
          <button
            onClick={() => reset()}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Try Again
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-md bg-red-50 p-4 text-left">
            <h3 className="text-sm font-medium text-red-800">Error Details (Dev Only)</h3>
            <pre className="mt-2 text-xs text-red-700 overflow-auto whitespace-pre-wrap">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
