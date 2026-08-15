import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import CentreManagement from '@/features/centres/components/CentreManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminCentrePage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.centreOfExcellence.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: { name: 'asc' },
  });

  // Deduplicate records by name
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
        title="Centres of Excellence"
        description="Provision and manage specialized clinical centres of excellence."
        frontendPath="/centres-of-excellence"
      />
      <CentreManagement initialData={records} />
    </div>
  );
}
