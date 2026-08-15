import { NextResponse } from 'next/server';
import { processNotificationOutbox } from '@/server/notifications/worker';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET || process.env.METRICS_TOKEN;
  if (process.env.NODE_ENV === 'production' && !cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET or METRICS_TOKEN is required in production.' },
      { status: 503 }
    );
  }

  if (!cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
  }

  try {
    const result = await processNotificationOutbox(50);
    logger.info({ event: 'cron.notifications_processed', processed: result.processed, sent: result.sent, failed: result.failed }, 'Processed notification outbox batch');
    return NextResponse.json({ success: true, ...result });
  } catch {
    logger.error({ event: 'cron.notifications_failed' }, 'Failed to process notification outbox cron');
    return NextResponse.json({ error: 'Cron execution failed.' }, { status: 500 });
  }
}
