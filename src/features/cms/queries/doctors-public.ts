import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/client';
import { PUBLISHED_FILTER } from '@/features/cms/constants';
import { buildFuzzyDoctorWhere } from '@/lib/fuzzy-search';
import { requireTenantContext } from '@/server/tenant';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const publicDoctorWhere: Prisma.DoctorProfileWhereInput = {
  ...PUBLISHED_FILTER,
  user: { isActive: true },
  department: { isActive: true, ...PUBLISHED_FILTER },
};

export function publicDoctorWhereFor(tenantId: string): Prisma.DoctorProfileWhereInput {
  return {
    ...PUBLISHED_FILTER,
    tenantId,
    user: { isActive: true, tenantId },
    department: { isActive: true, tenantId, ...PUBLISHED_FILTER },
  };
}

export const publicDoctorListSelect = {
  id: true,
  fullName: true,
  slug: true,
  qualification: true,
  experienceYears: true,
  profileImageUrl: true,
  publicDisplayName: true,
  designation: true,
  isFeatured: true,
  displayOrder: true,
  department: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.DoctorProfileSelect;

export function publicDoctorDetailSelectFor(tenantId: string) {
  return {
    id: true,
    fullName: true,
    slug: true,
    phoneNumber: true,
    qualification: true,
    experienceYears: true,
    bio: true,
    profileImageUrl: true,
    publicDisplayName: true,
    designation: true,
    languages: true,
    publicBio: true,
    education: true,
    certifications: true,
    memberships: true,
    areasOfInterest: true,
    displayOrder: true,
    isFeatured: true,
    seoTitle: true,
    seoDescription: true,
    department: {
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
      },
    },
    user: {
      select: {
        email: true,
        isActive: true,
      },
    },
    specialities: {
      where: { speciality: { isActive: true, tenantId, ...PUBLISHED_FILTER } },
      select: {
        speciality: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
    centres: {
      where: { centre: { isActive: true, tenantId, ...PUBLISHED_FILTER } },
      select: {
        centre: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
  } satisfies Prisma.DoctorProfileSelect;
}

export type PublicDoctorSort = 'name' | 'experience' | 'featured';

export interface SearchPublicDoctorsParams {
  search?: string;
  departmentId?: string;
  specialityId?: string;
  page?: number;
  limit?: number;
  sort?: PublicDoctorSort;
}

export interface SearchPublicDoctorsResult {
  doctors: Prisma.DoctorProfileGetPayload<{ select: typeof publicDoctorListSelect }>[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

function buildPublicDoctorOrderBy(sort?: PublicDoctorSort): Prisma.DoctorProfileOrderByWithRelationInput[] {
  switch (sort) {
    case 'experience':
      return [{ experienceYears: 'desc' }, { fullName: 'asc' }];
    case 'featured':
      return [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { fullName: 'asc' }];
    case 'name':
    default:
      return [{ fullName: 'asc' }];
  }
}

export async function searchPublicDoctors(
  params: SearchPublicDoctorsParams
): Promise<SearchPublicDoctorsResult> {
  const { tenantId } = await requireTenantContext();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(50, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const searchTrimmed = params.search?.trim() ?? '';

  const whereClause: Prisma.DoctorProfileWhereInput = {
    ...publicDoctorWhereFor(tenantId),
  };

  if (searchTrimmed) {
    const fuzzyClause = buildFuzzyDoctorWhere(searchTrimmed);
    const searchOr: Prisma.DoctorProfileWhereInput[] = [
      { slug: { contains: searchTrimmed, mode: 'insensitive' } },
      { publicDisplayName: { contains: searchTrimmed, mode: 'insensitive' } },
      { designation: { contains: searchTrimmed, mode: 'insensitive' } },
    ];
    if (Object.keys(fuzzyClause).length > 0) {
      searchOr.unshift(fuzzyClause);
    }
    whereClause.OR = searchOr;
  }

  if (params.departmentId?.trim()) {
    const targetDept = await prisma.department.findFirst({
      where: { id: params.departmentId.trim(), tenantId },
      select: { name: true },
    });
    if (targetDept) {
      whereClause.department = {
        isActive: true,
        tenantId,
        ...PUBLISHED_FILTER,
        name: { equals: targetDept.name, mode: 'insensitive' },
      };
    } else {
      whereClause.id = { in: [] };
    }
  }

  if (params.specialityId?.trim()) {
    const speciality = await prisma.speciality.findFirst({
      where: { id: params.specialityId.trim(), tenantId },
      select: { id: true },
    });
    if (speciality) {
      whereClause.specialities = {
        some: { specialityId: speciality.id },
      };
    } else {
      whereClause.id = { in: [] };
    }
  }

  const [doctors, totalCount] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: whereClause,
      select: publicDoctorListSelect,
      orderBy: buildPublicDoctorOrderBy(params.sort),
      skip,
      take: limit,
    }),
    prisma.doctorProfile.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return { doctors, totalCount, currentPage: page, totalPages };
}

export async function getPublicDoctorByIdOrSlug(idOrSlug: string) {
  if (!idOrSlug?.trim()) return null;

  const { tenantId } = await requireTenantContext();
  const trimmed = idOrSlug.trim();
  const isUuid = UUID_REGEX.test(trimmed);
  const doctorWhere = publicDoctorWhereFor(tenantId);
  const detailSelect = publicDoctorDetailSelectFor(tenantId);

  try {
    return await unstable_cache(
      async () => {
        if (isUuid) {
          const byId = await prisma.doctorProfile.findFirst({
            where: { id: trimmed, ...doctorWhere },
            select: detailSelect,
          });
          if (byId) return byId;
        }

        return prisma.doctorProfile.findFirst({
          where: { slug: trimmed, ...doctorWhere },
          select: detailSelect,
        });
      },
      ['public-doctor', tenantId, trimmed],
      { revalidate: 300, tags: [`public-doctors-${tenantId}`, `doctor-${tenantId}-${trimmed}`] }
    )();
  } catch {
    if (isUuid) {
      const byId = await prisma.doctorProfile.findFirst({
        where: { id: trimmed, ...doctorWhere },
        select: detailSelect,
      });
      if (byId) return byId;
    }

    return prisma.doctorProfile.findFirst({
      where: { slug: trimmed, ...doctorWhere },
      select: detailSelect,
    });
  }
}
