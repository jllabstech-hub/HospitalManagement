import { ContentStatus, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { slugify } from '@/lib/slug';
import { writeAuditLog } from '@/server/security/audit';
import { itemSlug } from './normalize';
import { looksLikeForeignHospitalCopy } from '@/features/cms/foreign-hospital-copy';
import type {
  CrawlPreview,
  ImportCategory,
  ImportCounts,
  ImportResult,
  InternationalDraft,
  PreviewItem,
} from './types';

const emptyCounts = (): ImportCounts => ({ created: 0, updated: 0, skipped: 0, failed: 0 });

function add(target: ImportCounts, status: keyof ImportCounts) {
  target[status] += 1;
}

async function uniqueSlug(tenantId: string, base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || 'item';
  let slug = root;
  let suffix = 0;
  while (await exists(slug)) {
    suffix += 1;
    slug = `${root}-${suffix}`;
  }
  return slug;
}

function fillIfEmpty(current: string | null | undefined, incoming?: string | null): string | null | undefined {
  if (incoming && incoming.trim() && (!current || !current.trim())) return incoming.trim();
  if (incoming && incoming.trim().length > (current?.length || 0) + 40) return incoming.trim();
  return undefined;
}

export async function importPreviewToCms(input: {
  tenantId: string;
  actorUserId: string;
  preview: CrawlPreview;
  categories: ImportCategory[];
}): Promise<ImportResult> {
  const selected = new Set(input.categories);
  const byCategory: Record<string, ImportCounts> = {};
  const totals = emptyCounts();

  const bump = (category: string, status: keyof ImportCounts) => {
    byCategory[category] ??= emptyCounts();
    add(byCategory[category], status);
    add(totals, status);
  };

  if (selected.has('hospitalProfile') && input.preview.hospitalProfile) {
    try {
      const incoming = input.preview.hospitalProfile;
      if (
        looksLikeForeignHospitalCopy(
          incoming.hospitalName,
          incoming.shortDescription,
          incoming.fullDescription,
          incoming.tagline
        )
      ) {
        bump('hospitalProfile', 'skipped');
      } else {
        const existing = await prisma.hospitalProfile.findUnique({ where: { id: input.tenantId } });
        if (!existing) {
          bump('hospitalProfile', 'failed');
        } else {
          const data = {
            shortDescription: fillIfEmpty(existing.shortDescription, incoming.shortDescription),
            fullDescription: fillIfEmpty(existing.fullDescription, incoming.fullDescription),
            tagline: fillIfEmpty(existing.tagline, incoming.tagline),
            phone: fillIfEmpty(existing.phone, incoming.phone),
            emergencyPhone: fillIfEmpty(existing.emergencyPhone, incoming.emergencyPhone),
            email: fillIfEmpty(existing.email, incoming.email),
            addressLine1: fillIfEmpty(existing.addressLine1, incoming.addressLine1),
            city: fillIfEmpty(existing.city, incoming.city),
            state: fillIfEmpty(existing.state, incoming.state),
            workingHours: fillIfEmpty(existing.workingHours, incoming.workingHours),
            mission: fillIfEmpty(existing.mission, incoming.mission),
            vision: fillIfEmpty(existing.vision, incoming.vision),
          };
          const patch = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
          if (Object.keys(patch).length === 0) {
            bump('hospitalProfile', 'skipped');
          } else {
            await prisma.hospitalProfile.update({ where: { id: input.tenantId }, data: patch });
            bump('hospitalProfile', 'updated');
          }
        }
      }
    } catch {
      bump('hospitalProfile', 'failed');
    }
  }

  if (selected.has('departments')) {
    await upsertNamed(input.tenantId, input.preview.departments, bump, 'departments', async (item, slug) => {
      const existing = await findNamed(input.tenantId, 'department', item, slug);
      if (existing) {
        await prisma.department.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            description: fillIfEmpty(existing.description, item.description) ?? existing.description,
            shortDescription: fillIfEmpty(existing.shortDescription, item.description) ?? existing.shortDescription,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.department.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.department.create({
        data: {
          name: item.name,
          slug: finalSlug,
          description: item.description || null,
          shortDescription: item.description || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('specialities')) {
    await upsertNamed(input.tenantId, input.preview.specialities, bump, 'specialities', async (item, slug) => {
      const existing = await findNamed(input.tenantId, 'speciality', item, slug);
      if (existing) {
        await prisma.speciality.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            shortDescription: fillIfEmpty(existing.shortDescription, item.description) ?? existing.shortDescription,
            fullDescription: fillIfEmpty(existing.fullDescription, item.description) ?? existing.fullDescription,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.speciality.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.speciality.create({
        data: {
          name: item.name,
          slug: finalSlug,
          shortDescription: item.description || null,
          fullDescription: item.description || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('centres')) {
    await upsertNamed(input.tenantId, input.preview.centres, bump, 'centres', async (item, slug) => {
      const existing = await prisma.centreOfExcellence.findFirst({
        where: {
          tenantId: input.tenantId,
          OR: [{ slug }, { name: { equals: item.name, mode: 'insensitive' } }],
        },
      });
      if (existing) {
        await prisma.centreOfExcellence.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            shortDescription: fillIfEmpty(existing.shortDescription, item.description) ?? existing.shortDescription,
            fullDescription: fillIfEmpty(existing.fullDescription, item.description) ?? existing.fullDescription,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.centreOfExcellence.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.centreOfExcellence.create({
        data: {
          name: item.name,
          slug: finalSlug,
          shortDescription: item.description || null,
          fullDescription: item.description || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('services')) {
    await upsertNamed(input.tenantId, input.preview.services, bump, 'services', async (item, slug) => {
      const existing = await prisma.hospitalService.findFirst({
        where: {
          tenantId: input.tenantId,
          OR: [{ slug }, { name: { equals: item.name, mode: 'insensitive' } }],
        },
      });
      if (existing) {
        await prisma.hospitalService.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            shortDescription: fillIfEmpty(existing.shortDescription, item.description) ?? existing.shortDescription,
            fullDescription: fillIfEmpty(existing.fullDescription, item.description) ?? existing.fullDescription,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.hospitalService.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.hospitalService.create({
        data: {
          name: item.name,
          slug: finalSlug,
          shortDescription: item.description || null,
          fullDescription: item.description || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('packages')) {
    await upsertNamed(input.tenantId, input.preview.packages, bump, 'packages', async (item, slug) => {
      const existing = await prisma.healthPackage.findFirst({
        where: {
          tenantId: input.tenantId,
          OR: [{ slug }, { name: { equals: item.name, mode: 'insensitive' } }],
        },
      });
      const price = item.price ? new Prisma.Decimal(item.price) : undefined;
      if (existing) {
        await prisma.healthPackage.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            description: fillIfEmpty(existing.description, item.description) ?? existing.description,
            duration: fillIfEmpty(existing.duration, item.duration) ?? existing.duration,
            eligibility: fillIfEmpty(existing.eligibility, item.eligibility) ?? existing.eligibility,
            includedItems: fillIfEmpty(existing.includedItems, item.includedItems) ?? existing.includedItems,
            ...(price && !existing.price ? { price, isDemoPricing: false } : {}),
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.healthPackage.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.healthPackage.create({
        data: {
          name: item.name,
          slug: finalSlug,
          description: item.description || null,
          duration: item.duration || null,
          eligibility: item.eligibility || null,
          includedItems: item.includedItems || null,
          price: price ?? null,
          isDemoPricing: false,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('faqs')) {
    for (const item of input.preview.faqs) {
      try {
        const question = item.question || item.name;
        const answer = item.answer || item.description;
        if (!question || !answer) {
          bump('faqs', 'skipped');
          continue;
        }
        if (looksLikeForeignHospitalCopy(question, answer)) {
          bump('faqs', 'skipped');
          continue;
        }
        const existing = await prisma.faqItem.findFirst({
          where: { tenantId: input.tenantId, question: { equals: question, mode: 'insensitive' } },
        });
        if (existing) {
          await prisma.faqItem.updateMany({
            where: { id: existing.id, tenantId: input.tenantId },
            data: {
              answer: fillIfEmpty(existing.answer, answer) ?? existing.answer,
              category: existing.category || item.category || null,
              contentStatus: ContentStatus.PUBLISHED,
            },
          });
          bump('faqs', 'updated');
        } else {
          await prisma.faqItem.create({
            data: {
              question,
              answer,
              category: item.category || null,
              contentStatus: ContentStatus.PUBLISHED,
              tenantId: input.tenantId,
            },
          });
          bump('faqs', 'created');
        }
      } catch {
        bump('faqs', 'failed');
      }
    }
  }

  if (selected.has('facilities')) {
    await upsertNamed(input.tenantId, input.preview.facilities, bump, 'facilities', async (item, slug) => {
      const existing = await prisma.facility.findFirst({
        where: {
          tenantId: input.tenantId,
          OR: [{ slug }, { name: { equals: item.name, mode: 'insensitive' } }],
        },
      });
      if (existing) {
        await prisma.facility.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            description: fillIfEmpty(existing.description, item.description) ?? existing.description,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.facility.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.facility.create({
        data: {
          name: item.name,
          slug: finalSlug,
          description: item.description || null,
          category: item.category || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('patientResources')) {
    await upsertNamed(input.tenantId, input.preview.patientResources, bump, 'patientResources', async (item, slug) => {
      const existing = await prisma.patientResource.findFirst({
        where: {
          tenantId: input.tenantId,
          OR: [{ slug }, { title: { equals: item.name, mode: 'insensitive' } }],
        },
      });
      if (existing) {
        await prisma.patientResource.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            description: fillIfEmpty(existing.description, item.description) ?? existing.description,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.patientResource.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.patientResource.create({
        data: {
          title: item.name,
          slug: finalSlug,
          description: item.description || null,
          category: item.category || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('insurance')) {
    await upsertNamed(input.tenantId, input.preview.insurance, bump, 'insurance', async (item, slug) => {
      const existing = await prisma.insurancePartner.findFirst({
        where: {
          tenantId: input.tenantId,
          OR: [{ slug }, { name: { equals: item.name, mode: 'insensitive' } }],
        },
      });
      if (existing) {
        await prisma.insurancePartner.updateMany({
          where: { id: existing.id, tenantId: input.tenantId },
          data: {
            description: fillIfEmpty(existing.description, item.description) ?? existing.description,
            contentStatus: ContentStatus.PUBLISHED,
            isActive: true,
          },
        });
        return 'updated';
      }
      const finalSlug = await uniqueSlug(input.tenantId, slug, async (value) =>
        Boolean(await prisma.insurancePartner.findFirst({ where: { tenantId: input.tenantId, slug: value } }))
      );
      await prisma.insurancePartner.create({
        data: {
          name: item.name,
          slug: finalSlug,
          description: item.description || null,
          contentStatus: ContentStatus.PUBLISHED,
          isActive: true,
          tenantId: input.tenantId,
        },
      });
      return 'created';
    });
  }

  if (selected.has('articles')) {
    await upsertArticles(input.tenantId, input.preview.articles, bump, 'articles', 'healthArticle');
  }
  if (selected.has('news')) {
    await upsertArticles(input.tenantId, input.preview.news, bump, 'news', 'newsArticle');
  }

  if (selected.has('testimonials')) {
    for (const item of input.preview.testimonials) {
      try {
        const text = item.description || '';
        if (text.length < 20) {
          bump('testimonials', 'skipped');
          continue;
        }
        if (looksLikeForeignHospitalCopy(item.name, text)) {
          bump('testimonials', 'skipped');
          continue;
        }
        const existing = await prisma.testimonial.findFirst({
          where: { tenantId: input.tenantId, text: { equals: text, mode: 'insensitive' } },
        });
        if (existing) {
          bump('testimonials', 'skipped');
          continue;
        }
        await prisma.testimonial.create({
          data: {
            displayName: item.name || 'Patient',
            text,
            isDemoContent: false,
            contentStatus: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            tenantId: input.tenantId,
          },
        });
        bump('testimonials', 'created');
      } catch {
        bump('testimonials', 'failed');
      }
    }
  }

  if (selected.has('international') && input.preview.international) {
    await upsertInternational(input.tenantId, input.preview.international, bump);
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: 'cms.import',
    entityType: 'CmsImport',
    after: { totals, categories: input.categories },
  });

  try {
    revalidateTag('public-catalog');
    revalidateTag('public-departments');
    revalidatePath('/');
    revalidatePath('/admin/content');
    revalidatePath('/departments');
    revalidatePath('/specialities');
    revalidatePath('/services');
    revalidatePath('/health-packages');
    revalidatePath('/patient-resources/faq');
    revalidatePath('/centres-of-excellence');
  } catch {
    // outside Next.js request context
  }

  return { byCategory, totals };
}

async function upsertNamed(
  tenantId: string,
  items: PreviewItem[],
  bump: (category: string, status: keyof ImportCounts) => void,
  category: string,
  save: (item: PreviewItem, slug: string) => Promise<'created' | 'updated' | 'skipped'>
) {
  void tenantId;
  for (const item of items) {
    try {
      if (!item.name?.trim()) {
        bump(category, 'skipped');
        continue;
      }
      if (looksLikeForeignHospitalCopy(item.name, item.description, item.question, item.answer, item.content, item.excerpt)) {
        bump(category, 'skipped');
        continue;
      }
      const slug = item.slug || itemSlug(item.name, category);
      const status = await save(item, slug);
      bump(category, status);
    } catch {
      bump(category, 'failed');
    }
  }
}

async function findNamed(
  tenantId: string,
  model: 'department',
  item: PreviewItem,
  slug: string
): Promise<Prisma.DepartmentGetPayload<object> | null>;
async function findNamed(
  tenantId: string,
  model: 'speciality',
  item: PreviewItem,
  slug: string
): Promise<Prisma.SpecialityGetPayload<object> | null>;
async function findNamed(
  tenantId: string,
  model: 'department' | 'speciality',
  item: PreviewItem,
  slug: string
) {
  const where = {
    tenantId,
    OR: [{ slug }, { name: { equals: item.name, mode: 'insensitive' as const } }],
  };
  if (model === 'department') {
    return prisma.department.findFirst({ where });
  }
  return prisma.speciality.findFirst({ where });
}

async function upsertArticles(
  tenantId: string,
  items: PreviewItem[],
  bump: (category: string, status: keyof ImportCounts) => void,
  category: 'articles' | 'news',
  model: 'healthArticle' | 'newsArticle'
) {
  for (const item of items) {
    try {
      const content = item.content || item.description || '';
      if (!item.name || content.length < 40) {
        bump(category, 'skipped');
        continue;
      }
      if (looksLikeForeignHospitalCopy(item.name, item.excerpt, content)) {
        bump(category, 'skipped');
        continue;
      }
      const slug = itemSlug(item.name, category);
      if (model === 'healthArticle') {
        const existing = await prisma.healthArticle.findFirst({
          where: { tenantId, OR: [{ slug }, { title: { equals: item.name, mode: 'insensitive' } }] },
        });
        if (existing) {
          await prisma.healthArticle.updateMany({
            where: { id: existing.id, tenantId },
            data: {
              excerpt: fillIfEmpty(existing.excerpt, item.excerpt) ?? existing.excerpt,
              content: existing.content.length >= content.length ? existing.content : content,
              contentStatus: ContentStatus.PUBLISHED,
              publishedAt: existing.publishedAt ?? new Date(),
            },
          });
          bump(category, 'updated');
        } else {
          const finalSlug = await uniqueSlug(tenantId, slug, async (value) =>
            Boolean(await prisma.healthArticle.findFirst({ where: { tenantId, slug: value } }))
          );
          await prisma.healthArticle.create({
            data: {
              title: item.name,
              slug: finalSlug,
              excerpt: item.excerpt || null,
              content,
              contentStatus: ContentStatus.PUBLISHED,
              publishedAt: new Date(),
              tenantId,
            },
          });
          bump(category, 'created');
        }
      } else {
        const existing = await prisma.newsArticle.findFirst({
          where: { tenantId, OR: [{ slug }, { title: { equals: item.name, mode: 'insensitive' } }] },
        });
        if (existing) {
          await prisma.newsArticle.updateMany({
            where: { id: existing.id, tenantId },
            data: {
              excerpt: fillIfEmpty(existing.excerpt, item.excerpt) ?? existing.excerpt,
              content: existing.content.length >= content.length ? existing.content : content,
              contentStatus: ContentStatus.PUBLISHED,
              publishedAt: existing.publishedAt ?? new Date(),
            },
          });
          bump(category, 'updated');
        } else {
          const finalSlug = await uniqueSlug(tenantId, slug, async (value) =>
            Boolean(await prisma.newsArticle.findFirst({ where: { tenantId, slug: value } }))
          );
          await prisma.newsArticle.create({
            data: {
              title: item.name,
              slug: finalSlug,
              excerpt: item.excerpt || null,
              content,
              contentStatus: ContentStatus.PUBLISHED,
              publishedAt: new Date(),
              tenantId,
            },
          });
          bump(category, 'created');
        }
      }
    } catch {
      bump(category, 'failed');
    }
  }
}

async function upsertInternational(
  tenantId: string,
  draft: InternationalDraft,
  bump: (category: string, status: keyof ImportCounts) => void
) {
  try {
    const existing = await prisma.internationalPageContent.findUnique({ where: { tenantId } });
    const data = {
      title: draft.title || 'International Patients',
      introduction: draft.introduction || null,
      howToRequest: draft.howToRequest || null,
      secondOpinion: draft.secondOpinion || null,
      requiredDocuments: draft.requiredDocuments || null,
      travelInformation: draft.travelInformation || null,
      accommodationInfo: draft.accommodationInfo || null,
    };
    if (existing) {
      await prisma.internationalPageContent.update({
        where: { tenantId },
        data: {
          introduction: fillIfEmpty(existing.introduction, data.introduction) ?? existing.introduction,
          howToRequest: fillIfEmpty(existing.howToRequest, data.howToRequest) ?? existing.howToRequest,
          travelInformation: fillIfEmpty(existing.travelInformation, data.travelInformation) ?? existing.travelInformation,
        },
      });
      bump('international', 'updated');
    } else {
      await prisma.internationalPageContent.create({
        data: { ...data, tenantId },
      });
      bump('international', 'created');
    }
  } catch {
    bump('international', 'failed');
  }
}
