import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import SpecialityManagement from '@/features/specialities/components/SpecialityManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminSpecialityPage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.speciality.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: { name: 'asc' },
  });

  const seen = new Set<string>();
  const records = rawRecords.filter((rec) => {
    const key = rec.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Medical Specialities"
        description="Supervise medical specialties and clinical sub-disciplines."
        frontendPath="/specialities"
      />
      <SpecialityManagement initialData={records} />
    </div>
  );
}
