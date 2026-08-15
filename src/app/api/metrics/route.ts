import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';

export async function GET(request: Request) {
  try {
    const expectedToken = process.env.METRICS_TOKEN;

    if (process.env.NODE_ENV === 'production' && !expectedToken) {
      return NextResponse.json(
        { error: 'Metrics endpoint is not configured.' },
        { status: 503 }
      );
    }

    if (!expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await prisma.$metrics.prometheus();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
