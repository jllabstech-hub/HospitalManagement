/**
 * Provider-neutral analytics hook. Wire to GA4 / Plausible / etc. in production.
 */
export function trackEvent(name: string, payload?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, payload ?? {});
  }
}
