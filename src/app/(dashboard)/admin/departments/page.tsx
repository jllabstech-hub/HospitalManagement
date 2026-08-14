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
  const admin = await requireAdmin();
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const search = resolvedParams.search?.trim() || '';
  const limit = Math.max(1, parseInt(resolvedParams.limit || '10', 10));

  const whereCondition: Prisma.DepartmentWhereInput = buildFuzzyDepartmentWhere(search);

  if (admin.tenantId) {
    whereCondition.tenantId = admin.tenantId;
  }

  const rawDepartments = await prisma.department.findMany({
    where: whereCondition,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      seoTitle: true,
      seoDescription: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { doctors: true },
      },
    },
  });

  // Deduplicate departments by name to ensure no duplicate entries are displayed
  const seenNames = new Set<string>();
  const uniqueDepartments = rawDepartments.filter((dept) => {
    const key = dept.name.trim().toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  const totalDepartments = uniqueDepartments.length;
  const skip = (page - 1) * limit;
  const paginatedDepartments = uniqueDepartments.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalDepartments / limit) || 1;

  return (
    <DepartmentManagement
      departments={paginatedDepartments}
      currentPage={page}
      totalPages={totalPages}
      totalDepartments={totalDepartments}
      currentSearch={search}
      currentLimit={limit}
    />
  );
}
