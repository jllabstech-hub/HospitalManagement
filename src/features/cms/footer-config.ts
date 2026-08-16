import { APP_CONFIG } from '@/config';
import { safeInternalPath } from '@/server/security/dashboard-paths';

export type FooterNavLink = {
  href: string;
  label: string;
};

export type FooterNavColumn = {
  title: string;
  links: FooterNavLink[];
};

export type FooterConfig = {
  columns: FooterNavColumn[];
  legalLinks: FooterNavLink[];
  loginLabel: string;
  showLogin: boolean;
};

const MAX_COLUMNS = 4;
const MAX_LINKS_PER_COLUMN = 8;
const MAX_LEGAL_LINKS = 6;
const MAX_LABEL = 80;
const MAX_TITLE = 40;

function stripLabel(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function hrefKey(href: string): string {
  return href.replace(/\/+$/, '') || '/';
}

function sanitizeLink(raw: unknown): FooterNavLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const label = stripLabel(record.label, MAX_LABEL);
  const href = safeInternalPath(typeof record.href === 'string' ? record.href : null);
  if (!label || !href) return null;
  return { href, label };
}

export function defaultFooterConfig(hospitalName?: string | null): FooterConfig {
  const name = hospitalName?.trim() || APP_CONFIG.shortName;
  return {
    columns: [
      {
        title: 'Hospital',
        links: [
          { href: '/about/overview', label: `About ${name}` },
          { href: '/centres-of-excellence', label: 'Centres of Excellence' },
          { href: '/locations', label: 'Locations' },
          { href: '/contact', label: 'Contact' },
        ],
      },
      {
        title: 'Care',
        links: [
          { href: '/departments', label: 'Departments' },
          { href: '/specialities', label: 'Specialities' },
          { href: '/doctors', label: 'Find a Doctor' },
          { href: '/services', label: 'Services' },
        ],
      },
      {
        title: 'Patient Services',
        links: [
          { href: '/book-appointment', label: 'Book Appointment' },
          { href: '/patient-resources', label: 'Patient Resources' },
          { href: '/health-packages', label: 'Health Packages' },
          { href: '/login', label: 'Patient Portal' },
        ],
      },
    ],
    legalLinks: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/patient-resources', label: 'Accessibility' },
    ],
    loginLabel: 'Login',
    showLogin: false,
  };
}

export function dedupeFooterColumns(columns: FooterNavColumn[]): FooterNavColumn[] {
  const merged = new Map<string, FooterNavColumn>();
  for (const column of columns) {
    const key = column.title.toLowerCase();
    const prev = merged.get(key);
    merged.set(key, {
      title: prev?.title ?? column.title,
      links: [...(prev?.links ?? []), ...column.links],
    });
  }

  const seenHref = new Set<string>();
  const result: FooterNavColumn[] = [];
  for (const column of merged.values()) {
    const links: FooterNavLink[] = [];
    for (const link of column.links) {
      const key = hrefKey(link.href);
      if (seenHref.has(key)) continue;
      seenHref.add(key);
      links.push(link);
    }
    if (links.length > 0) {
      result.push({ title: column.title, links });
    }
  }
  return result;
}

export function footerHasLoginLink(columns: FooterNavColumn[]): boolean {
  return columns.some((column) => column.links.some((link) => hrefKey(link.href) === '/login'));
}

export function parseFooterConfig(raw: unknown, hospitalName?: string | null): FooterConfig {
  const fallback = defaultFooterConfig(hospitalName);
  if (!raw || typeof raw !== 'object') return fallback;

  const record = raw as Record<string, unknown>;
  const columnsSource = Array.isArray(record.columns) ? record.columns : [];
  const columns: FooterNavColumn[] = [];

  for (const column of columnsSource.slice(0, MAX_COLUMNS)) {
    if (!column || typeof column !== 'object') continue;
    const col = column as Record<string, unknown>;
    const title = stripLabel(col.title, MAX_TITLE);
    const linksSource = Array.isArray(col.links) ? col.links : [];
    const links = linksSource
      .slice(0, MAX_LINKS_PER_COLUMN)
      .map(sanitizeLink)
      .filter((link): link is FooterNavLink => Boolean(link));
    if (!title || links.length === 0) continue;
    columns.push({ title, links });
  }

  const legalSource = Array.isArray(record.legalLinks) ? record.legalLinks : [];
  const seenLegal = new Set<string>();
  const legalLinks = legalSource
    .slice(0, MAX_LEGAL_LINKS)
    .map(sanitizeLink)
    .filter((link): link is FooterNavLink => Boolean(link))
    .filter((link) => {
      const key = hrefKey(link.href);
      if (seenLegal.has(key)) return false;
      seenLegal.add(key);
      return true;
    });

  const loginLabel = stripLabel(record.loginLabel, MAX_LABEL) || fallback.loginLabel;
  const parsedColumns = dedupeFooterColumns(columns);

  return {
    columns: parsedColumns.length > 0 ? parsedColumns : fallback.columns,
    legalLinks: legalLinks.length > 0 ? legalLinks : fallback.legalLinks,
    loginLabel,
    showLogin: record.showLogin === true,
  };
}
