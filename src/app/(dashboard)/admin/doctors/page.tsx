import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import DoctorManagement from '@/features/doctors/components/DoctorManagement';
import { Prisma } from '@prisma/client';
import { buildFuzzyDoctorWhere } from '@/lib/fuzzy-search';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminDoctorsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const search = params.search?.trim() || '';
  const departmentId = params.departmentId || '';
  const status = params.status || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.max(1, parseInt(params.limit || '10', 10));

  const whereCondition: Prisma.DoctorProfileWhereInput = buildFuzzyDoctorWhere(search);

  if (admin.tenantId) {
    whereCondition.tenantId = admin.tenantId;
  }

  if (departmentId) {
    whereCondition.departmentId = departmentId;
  }

  if (status === 'active') {
    whereCondition.user = { is: { isActive: true } };
  } else if (status === 'inactive') {
    whereCondition.user = { is: { isActive: false } };
  }

  const [rawDoctors, rawDepartments] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: whereCondition,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        qualification: true,
        experienceYears: true,
        bio: true,
        profileImageUrl: true,
        department: {
          select: { id: true, name: true, isActive: true },
        },
        user: {
          select: { id: true, email: true, isActive: true },
        },
      },
    }),
    prisma.department.findMany({
      where: admin.tenantId ? { tenantId: admin.tenantId, isActive: true } : { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  // Deduplicate doctors by email or fullName
  const seenEmails = new Set<string>();
  const uniqueDoctors = rawDoctors.filter((doc) => {
    const key = doc.user.email?.trim().toLowerCase() || doc.fullName.trim().toLowerCase();
    if (seenEmails.has(key)) return false;
    seenEmails.add(key);
    return true;
  });

  // Deduplicate active departments dropdown options
  const seenDepts = new Set<string>();
  const uniqueDepartments = rawDepartments.filter((d) => {
    const key = d.name.trim().toLowerCase();
    if (seenDepts.has(key)) return false;
    seenDepts.add(key);
    return true;
  });

  const totalDoctors = uniqueDoctors.length;
  const skip = (page - 1) * limit;
  const paginatedDoctors = uniqueDoctors.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalDoctors / limit) || 1;

  return (
    <DoctorManagement
      doctors={paginatedDoctors}
      departments={uniqueDepartments}
      totalDoctors={totalDoctors}
      currentPage={page}
      totalPages={totalPages}
      currentLimit={limit}
      currentSearch={search}
      currentDepartmentId={departmentId}
      currentStatus={status}
    />
  );
}
