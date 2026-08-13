import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import CentreManagement from '@/features/centres/components/CentreManagement';

export default async function AdminCentrePage() {
  const admin = await requireAdmin();
  const records = await prisma.centreOfExcellence.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage Centres</h1>
      </div>
      <CentreManagement initialData={records} />
    </div>
  );
}
