import { ASSET_EXTENSIONS, BLOCKED_PATH_PATTERNS, CRAWL_LIMITS, DISCOVERY_PATH_HINTS } from './constants';
import { classifyPage, isDiscoveryCandidate } from './classify';
import { emptyPreview, extractPage, mergePreviews } from './extract';
import { createRateLimitedGetter } from './fetcher';
import { extractLinks } from './html';
import { isPathAllowed, OPEN_ROBOTS, parseRobotsTxt, type RobotsPolicy } from './robots';
import { parseHttpUrl, UnsafeUrlError } from './ssrf';
import type { CrawlPreview, CrawlProgressEvent, HttpGet } from './types';

export type CrawlRun = {
  preview: CrawlPreview;
  pagesVisited: number;
};

export type CrawlOptions = {
  startUrl: string;
  get?: HttpGet;
  onProgress?: (event: Extract<CrawlProgressEvent, { type: 'progress' }>) => void;
  limits?: Partial<typeof CRAWL_LIMITS>;
};

function sameSite(start: URL, candidate: URL): boolean {
  const startHost = start.hostname.replace(/^www\./, '');
  const host = candidate.hostname.replace(/^www\./, '');
  return host === startHost || host.endsWith(`.${startHost}`);
}

function isBlockedPath(url: URL): boolean {
  const value = `${url.pathname}${url.search}`;
  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(value))) return true;
  const lower = url.pathname.toLowerCase();
  return ASSET_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function normalizeCrawlUrl(raw: string): string {
  const url = parseHttpUrl(raw);
  url.hash = '';
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const serialized = url.toString();
  return serialized.endsWith('/') && url.pathname === '/' ? serialized.slice(0, -1) : serialized;
}

export async function crawlHospitalSite(options: CrawlOptions): Promise<CrawlRun> {
  const start = parseHttpUrl(options.startUrl);
  const limits = { ...CRAWL_LIMITS, ...options.limits };
  const get = options.get ?? createRateLimitedGetter();
  const emit = options.onProgress;
  await emit?.({ type: 'progress', stage: 'discover', message: 'Discovering hospital pages...' });

  let robots: RobotsPolicy = OPEN_ROBOTS;
  let robotsBody = '';
  try {
    const robotsRes = await get(new URL('/robots.txt', start).toString());
    if (robotsRes.status >= 200 && robotsRes.status < 300) {
      robots = parseRobotsTxt(robotsRes.body);
      robotsBody = robotsRes.body;
    }
  } catch {
    robots = OPEN_ROBOTS;
  }

  const queue: Array<{ url: string; depth: number }> = [{ url: normalizeCrawlUrl(start.toString()), depth: 0 }];
  const seen = new Set<string>();
  let preview = emptyPreview();
  let visited = 0;

  const sitemapUrls = await collectSitemapUrls(start, get, limits, robots, robotsBody);
  for (const url of sitemapUrls) {
    queue.push({ url, depth: 1 });
  }

  while (queue.length && visited < limits.maxPages) {
    const next = queue.shift();
    if (!next) break;
    let current: URL;
    try {
      current = parseHttpUrl(next.url);
    } catch {
      continue;
    }
    if (!sameSite(start, current) || isBlockedPath(current) || isXmlOrSitemap(current)) continue;
    if (!isPathAllowed(current.pathname, robots)) continue;
    const key = normalizeCrawlUrl(current.toString());
    if (seen.has(key)) continue;
    seen.add(key);

    let page;
    try {
      page = await get(key);
    } catch (error) {
      if (error instanceof UnsafeUrlError) continue;
      continue;
    }
    if (page.status < 200 || page.status >= 400) continue;
    if (isXmlBody(page.contentType, page.body)) continue;
    visited += 1;

    const kind = classifyPage(page.finalUrl, page.body);
    await emit?.({
      type: 'progress',
      stage: kind,
      message: progressMessage(kind, visited),
    });

    preview = mergePreviews(preview, extractPage(page.finalUrl, page.body));

    if (next.depth >= limits.maxDepth) continue;
    for (const link of extractLinks(page.body, page.finalUrl)) {
      try {
        const child = parseHttpUrl(link.href);
        if (!sameSite(start, child) || isBlockedPath(child)) continue;
        if (!isPathAllowed(child.pathname, robots)) continue;
        const childKey = normalizeCrawlUrl(child.toString());
        if (seen.has(childKey)) continue;
        if (next.depth === 0 || isDiscoveryCandidate(childKey) || DISCOVERY_PATH_HINTS.some((hint) => link.text.toLowerCase().includes(hint))) {
          queue.push({ url: childKey, depth: next.depth + 1 });
        }
      } catch {
        continue;
      }
    }
  }

  await emit?.({ type: 'progress', stage: 'prepare', message: 'Preparing CMS content...' });
  return { preview, pagesVisited: visited };
}

