export const IMPORT_CATEGORIES = [
  'hospitalProfile',
  'departments',
  'specialities',
  'centres',
  'services',
  'packages',
  'faqs',
  'facilities',
  'patientResources',
  'insurance',
  'international',
  'articles',
  'news',
  'testimonials',
] as const;

export type ImportCategory = (typeof IMPORT_CATEGORIES)[number];

export type PreviewItem = {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  duration?: string;
  eligibility?: string;
  includedItems?: string;
  price?: string | null;
  content?: string;
  excerpt?: string;
  question?: string;
  answer?: string;
};

export type HospitalProfileDraft = {
  hospitalName?: string;
  shortDescription?: string;
  fullDescription?: string;
  tagline?: string;
  phone?: string;
  emergencyPhone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  workingHours?: string;
  mission?: string;
  vision?: string;
};

export type InternationalDraft = {
  title?: string;
  introduction?: string;
  howToRequest?: string;
  secondOpinion?: string;
  requiredDocuments?: string;
  travelInformation?: string;
  accommodationInfo?: string;
};

export type CrawlPreview = {
  departments: PreviewItem[];
  specialities: PreviewItem[];
  centres: PreviewItem[];
  services: PreviewItem[];
  packages: PreviewItem[];
  faqs: PreviewItem[];
  facilities: PreviewItem[];
  patientResources: PreviewItem[];
  insurance: PreviewItem[];
  articles: PreviewItem[];
  news: PreviewItem[];
  testimonials: PreviewItem[];
  hospitalProfile: HospitalProfileDraft | null;
  international: InternationalDraft | null;
};

export type CrawlProgressEvent =
  | { type: 'progress'; stage: string; message: string }
  | { type: 'complete'; preview: CrawlPreview; pagesVisited: number }
  | { type: 'error'; error: string };

export type ImportCounts = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};

export type ImportResult = {
  byCategory: Record<string, ImportCounts>;
  totals: ImportCounts;
};

export type FetchResult = {
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
};

export type HttpGet = (url: string) => Promise<FetchResult>;
