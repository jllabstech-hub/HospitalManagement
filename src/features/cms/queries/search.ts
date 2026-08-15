import { prisma } from '@/server/db/client';
import { unstable_cache } from 'next/cache';
import { ACTIVE_PUBLISHED_FILTER, PUBLISHED_FILTER } from '@/features/cms/constants';
import { publicDoctorListSelect, publicDoctorWhereFor } from '@/features/cms/queries/doctors-public';
import { buildFuzzyDoctorWhere } from '@/lib/fuzzy-search';
import { requireTenantContext } from '@/server/tenant';

const SEARCH_TAKE = 5;

function tokenizeQuery(q: string): string[] {
  return q.trim().split(/\s+/).filter(Boolean);
}

function buildTokenAnd<T extends Record<string, unknown>>(
  tokens: string[],
  buildTokenOr: (token: string) => T
): { AND: T[] } | Record<string, never> {
  if (tokens.length === 0) return {};
  return { AND: tokens.map(buildTokenOr) };
}

export interface GlobalSearchResult {
  doctors: Awaited<ReturnType<typeof searchDoctors>>;
  departments: Awaited<ReturnType<typeof searchDepartments>>;
  specialities: Awaited<ReturnType<typeof searchSpecialities>>;
  services: Awaited<ReturnType<typeof searchServices>>;
  articles: Awaited<ReturnType<typeof searchArticles>>;
  news: Awaited<ReturnType<typeof searchNews>>;
}

async function searchDoctors(q: string, tenantId: string) {
  const tokens = tokenizeQuery(q);
  const fuzzyClause = buildFuzzyDoctorWhere(q);

  return prisma.doctorProfile.findMany({
    where: {
      ...publicDoctorWhereFor(tenantId),
      OR: [
        ...(Object.keys(fuzzyClause).length > 0 ? [fuzzyClause] : []),
        ...tokens.flatMap((token) => [
          { slug: { contains: token, mode: 'insensitive' as const } },
          { publicDisplayName: { contains: token, mode: 'insensitive' as const } },
        ]),
      ],
    },
    select: publicDoctorListSelect,
    orderBy: [{ isFeatured: 'desc' }, { fullName: 'asc' }],
    take: SEARCH_TAKE,
  });
}

async function searchDepartments(q: string, tenantId: string) {
  const tokens = tokenizeQuery(q);

  return prisma.department.findMany({
    where: {
      ...ACTIVE_PUBLISHED_FILTER,
      tenantId,
      ...buildTokenAnd(tokens, (token) => ({
        OR: [
          { name: { contains: token, mode: 'insensitive' as const } },
          { slug: { contains: token, mode: 'insensitive' as const } },
          { shortDescription: { contains: token, mode: 'insensitive' as const } },
        ],
      })),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      icon: true,
    },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    take: SEARCH_TAKE,
  });
}

async function searchSpecialities(q: string, tenantId: string) {
  const tokens = tokenizeQuery(q);

  return prisma.speciality.findMany({
    where: {
      ...ACTIVE_PUBLISHED_FILTER,
      tenantId,
      ...buildTokenAnd(tokens, (token) => ({
        OR: [
          { name: { contains: token, mode: 'insensitive' as const } },
          { slug: { contains: token, mode: 'insensitive' as const } },
          { shortDescription: { contains: token, mode: 'insensitive' as const } },
        ],
      })),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      icon: true,
    },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    take: SEARCH_TAKE,
  });
}

async function searchServices(q: string, tenantId: string) {
  const tokens = tokenizeQuery(q);

  return prisma.hospitalService.findMany({
    where: {
      ...ACTIVE_PUBLISHED_FILTER,
      tenantId,
      ...buildTokenAnd(tokens, (token) => ({
        OR: [
          { name: { contains: token, mode: 'insensitive' as const } },
          { slug: { contains: token, mode: 'insensitive' as const } },
          { shortDescription: { contains: token, mode: 'insensitive' as const } },
        ],
      })),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      icon: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    take: SEARCH_TAKE,
  });
}

async function searchArticles(q: string, tenantId: string) {
  const tokens = tokenizeQuery(q);

  return prisma.healthArticle.findMany({
    where: {
      ...PUBLISHED_FILTER,
      tenantId,
      ...buildTokenAnd(tokens, (token) => ({
        OR: [
          { title: { contains: token, mode: 'insensitive' as const } },
          { excerpt: { contains: token, mode: 'insensitive' as const } },
          { slug: { contains: token, mode: 'insensitive' as const } },
        ],
      })),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: SEARCH_TAKE,
  });
}

async function searchNews(q: string, tenantId: string) {
  const tokens = tokenizeQuery(q);

  return prisma.newsArticle.findMany({
    where: {
      ...PUBLISHED_FILTER,
      tenantId,
      ...buildTokenAnd(tokens, (token) => ({
        OR: [
          { title: { contains: token, mode: 'insensitive' as const } },
          { excerpt: { contains: token, mode: 'insensitive' as const } },
          { slug: { contains: token, mode: 'insensitive' as const } },
          { category: { contains: token, mode: 'insensitive' as const } },
        ],
      })),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      category: true,
      publishedAt: true,
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: SEARCH_TAKE,
  });
}

export async function globalPublicSearch(q: string): Promise<GlobalSearchResult> {
  const trimmed = q?.trim().toLowerCase();
  if (!trimmed) {
    return {
      doctors: [],
      departments: [],
      specialities: [],
      services: [],
      articles: [],
      news: [],
    };
  }

  const { tenantId } = await requireTenantContext();

  try {
    return await unstable_cache(
      async () => {
        const [doctors, departments, specialities, services, articles, news] = await Promise.all([
          searchDoctors(trimmed, tenantId),
          searchDepartments(trimmed, tenantId),
          searchSpecialities(trimmed, tenantId),
          searchServices(trimmed, tenantId),
          searchArticles(trimmed, tenantId),
          searchNews(trimmed, tenantId),
        ]);

        return { doctors, departments, specialities, services, articles, news };
      },
      ['global-public-search', tenantId, trimmed],
      { revalidate: 300, tags: [`public-search-${tenantId}`] }
    )();
  } catch {
    const [doctors, departments, specialities, services, articles, news] = await Promise.all([
      searchDoctors(trimmed, tenantId),
      searchDepartments(trimmed, tenantId),
      searchSpecialities(trimmed, tenantId),
      searchServices(trimmed, tenantId),
      searchArticles(trimmed, tenantId),
      searchNews(trimmed, tenantId),
    ]);

    return { doctors, departments, specialities, services, articles, news };
  }
}
