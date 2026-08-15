import { CRAWL_LIMITS } from './constants';
import { assertSafeFetchUrl, parseHttpUrl, UnsafeUrlError } from './ssrf';
import type { FetchResult, HttpGet } from './types';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHtmlOrText(contentType: string): boolean {
  const type = contentType.toLowerCase();
  return (
    type.includes('text/html') ||
    type.includes('application/xhtml') ||
    type.includes('text/plain') ||
    type.includes('text/xml') ||
    type.includes('application/xml') ||
    type.includes('application/rss') ||
    type.includes('application/json') ||
    type === ''
  );
}

async function readLimitedBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return await response.text();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      if (received > CRAWL_LIMITS.maxResponseBytes) {
        await reader.cancel();
        throw new UnsafeUrlError('The page is larger than the crawl size limit.');
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(merged);
}

export async function fetchPublicUrl(rawUrl: string, redirectCount = 0): Promise<FetchResult> {
  if (redirectCount > CRAWL_LIMITS.maxRedirects) {
    throw new UnsafeUrlError('Too many redirects.');
  }
  const url = await assertSafeFetchUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CRAWL_LIMITS.requestTimeoutMs);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'HospitalCMSImporter/1.0 (+https://carepulse.local)',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new UnsafeUrlError('Redirect was missing a Location header.');
      }
      const next = new URL(location, url);
      parseHttpUrl(next.toString());
      return fetchPublicUrl(next.toString(), redirectCount + 1);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!isHtmlOrText(contentType)) {
      throw new UnsafeUrlError('The response is not HTML or text content.');
    }
    const body = await readLimitedBody(response);
    return {
      finalUrl: url.toString(),
      status: response.status,
      contentType,
      body,
    };
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new UnsafeUrlError('The website did not respond in time.');
    }
    throw new UnsafeUrlError('The website could not be fetched.');
  } finally {
    clearTimeout(timer);
  }
}

export function createRateLimitedGetter(get: HttpGet = fetchPublicUrl): HttpGet {
  let lastAt = 0;
  return async (url: string) => {
    const wait = CRAWL_LIMITS.minRequestGapMs - (Date.now() - lastAt);
    if (wait > 0) await sleep(wait);
    let attempt = 0;
    while (true) {
      try {
        const result = await get(url);
        lastAt = Date.now();
        return result;
      } catch (error) {
        attempt += 1;
        if (attempt > CRAWL_LIMITS.maxRetries) throw error;
        await sleep(400 * attempt);
      }
    }
  };
}
