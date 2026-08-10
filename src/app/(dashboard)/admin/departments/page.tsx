import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import DepartmentManagement from '@/features/departments/components/DepartmentManagement';

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function AdminDepartmentsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const limit = 5;
  const skip = (page - 1) * limit;

  const [departments, totalDepartments] = await Promise.all([
    prisma.department.findMany({
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
    prisma.department.count(),
  ]);

  const totalPages = Math.ceil(totalDepartments / limit) || 1;

  return (
    <DepartmentManagement
      departments={departments}
      currentPage={page}
      totalPages={totalPages}
      totalDepartments={totalDepartments}
    />
  );
}
