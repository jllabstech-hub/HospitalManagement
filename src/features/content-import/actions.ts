'use server';

import { z } from 'zod';
import { requireAdmin } from '@/server/security/auth-helpers';
import { crawlHospitalSite } from './crawler';
import { IMPORT_CATEGORIES, type ImportCategory } from './types';
import { importPreviewToCms } from './upsert';
import { parseHttpUrl, UnsafeUrlError } from './ssrf';
import type { CrawlPreview, ImportResult } from './types';

const PreviewItemSchema = z.object({
  name: z.string().trim().min(1).max(180),
  slug: z.string().trim().max(180).optional(),
  description: z.string().trim().max(8000).optional(),
  category: z.string().trim().max(120).optional(),
  duration: z.string().trim().max(120).optional(),
  eligibility: z.string().trim().max(1000).optional(),
  includedItems: z.string().trim().max(4000).optional(),
  price: z.string().trim().max(20).nullable().optional(),
  content: z.string().trim().max(12000).optional(),
  excerpt: z.string().trim().max(500).optional(),
  question: z.string().trim().max(400).optional(),
  answer: z.string().trim().max(4000).optional(),
});

const PreviewSchema = z.object({
  departments: z.array(PreviewItemSchema).max(80),
  specialities: z.array(PreviewItemSchema).max(80),
  centres: z.array(PreviewItemSchema).max(80),
  services: z.array(PreviewItemSchema).max(80),
  packages: z.array(PreviewItemSchema).max(80),
  faqs: z.array(PreviewItemSchema).max(80),
  facilities: z.array(PreviewItemSchema).max(80),
  patientResources: z.array(PreviewItemSchema).max(80),
  insurance: z.array(PreviewItemSchema).max(80),
  articles: z.array(PreviewItemSchema).max(20),
  news: z.array(PreviewItemSchema).max(20),
  testimonials: z.array(PreviewItemSchema).max(15),
  hospitalProfile: z
    .object({
      hospitalName: z.string().optional(),
      shortDescription: z.string().optional(),
      fullDescription: z.string().optional(),
      tagline: z.string().optional(),
      phone: z.string().optional(),
      emergencyPhone: z.string().optional(),
      email: z.string().optional(),
      addressLine1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      workingHours: z.string().optional(),
      mission: z.string().optional(),
      vision: z.string().optional(),
    })
    .nullable(),
  international: z
    .object({
      title: z.string().optional(),
      introduction: z.string().optional(),
      howToRequest: z.string().optional(),
      secondOpinion: z.string().optional(),
      requiredDocuments: z.string().optional(),
      travelInformation: z.string().optional(),
      accommodationInfo: z.string().optional(),
    })
    .nullable(),
});

export async function crawlWebsiteAction(
  rawUrl: string
): Promise<{ success: true; preview: CrawlPreview; pagesVisited?: number } | { success: false; error: string }> {
  try {
    const admin = await requireAdmin();
    void admin;
    parseHttpUrl(rawUrl);
    const { preview, pagesVisited } = await crawlHospitalSite({ startUrl: rawUrl });
    return { success: true, preview, pagesVisited };
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'The website could not be crawled. Check the URL and try again.' };
  }
}

export async function importExtractedContentAction(input: {
  preview: CrawlPreview;
  categories: ImportCategory[];
}): Promise<{ success: true; result: ImportResult } | { success: false; error: string }> {
  try {
    const admin = await requireAdmin();
    const parsed = PreviewSchema.safeParse(input.preview);
    if (!parsed.success) {
      return { success: false, error: 'Extracted content is not valid for import.' };
    }
    const categories = input.categories.filter((category): category is ImportCategory =>
      (IMPORT_CATEGORIES as readonly string[]).includes(category)
    );
    if (!categories.length) {
      return { success: false, error: 'Select at least one content type to import.' };
    }
    const result = await importPreviewToCms({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      preview: parsed.data,
      categories,
    });
    return { success: true, result };
  } catch {
    return { success: false, error: 'Import failed. Existing CMS content was not deleted.' };
  }
}
