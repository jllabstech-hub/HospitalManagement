import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { PUBLISHED_FILTER } from '@/features/cms/constants';
import { requireTenantContext } from '@/server/tenant';

const articleListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  author: true,
  publishedAt: true,
  tags: true,
  seoTitle: true,
  seoDescription: true,
  speciality: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

const articleDetailSelect = {
  ...articleListSelect,
  content: true,
} satisfies Prisma.HealthArticleSelect;

const newsListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  category: true,
  author: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
} as const;

const newsDetailSelect = {
  ...newsListSelect,
  content: true,
} satisfies Prisma.NewsArticleSelect;

const successStoryListSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  patientDisplayName: true,
  ageGroup: true,
  imageUrl: true,
  videoUrl: true,
  isAnonymizedDemo: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  speciality: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  doctor: {
    select: {
      id: true,
      fullName: true,
      slug: true,
      designation: true,
      profileImageUrl: true,
    },
  },
} as const;

const testimonialSelect = {
  id: true,
  displayName: true,
  text: true,
  rating: true,
  imageUrl: true,
  publishedAt: true,
  isDemoContent: true,
  displayOrder: true,
  speciality: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

function buildArticleSearchWhere(search?: string): Prisma.HealthArticleWhereInput {
  const trimmed = search?.trim();
  if (!trimmed) return {};

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return {
    AND: tokens.map((token) => ({
      OR: [
        { title: { contains: token, mode: 'insensitive' } },
        { excerpt: { contains: token, mode: 'insensitive' } },
        { content: { contains: token, mode: 'insensitive' } },
        { tags: { contains: token, mode: 'insensitive' } },
      ],
    })),
  };
}

function buildNewsSearchWhere(search?: string): Prisma.NewsArticleWhereInput {
  const trimmed = search?.trim();
  if (!trimmed) return {};

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return {
    AND: tokens.map((token) => ({
      OR: [
        { title: { contains: token, mode: 'insensitive' } },
        { excerpt: { contains: token, mode: 'insensitive' } },
        { content: { contains: token, mode: 'insensitive' } },
        { category: { contains: token, mode: 'insensitive' } },
      ],
    })),
  };
}

export interface PaginatedArticlesResult {
  articles: Prisma.HealthArticleGetPayload<{ select: typeof articleListSelect }>[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginatedNewsResult {
  news: Prisma.NewsArticleGetPayload<{ select: typeof newsListSelect }>[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export async function getPublishedArticles(params: {
  search?: string;
  specialityId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedArticlesResult> {
  const { tenantId } = await requireTenantContext();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(50, params.limit ?? 12));
  const skip = (page - 1) * limit;

  const where: Prisma.HealthArticleWhereInput = {
    ...PUBLISHED_FILTER,
    tenantId,
    ...buildArticleSearchWhere(params.search),
    ...(params.specialityId?.trim() ? { specialityId: params.specialityId.trim() } : {}),
  };

  const [articles, totalCount] = await Promise.all([
    prisma.healthArticle.findMany({
      where,
      select: articleListSelect,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.healthArticle.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return { articles, totalCount, currentPage: page, totalPages };
}

export async function getArticleBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.healthArticle.findFirst({
    where: { slug: slug.trim(), tenantId, ...PUBLISHED_FILTER },
    select: articleDetailSelect,
  });
}

export async function getPublishedNews(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedNewsResult> {
  const { tenantId } = await requireTenantContext();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(50, params.limit ?? 12));
  const skip = (page - 1) * limit;

  const where: Prisma.NewsArticleWhereInput = {
    ...PUBLISHED_FILTER,
    tenantId,
    ...buildNewsSearchWhere(params.search),
    ...(params.category?.trim()
      ? { category: { equals: params.category.trim(), mode: 'insensitive' } }
      : {}),
  };

  const [news, totalCount] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      select: newsListSelect,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return { news, totalCount, currentPage: page, totalPages };
}

export async function getNewsBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.newsArticle.findFirst({
    where: { slug: slug.trim(), tenantId, ...PUBLISHED_FILTER },
    select: newsDetailSelect,
  });
}

export async function getPublishedSuccessStories() {
  const { tenantId } = await requireTenantContext();
  return prisma.successStory.findMany({
    where: { ...PUBLISHED_FILTER, tenantId },
    select: successStoryListSelect,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getSuccessStoryBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.successStory.findFirst({
    where: { slug: slug.trim(), tenantId, ...PUBLISHED_FILTER },
    select: {
      ...successStoryListSelect,
      content: true,
    },
  });
}

export async function getPublishedTestimonials() {
  const { tenantId } = await requireTenantContext();
  return prisma.testimonial.findMany({
    where: { ...PUBLISHED_FILTER, tenantId },
    select: testimonialSelect,
    orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
  });
}
