import { CRAWL_LIMITS } from './constants';
import { classifyPage, type PageKind } from './classify';
import {
  clip,
  extractHeadings,
  extractJsonLd,
  extractMainText,
  extractTitle,
  loadHtml,
  looksLikeBoilerplate,
} from './html';
import { canonicalName, dedupeFaqs, dedupeItems, parsePrice } from './normalize';
import { looksLikeForeignHospitalCopy } from '@/features/cms/foreign-hospital-copy';
import type { CrawlPreview, HospitalProfileDraft, InternationalDraft, PreviewItem } from './types';

export function emptyPreview(): CrawlPreview {
  return {
    departments: [],
    specialities: [],
    centres: [],
    services: [],
    packages: [],
    faqs: [],
    facilities: [],
    patientResources: [],
    insurance: [],
    articles: [],
    news: [],
    testimonials: [],
    hospitalProfile: null,
    international: null,
  };
}

export function mergePreviews(into: CrawlPreview, from: CrawlPreview): CrawlPreview {
  return {
    departments: dedupeItems([...into.departments, ...from.departments]),
    specialities: dedupeItems([...into.specialities, ...from.specialities]),
    centres: dedupeItems([...into.centres, ...from.centres]),
    services: dedupeItems([...into.services, ...from.services]),
    packages: dedupeItems([...into.packages, ...from.packages]),
    faqs: dedupeFaqs([...into.faqs, ...from.faqs]),
    facilities: dedupeItems([...into.facilities, ...from.facilities]),
    patientResources: dedupeItems([...into.patientResources, ...from.patientResources]),
    insurance: dedupeItems([...into.insurance, ...from.insurance]),
    articles: dedupeItems([...into.articles, ...from.articles], 0.9),
    news: dedupeItems([...into.news, ...from.news], 0.9),
    testimonials: [...into.testimonials, ...from.testimonials].slice(0, CRAWL_LIMITS.maxItemsPerCategory),
    hospitalProfile: into.hospitalProfile || from.hospitalProfile,
    international: mergeInternational(into.international, from.international),
  };
}

export function extractPage(url: string, html: string): CrawlPreview {
  const kind = classifyPage(url, html);
  const preview = emptyPreview();
  if (kind === 'doctors') return preview;

  const faqs = extractFaqs(html);
  if (faqs.length) preview.faqs = faqs;

  const listItems = extractNamedCards(html, url, kind);
  if (isCatalogLeaf(url, kind)) {
    assignList(preview, kind, extractLeafItem(html, kind));
  } else {
    assignList(preview, kind, listItems);
  }

  if (kind === 'packages') {
    const packageSeed = isCatalogLeaf(url, kind) ? extractLeafItem(html, kind) : listItems;
    preview.packages = extractPackages(html, packageSeed);
  }

  if (kind === 'about' || kind === 'home' || kind === 'contact') {
    preview.hospitalProfile = extractHospitalProfile(html, url);
  }
  if (kind === 'international') {
    preview.international = {
      title: 'International Patients',
      introduction: extractMainText(html, 2500),
    };
  }
  if (kind === 'articles' || kind === 'news') {
    const article = extractArticle(html);
    if (article) {
      if (kind === 'news') preview.news = [article];
      else preview.articles = [article];
    }
  }
  if (kind === 'testimonials') {
    preview.testimonials = extractTestimonials(html);
  }

  return capPreview(preview);
}

const CATALOG_KINDS = new Set<PageKind>([
  'departments',
  'specialities',
  'centres',
  'services',
  'packages',
  'facilities',
  'patientResources',
  'insurance',
]);

