import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import HealthPackageManagement from '@/features/health-packages/components/HealthPackageManagement';

export default async function AdminHealthPackagePage() {
  const admin = await requireAdmin();
  const records = await prisma.healthPackage.findMany({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage HealthPackages</h1>
      </div>
      <HealthPackageManagement initialData={records} />
    </div>
  );
}
