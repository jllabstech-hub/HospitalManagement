import { NextResponse } from 'next/server';
import { globalPublicSearch } from '@/features/cms/queries/search';

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
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in search API route:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
