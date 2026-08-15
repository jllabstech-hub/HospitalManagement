import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateProductionConfig } = await import('@/server/config/config-validation');
    const { assertDatabaseIsolation } = await import('@/server/db/database-guard');
    const { assertProductionAuthSecret } = await import('@/server/security/auth-secret');
    const { processNotificationOutbox } = await import('@/server/notifications/worker');
    const { logger } = await import('@/lib/logger');

    validateProductionConfig();
    assertDatabaseIsolation();
    assertProductionAuthSecret();
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      tracesSampleRate: 1,
      debug: false,
    });

    const pollMs = Number(process.env.NOTIFICATION_WORKER_POLL_MS || 0);
    if (pollMs >= 10_000 && process.env.NODE_ENV !== 'test') {
      setInterval(() => {
        processNotificationOutbox().catch((error: unknown) => {
          logger.error(
            { event: 'notification.worker_poll_failed', error: error instanceof Error ? error.message : 'unknown' },
            'Notification worker poll failed'
          );
        });
      }, pollMs);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      tracesSampleRate: 1,
      debug: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
