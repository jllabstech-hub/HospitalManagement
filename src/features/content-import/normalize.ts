import { slugify } from '@/lib/slug';
import { NAME_ALIASES } from './constants';
import { cleanText } from './html';
import type { PreviewItem } from './types';

export function stripDepartmentPrefix(name: string): string {
  return cleanText(name)
    .replace(/^(department of|dept\.? of|the)\s+/i, '')
    .replace(/\s+(department|dept\.?)$/i, '')
    .trim();
}

export function canonicalName(raw: string): string {
  const stripped = stripDepartmentPrefix(raw);
  const key = stripped.toLowerCase().replace(/[^a-z0-9&+\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return NAME_ALIASES[key] || titleCase(stripped);
}

export function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => {
    if (word.length <= 3 && word === word.toUpperCase()) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function itemSlug(name: string, fallback: string): string {
  return slugify(name) || fallback;
}

export function faqKey(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenSet(value: string): Set<string> {
  return new Set(faqKey(value).split(' ').filter((token) => token.length > 2));
}

export function jaccard(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / new Set([...left, ...right]).size;
}

export function dedupeItems(items: PreviewItem[], similarity = 0.92): PreviewItem[] {
  const unique: PreviewItem[] = [];
  for (const item of items) {
    const name = canonicalName(item.name);
    const slug = itemSlug(name, 'item');
    const duplicate = unique.find((existing) => {
      if (itemSlug(existing.name, 'item') === slug) return true;
      return jaccard(existing.name, name) >= similarity;
    });
    if (duplicate) {
      if ((item.description?.length || 0) > (duplicate.description?.length || 0)) {
        duplicate.description = item.description;
      }
      continue;
    }
    unique.push({ ...item, name, slug });
  }
  return unique;
}

export function dedupeFaqs(items: PreviewItem[]): PreviewItem[] {
  const unique: PreviewItem[] = [];
  for (const item of items) {
    const question = cleanText(item.question || item.name);
    const answer = cleanText(item.answer || item.description || '');
    if (question.length < 8 || answer.length < 8) continue;
    const duplicate = unique.find((existing) => {
      const existingQ = existing.question || existing.name;
      return faqKey(existingQ) === faqKey(question) || jaccard(existingQ, question) >= 0.86;
    });
    if (duplicate) continue;
    unique.push({
      name: question,
      question,
      answer,
      description: answer,
      category: item.category,
    });
  }
  return unique;
}

export function parsePrice(raw?: string | null): string | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, '').match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value.toFixed(2);
}
