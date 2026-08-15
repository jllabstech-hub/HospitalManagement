import { NextResponse } from 'next/server';
import { globalPublicSearch } from '@/features/cms/queries/search';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({
      doctors: [],
      departments: [],
      specialities: [],
      services: [],
      articles: [],
      news: [],
    });
  }

  try {
    const results = await globalPublicSearch(q);
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        Vary: 'Host',
      },
    });
  } catch {
    logger.error({ event: 'search.failed' }, 'Failed to perform search');
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
