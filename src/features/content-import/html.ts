import * as cheerio from 'cheerio';
import { NOISE_PHRASES } from './constants';

const BOILERPLATE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'nav',
  'header',
  'footer',
  'form',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.cookie',
  '.cookies',
  '#cookie',
  '.advert',
  '.ads',
  '.social',
  '.share',
  '.newsletter',
].join(', ');

export function loadHtml(html: string) {
  return cheerio.load(html);
}

export function extractTitle(html: string): string {
  const $ = loadHtml(html);
  return cleanText($('title').first().text() || $('h1').first().text());
}

export function extractMainText(html: string, maxChars = 4000): string {
  const $ = loadHtml(html);
  $(BOILERPLATE_SELECTORS).remove();
  const main = $('main, article, [role="main"], .content, #content').first();
  const raw = (main.length ? main.text() : $('body').text()) || '';
  return clip(cleanText(raw), maxChars);
}

export function extractHeadings(html: string): string[] {
  const $ = loadHtml(html);
  $(BOILERPLATE_SELECTORS).remove();
  return $('h1, h2, h3')
    .toArray()
    .map((el) => cleanText($(el).text()))
    .filter((text) => text.length >= 3 && text.length <= 120);
}

export function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const $ = loadHtml(html);
  const links: { href: string; text: string }[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const url = new URL(href, baseUrl);
      links.push({ href: url.toString(), text: cleanText($(el).text()) });
    } catch {
      // skip invalid
    }
  });
  return links;
}

export function extractJsonLd(html: string): unknown[] {
  const $ = loadHtml(html);
  const blocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      // ignore invalid JSON-LD
    }
  });
  return blocks;
}

export function cleanText(value: string): string {
  let text = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  for (const phrase of NOISE_PHRASES) {
    const re = new RegExp(`\\b${phrase}\\b`, 'ig');
    text = text.replace(re, ' ');
  }
  return text.replace(/\s+/g, ' ').trim();
}

export function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

export function looksLikeBoilerplate(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('cookie') ||
    lower.includes('subscribe to our newsletter') ||
    lower.startsWith('home >') ||
    lower.startsWith('you are here')
  );
}
