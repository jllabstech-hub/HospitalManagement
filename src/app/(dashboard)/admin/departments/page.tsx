import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import DepartmentManagement from '@/features/departments/components/DepartmentManagement';
import { Prisma } from '@prisma/client';

import { buildFuzzyDepartmentWhere } from '@/lib/fuzzy-search';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    limit?: string;
  }>;
}

export default async function AdminDepartmentsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const search = resolvedParams.search?.trim() || '';
  const limit = Math.max(1, parseInt(resolvedParams.limit || '10', 10));
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.DepartmentWhereInput = buildFuzzyDepartmentWhere(search);

  const [departments, totalDepartments] = await Promise.all([
    prisma.department.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { doctors: true },
        },
      },
    }),
    prisma.department.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(totalDepartments / limit) || 1;

  return (
    <DepartmentManagement
      departments={departments}
      currentPage={page}
      totalPages={totalPages}
      totalDepartments={totalDepartments}
      currentSearch={search}
      currentLimit={limit}
    />
  );
}
