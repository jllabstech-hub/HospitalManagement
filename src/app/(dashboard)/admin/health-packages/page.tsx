import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import HealthPackageManagement from '@/features/health-packages/components/HealthPackageManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminHealthPackagePage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.healthPackage.findMany({
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
        title="Health Checkup Packages"
        description="Configure preventive health checkup offerings, inclusions, and pricing."
        frontendPath="/health-packages"
      />
      <HealthPackageManagement initialData={records} />
    </div>
  );
}