function isCatalogLeaf(url: string, kind: PageKind): boolean {
  if (!CATALOG_KINDS.has(kind)) return false;
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

function extractLeafItem(html: string, kind: PageKind): PreviewItem[] {
  const $ = loadHtml(html);
  const heading = canonicalName($('h1').first().text() || extractTitle(html));
  if (!isLikelyItemName(heading, kind)) return [];
  const description = clip(extractMainText(html, 1200), 800);
  if (looksLikeForeignHospitalCopy(heading, description)) return [];
  return [{ name: heading, description: description || undefined, price: parsePrice(description) }];
}

function assignList(preview: CrawlPreview, kind: PageKind, items: PreviewItem[]) {
  const limited = items.slice(0, CRAWL_LIMITS.maxItemsPerCategory);
  switch (kind) {
    case 'departments':
      preview.departments = limited;
      break;
    case 'specialities':
      preview.specialities = limited;
      break;
    case 'centres':
      preview.centres = limited;
      break;
    case 'services':
      preview.services = limited;
      break;
    case 'facilities':
      preview.facilities = limited;
      break;
    case 'patientResources':
      preview.patientResources = limited;
      break;
    case 'insurance':
      preview.insurance = limited;
      break;
    case 'packages':
      preview.packages = limited;
      break;
    default:
      break;
  }
}

function extractNamedCards(html: string, pageUrl: string, kind: PageKind): PreviewItem[] {
  const $ = loadHtml(html);
  $('nav, header, footer, script, style').remove();
  const items: PreviewItem[] = [];

  $('a, h2, h3, li, .card, article').each((_, el) => {
    const text = canonicalName($(el).text());
    if (!isLikelyItemName(text, kind)) return;
    const href = $(el).is('a') ? $(el).attr('href') : $(el).find('a').attr('href');
    let description = '';
    const sibling = $(el).parent().find('p').first().text();
    if (sibling && sibling.length > 40) description = sibling;
    items.push({
      name: text,
      description: clip(description, 800) || undefined,
    });
    void href;
    void pageUrl;
  });

  if (items.length < 3) {
    for (const heading of extractHeadings(html)) {
      if (isLikelyItemName(heading, kind)) {
        items.push({ name: canonicalName(heading) });
      }
    }
  }

  return dedupeItems(items);
}

function isLikelyItemName(text: string, kind: PageKind): boolean {
  if (text.length < 3 || text.length > 80) return false;
  if (looksLikeBoilerplate(text)) return false;
  if (looksLikeForeignHospitalCopy(text)) return false;
  if (/^(home|about|contact|login|book appointment|read more)$/i.test(text)) return false;
  if (/^(departments?|specialit(?:y|ies)|specialt(?:y|ies)|services?|centres?|centers?|packages?|faqs?|facilities|patient resources)$/i.test(text)) {
    return false;
  }
  if (/all-inclusive|trusted care|compassion backed|centre of excellence|center of excellence/i.test(text)) return false;
  if (/\bdr\.?\b/i.test(text) || /^dr\s/i.test(text)) return false;
  if (kind === 'packages') return /package|check|screening|wellness|health/i.test(text);
  if (kind === 'faqs') return false;
  return /[a-z]/i.test(text);
}

export function extractFaqs(html: string): PreviewItem[] {
  const items: PreviewItem[] = [];
  const $ = loadHtml(html);

  for (const block of extractJsonLd(html)) {
    items.push(...faqsFromJsonLd(block));
  }

  $('details').each((_, el) => {
    const question = $(el).find('summary').text();
    const answer = $(el).clone().children('summary').remove().end().text();
    items.push({ name: question, question, answer, description: answer });
  });

  $('dt').each((_, el) => {
    const question = $(el).text();
    const answer = $(el).next('dd').text();
    items.push({ name: question, question, answer, description: answer });
  });

  $('h2, h3, h4').each((_, el) => {
    const question = $(el).text().trim();
    if (!/\?$/.test(question) && !/^how |^what |^when |^where |^why |^can |^do /i.test(question)) {
      return;
    }
    const answer = $(el).nextAll('p').first().text();
    items.push({ name: question, question, answer, description: answer });
  });

  return dedupeFaqs(items).slice(0, CRAWL_LIMITS.maxItemsPerCategory);
}

function faqsFromJsonLd(block: unknown): PreviewItem[] {
  if (!block || typeof block !== 'object') return [];
  const node = block as Record<string, unknown>;
  const type = String(node['@type'] || '');
  const items: PreviewItem[] = [];
  const entities = type.includes('FAQPage') ? node.mainEntity : node['@graph'] || node.mainEntity;
  const list = Array.isArray(entities) ? entities : entities ? [entities] : [];
  for (const entity of list) {
    if (!entity || typeof entity !== 'object') continue;
    const questionNode = entity as Record<string, unknown>;
    const question = String(questionNode.name || questionNode.question || '');
    const accepted = questionNode.acceptedAnswer;
    const answer =
      accepted && typeof accepted === 'object'
        ? String((accepted as { text?: string }).text || '')
        : String(questionNode.answer || '');
    if (question && answer) {
      items.push({ name: question, question, answer, description: answer });
    }
  }
  return items;
}

function extractPackages(html: string, fallback: PreviewItem[]): PreviewItem[] {
  if (fallback.length) {
    return fallback.map((item) => ({
      ...item,
      price: parsePrice(item.description),
    }));
  }
  const text = extractMainText(html, 3000);
  const blocks = text.split(/\n|(?=\b(?:package|health check))/i);
  const items: PreviewItem[] = [];
  for (const block of blocks) {
    const nameMatch = block.match(/([A-Z][A-Za-z& ]{6,60}(?:Package|Check|Screening|Wellness))/);
    if (!nameMatch) continue;
    items.push({
      name: nameMatch[1],
      description: clip(block, 800),
      price: parsePrice(block),
    });
  }
  return dedupeItems(items);
}

function extractArticle(html: string): PreviewItem | null {
  const title = extractTitle(html);
  const content = extractMainText(html, CRAWL_LIMITS.maxArticleChars);
  if (title.length < 8 || content.length < 80) return null;
  if (/\bdr\.?\b/i.test(title)) return null;
  return {
    name: title,
    excerpt: clip(content, 240),
    content,
    description: clip(content, 800),
  };
}

function extractTestimonials(html: string): PreviewItem[] {
  const $ = loadHtml(html);
  $('nav, header, footer, script, style').remove();
  const items: PreviewItem[] = [];
  $('blockquote, .testimonial, [itemprop="review"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length < 40) return;
    items.push({
      name: 'Patient',
      description: clip(text, 600),
    });
  });
  return items.slice(0, 15);
}

