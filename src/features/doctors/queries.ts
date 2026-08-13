import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/client';
import { buildFuzzyDoctorWhere } from '@/lib/fuzzy-search';

/**
 * Uses Next.js data cache when running in an App Router request.
 * Falls back to a direct query in unit tests / non-Next contexts.
 */
async function cachedQuery<T>(
  key: string[],
  opts: { revalidate: number; tags: string[] },
  query: () => Promise<T>
): Promise<T> {
  try {
    return await unstable_cache(query, key, opts)();
  } catch {
    return query();
  }
}

export interface DoctorPublicProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  qualification: string;
  experienceYears: number;
  bio: string | null;
  profileImageUrl?: string | null;
  department: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
  user: {
    email: string;
    isActive: boolean;
  };
}

export interface SearchDoctorsParams {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface SearchDoctorsResult {
  doctors: DoctorPublicProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Retrieves active medical departments for patient discovery filter.
 * Not cached: option values are live department UUIDs that must match
 * current FK rows after seed/admin mutations (stale IDs yield empty results).
 */
export async function getPublicDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Safe, server-side doctor search & discovery query for patients.
 * Enforces active status projections and pagination. Never exposes passwordHash or sensitive tokens.
 */
export async function searchDoctors(params: SearchDoctorsParams): Promise<SearchDoctorsResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 20));
  const skip = (page - 1) * limit;

  const searchTrimmed = params.search?.trim() || '';
  const fuzzyClause = buildFuzzyDoctorWhere(searchTrimmed);

  // Build Prisma filter clauses
  const whereClause: Prisma.DoctorProfileWhereInput = {
    ...fuzzyClause,
    user: { isActive: true },
    department: { isActive: true },
  };

  if (params.departmentId && params.departmentId.trim() !== '') {
    whereClause.departmentId = params.departmentId.trim();
  }

  const selectFields = {
    id: true,
    fullName: true,
    phoneNumber: true,
    qualification: true,
    experienceYears: true,
    bio: true,
    profileImageUrl: true,
    department: {
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    },
    user: {
      select: {
        email: true,
        isActive: true,
      },
    },
  };

  const [doctors, totalCount] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: whereClause,
      select: selectFields,
      orderBy: { fullName: 'asc' },
      skip,
      take: limit,
    }),
    prisma.doctorProfile.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    doctors,
    totalCount,
    currentPage: page,
    totalPages,
  };
}

/**
 * Retrieves a single doctor's public professional profile by doctorProfileId.
 * Profile text is cacheable; live slot availability is never cached here.
 */
export async function getDoctorPublicProfile(doctorId: string): Promise<DoctorPublicProfile | null> {
  if (!doctorId || typeof doctorId !== 'string') return null;

  return cachedQuery(
    ['public-doctor-profile', doctorId],
    { revalidate: 120, tags: ['public-doctors', `doctor-${doctorId}`] },
    () =>
      prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          qualification: true,
          experienceYears: true,
          bio: true,
          department: {
            select: {
              id: true,
              name: true,
              description: true,
              isActive: true,
            },
          },
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
        },
      })
  );
}
