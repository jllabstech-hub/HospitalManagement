import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import DepartmentManagement from '@/features/departments/components/DepartmentManagement';

export default async function AdminDepartmentsPage() {
  await requireAdmin();

  // Fetch departments with doctor count ordered by name
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
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
  });

  return <DepartmentManagement departments={departments} />;
}
