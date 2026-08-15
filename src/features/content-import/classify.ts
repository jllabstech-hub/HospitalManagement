import { DISCOVERY_PATH_HINTS } from './constants';
import { extractHeadings, extractJsonLd, extractTitle } from './html';

export type PageKind =
  | 'home'
  | 'about'
  | 'departments'
  | 'specialities'
  | 'centres'
  | 'services'
  | 'packages'
  | 'faqs'
  | 'facilities'
  | 'patientResources'
  | 'insurance'
  | 'international'
  | 'articles'
  | 'news'
  | 'testimonials'
  | 'contact'
  | 'doctors'
  | 'other';

const KIND_HINTS: Array<{ kind: PageKind; patterns: RegExp[] }> = [
  { kind: 'doctors', patterns: [/doctor/, /physician/, /consultant/, /find-a-doctor/] },
  { kind: 'faqs', patterns: [/faq/, /frequently-asked/] },
  { kind: 'packages', patterns: [/package/, /health-check/, /healthcheck/, /wellness/] },
  { kind: 'centres', patterns: [/centre-of-excellence/, /center-of-excellence/, /centres-of-excellence/, /centers-of-excellence/] },
  { kind: 'departments', patterns: [/department/] },
  { kind: 'specialities', patterns: [/specialit/, /specialty/] },
  { kind: 'services', patterns: [/service/] },
  { kind: 'facilities', patterns: [/facilit/] },
  { kind: 'patientResources', patterns: [/patient-resource/, /patient-care/, /visiting/, /visitor/, /admission/] },
  { kind: 'insurance', patterns: [/insurance/, /tpa/, /cashless/] },
  { kind: 'international', patterns: [/international/] },
  { kind: 'news', patterns: [/\/news/, /press-release/, /media/] },
  { kind: 'articles', patterns: [/health-library/, /article/, /blog/, /health-info/] },
  { kind: 'testimonials', patterns: [/testimonial/, /patient-stor/] },
  { kind: 'about', patterns: [/about/, /overview/, /who-we-are/] },
  { kind: 'contact', patterns: [/contact/, /emergency/, /location/] },
];

const DOCTOR_PATH = /\/(doctors?|physicians?|consultants?|our-doctors|find-a-doctor)(\/|$)/i;

export function classifyPage(url: string, html: string): PageKind {
  const parsed = safeUrl(url);
  const path = parsed?.pathname || '';
  if (DOCTOR_PATH.test(path)) return 'doctors';

  const haystack = `${path} ${extractTitle(html)} ${extractHeadings(html).slice(0, 6).join(' ')}`.toLowerCase();

  for (const { kind, patterns } of KIND_HINTS) {
    if (kind === 'doctors') continue;
    if (patterns.some((pattern) => pattern.test(haystack))) {
      return kind;
    }
  }

  const jsonLd = extractJsonLd(html);
  if (jsonLd.some((block) => jsonLdType(block).includes('FAQPage'))) return 'faqs';
  if (jsonLd.some((block) => jsonLdType(block).includes('Hospital') || jsonLdType(block).includes('MedicalOrganization'))) {
    return parsed?.pathname === '/' ? 'home' : 'about';
  }
  if (parsed?.pathname === '/' || parsed?.pathname === '') return 'home';
  return 'other';
}

export function isDiscoveryCandidate(url: string): boolean {
  const parsed = safeUrl(url);
  if (!parsed) return false;
  const path = parsed.pathname.toLowerCase();
  return DISCOVERY_PATH_HINTS.some((hint) => path.includes(hint));
}

function jsonLdType(block: unknown): string {
  if (!block || typeof block !== 'object') return '';
  const type = (block as { '@type'?: unknown })['@type'];
  if (typeof type === 'string') return type;
  if (Array.isArray(type)) return type.join(' ');
  return '';
}

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}
