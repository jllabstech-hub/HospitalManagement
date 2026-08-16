import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import SpecialityManagement from '@/features/specialities/components/SpecialityManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Prisma } from '@prisma/client';
import { buildFuzzySpecialityWhere } from '@/lib/fuzzy-search';

const PAGE_SIZES = [6, 9, 12, 24, 48];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    limit?: string;
  }>;
}

export default async function AdminSpecialityPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1);
  const search = resolvedParams.search?.trim() || '';
  const requestedLimit = parseInt(resolvedParams.limit || '12', 10);
  const limit = PAGE_SIZES.includes(requestedLimit) ? requestedLimit : 12;

  const whereCondition: Prisma.SpecialityWhereInput = {
    tenantId: admin.tenantId,
    ...buildFuzzySpecialityWhere(search),
  };

  const rawRecords = await prisma.speciality.findMany({
    where: whereCondition,
    orderBy: { name: 'asc' },
  });

  const seen = new Set<string>();
  const records = rawRecords.filter((rec) => {
    const key = rec.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const totalSpecialities = records.length;
  const totalPages = Math.ceil(totalSpecialities / limit) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = records.slice((currentPage - 1) * limit, currentPage * limit);
  const missingCount = records.filter((record) => !record.imageUrl?.trim()).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Medical Specialities"
        description="Supervise medical specialties and clinical sub-disciplines."
        frontendPath="/specialities"
      />
      <SpecialityManagement
        initialData={paginatedRecords}
        currentPage={currentPage}
        totalPages={totalPages}
        totalSpecialities={totalSpecialities}
        currentSearch={search}
        currentLimit={limit}
        missingCount={missingCount}
      />
    </div>
  );
}