function isXmlOrSitemap(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  return path.endsWith('.xml') || /sitemap/i.test(path);
}

function isXmlBody(contentType: string, body: string): boolean {
  const type = contentType.toLowerCase();
  if (type.includes('xml') && !type.includes('html')) return true;
  const trimmed = body.trim().slice(0, 120).toLowerCase();
  return trimmed.startsWith('<?xml') || trimmed.includes('<urlset') || trimmed.includes('<sitemapindex');
}

function sitemapFilePriority(url: string): number {
  const path = url.toLowerCase();
  if (/doctor|physician|blog|hospitals-sitemap|location-speciality/.test(path)) return -1;
  if (/specialit|department|service|package|health-check|coe|centre|center-of-excellence|main-page|faq|about/.test(path)) {
    return 100;
  }
  return 20;
}

function sitemapPriority(url: string): number {
  const path = url.toLowerCase();
  if (/doctor|physician|consultant/.test(path)) return -1;
  if (/\/(departments?|specialit|specialt|services?|packages?|health-check|faqs?|centres?-of-excellence|centers?-of-excellence|center-of-excellence|about)\/?$/.test(path)) {
    return 100;
  }
  if (/\/(departments?|specialities|specialties|speciality|specialty)\//.test(path)) return 80;
  if (DISCOVERY_PATH_HINTS.some((hint) => path.includes(hint))) return 60;
  return 10;
}

function locTags(body: string): string[] {
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim()).filter(Boolean);
}

async function collectSitemapUrls(
  start: URL,
  get: HttpGet,
  limits: { maxSitemapFiles: number; maxSitemapUrls: number },
  robots: RobotsPolicy,
  robotsBody: string
): Promise<string[]> {
  const xmlQueue: string[] = [new URL('/sitemap.xml', start).toString()];
  for (const match of robotsBody.matchAll(/^sitemap:\s*(\S+)/gim)) {
    xmlQueue.push(match[1].trim());
  }

  const seenXml = new Set<string>();
  const htmlUrls: string[] = [];
  let xmlFetched = 0;

  while (xmlQueue.length && xmlFetched < limits.maxSitemapFiles && htmlUrls.length < limits.maxSitemapUrls) {
    xmlQueue.sort((a, b) => sitemapFilePriority(b) - sitemapFilePriority(a));
    const raw = xmlQueue.shift();
    if (!raw) break;
    let xmlUrl: URL;
    try {
      xmlUrl = parseHttpUrl(raw);
    } catch {
      continue;
    }
    if (!sameSite(start, xmlUrl)) continue;
    if (/doctor|physician|blog|hospitals-sitemap|location-speciality/i.test(xmlUrl.pathname)) continue;
    const key = xmlUrl.toString();
    if (seenXml.has(key)) continue;
    seenXml.add(key);
    xmlFetched += 1;

    let page;
    try {
      page = await get(key);
    } catch {
      continue;
    }
    if (page.status < 200 || page.status >= 400) continue;
    for (const loc of locTags(page.body)) {
      let child: URL;
      try {
        child = parseHttpUrl(loc);
      } catch {
        continue;
      }
      if (!sameSite(start, child) || isBlockedPath(child)) continue;
      if (!isPathAllowed(child.pathname, robots)) continue;
      if (isXmlOrSitemap(child)) {
        if (sitemapFilePriority(child.toString()) >= 0) xmlQueue.push(child.toString());
        continue;
      }
      if (sitemapPriority(child.toString()) < 0) continue;
      htmlUrls.push(normalizeCrawlUrl(child.toString()));
    }
  }

  const unique = [...new Set(htmlUrls)];
  unique.sort((a, b) => sitemapPriority(b) - sitemapPriority(a));
  return unique.slice(0, limits.maxSitemapUrls);
}

function progressMessage(kind: string, visited: number): string {
  switch (kind) {
    case 'departments':
      return 'Extracting departments...';
    case 'services':
      return 'Extracting services...';
    case 'packages':
      return 'Extracting packages...';
    case 'faqs':
      return 'Extracting FAQs...';
    case 'specialities':
      return 'Extracting specialities...';
    case 'centres':
      return 'Extracting centres...';
    default:
      return `Reading hospital pages (${visited})...`;
  }
}
