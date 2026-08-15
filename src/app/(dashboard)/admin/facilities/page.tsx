import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import FacilityManagement from '@/features/facilities/components/FacilityManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminFacilitiesPage() {
  const admin = await requireAdmin();
  const records = await prisma.facility.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Advanced Facilities"
        description="Manage theatres, ICUs, imaging, and other infrastructure shown on the public facilities page."
        frontendPath="/about/facilities"
      />
      <FacilityManagement initialData={records} />
    </div>
  );
}