function extractHospitalProfile(html: string, url: string): HospitalProfileDraft {
  const jsonLd = extractJsonLd(html);
  const org = jsonLd.find((block) => {
    const type = String((block as { '@type'?: string })?.['@type'] || '');
    return /Hospital|MedicalOrganization|Organization/i.test(type);
  }) as Record<string, unknown> | undefined;

  const telephone = typeof org?.telephone === 'string' ? org.telephone : undefined;
  const email = typeof org?.email === 'string' ? org.email : undefined;
  const name = typeof org?.name === 'string' ? org.name : extractTitle(html);
  const description = typeof org?.description === 'string' ? org.description : extractMainText(html, 1500);
  const address = org?.address as Record<string, unknown> | undefined;

  void url;
  if (looksLikeForeignHospitalCopy(name, description)) {
    return {};
  }
  return {
    hospitalName: name?.replace(/\s*\|\s*.*$/, '').trim(),
    shortDescription: clip(description || '', 280) || undefined,
    fullDescription: description || undefined,
    phone: telephone,
    email,
    addressLine1: typeof address?.streetAddress === 'string' ? address.streetAddress : undefined,
    city: typeof address?.addressLocality === 'string' ? address.addressLocality : undefined,
    state: typeof address?.addressRegion === 'string' ? address.addressRegion : undefined,
  };
}

function mergeInternational(
  a: InternationalDraft | null,
  b: InternationalDraft | null
): InternationalDraft | null {
  if (!a) return b;
  if (!b) return a;
  return {
    title: a.title || b.title,
    introduction: longer(a.introduction, b.introduction),
    howToRequest: longer(a.howToRequest, b.howToRequest),
    secondOpinion: longer(a.secondOpinion, b.secondOpinion),
    requiredDocuments: longer(a.requiredDocuments, b.requiredDocuments),
    travelInformation: longer(a.travelInformation, b.travelInformation),
    accommodationInfo: longer(a.accommodationInfo, b.accommodationInfo),
  };
}

function longer(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a.length >= b.length ? a : b;
}

function capPreview(preview: CrawlPreview): CrawlPreview {
  const limit = CRAWL_LIMITS.maxItemsPerCategory;
  const keep = (items: PreviewItem[]) =>
    items
      .filter((item) => !looksLikeForeignHospitalCopy(item.name, item.description, item.question, item.answer, item.content, item.excerpt))
      .slice(0, limit);
  return {
    ...preview,
    departments: keep(preview.departments),
    specialities: keep(preview.specialities),
    centres: keep(preview.centres),
    services: keep(preview.services),
    packages: keep(preview.packages),
    faqs: keep(preview.faqs),
    facilities: keep(preview.facilities),
    patientResources: keep(preview.patientResources),
    insurance: keep(preview.insurance),
    articles: keep(preview.articles).slice(0, 20),
    news: keep(preview.news).slice(0, 20),
    testimonials: keep(preview.testimonials).slice(0, 15),
    hospitalProfile:
      preview.hospitalProfile &&
      looksLikeForeignHospitalCopy(
        preview.hospitalProfile.hospitalName,
        preview.hospitalProfile.shortDescription,
        preview.hospitalProfile.fullDescription
      )
        ? null
        : preview.hospitalProfile,
  };
}
