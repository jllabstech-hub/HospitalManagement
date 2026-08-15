import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/security/auth-helpers';
import { crawlHospitalSite } from '@/features/content-import/crawler';
import { parseHttpUrl, UnsafeUrlError } from '@/features/content-import/ssrf';
import { DomainError } from '@/server/errors/domain-error';
import type { CrawlProgressEvent } from '@/features/content-import/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { url?: string };
    parseHttpUrl(body.url || '');

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: CrawlProgressEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };
        try {
          const { preview, pagesVisited } = await crawlHospitalSite({
            startUrl: body.url!,
            onProgress: async (event) => send(event),
          });
          send({ type: 'complete', preview, pagesVisited });
          controller.close();
        } catch (error) {
          const message =
            error instanceof UnsafeUrlError ? error.message : 'The website could not be crawled.';
          send({ type: 'error', error: message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }
    return NextResponse.json({ error: 'Unable to start crawl.' }, { status: 500 });
  }
}
