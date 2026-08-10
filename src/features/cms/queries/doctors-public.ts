import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { PUBLISHED_FILTER } from '@/features/cms/constants';
import { buildFuzzyDoctorWhere } from '@/lib/fuzzy-search';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const publicDoctorWhere: Prisma.DoctorProfileWhereInput = {
  ...PUBLISHED_FILTER,
  user: { isActive: true },
  department: { isActive: true, ...PUBLISHED_FILTER },
};

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

export const publicDoctorDetailSelect = {
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
    where: { speciality: { isActive: true, ...PUBLISHED_FILTER } },
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
    where: { centre: { isActive: true, ...PUBLISHED_FILTER } },
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
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(50, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const searchTrimmed = params.search?.trim() ?? '';

  const whereClause: Prisma.DoctorProfileWhereInput = {
    ...publicDoctorWhere,
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
    whereClause.departmentId = params.departmentId.trim();
  }

  if (params.specialityId?.trim()) {
    whereClause.specialities = {
      some: { specialityId: params.specialityId.trim() },
    };
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

  const trimmed = idOrSlug.trim();
  const isUuid = UUID_REGEX.test(trimmed);

  if (isUuid) {
    const byId = await prisma.doctorProfile.findFirst({
      where: { id: trimmed, ...publicDoctorWhere },
      select: publicDoctorDetailSelect,
    });
    if (byId) return byId;
  }

  return prisma.doctorProfile.findFirst({
    where: { slug: trimmed, ...publicDoctorWhere },
    select: publicDoctorDetailSelect,
  });
}
