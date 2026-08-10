import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import DoctorManagement from '@/features/doctors/components/DoctorManagement';
import { Prisma } from '@prisma/client';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 5;

export default async function AdminDoctorsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.search?.trim() || '';
  const departmentId = params.departmentId || '';
  const status = params.status || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // Build Prisma filter conditions
  const whereCondition: Prisma.DoctorProfileWhereInput = {};

  if (search) {
    whereCondition.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { qualification: { contains: search, mode: 'insensitive' } },
      { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  if (departmentId) {
    whereCondition.departmentId = departmentId;
  }

  if (status === 'active') {
    whereCondition.user = { is: { isActive: true } };
  } else if (status === 'inactive') {
    whereCondition.user = { is: { isActive: false } };
  }

  // Fetch count and paginated items
  const [totalDoctors, doctors, activeDepartments] = await Promise.all([
    prisma.doctorProfile.count({ where: whereCondition }),
    prisma.doctorProfile.findMany({
      where: whereCondition,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        qualification: true,
        experienceYears: true,
        bio: true,
        department: {
          select: { id: true, name: true, isActive: true },
        },
        user: {
          select: { id: true, email: true, isActive: true },
        },
      },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalDoctors / PAGE_SIZE) || 1;

  return (
    <DoctorManagement
      doctors={doctors}
      departments={activeDepartments}
      totalDoctors={totalDoctors}
      currentPage={page}
      totalPages={totalPages}
      currentSearch={search}
      currentDepartmentId={departmentId}
      currentStatus={status}
    />
  );
}
