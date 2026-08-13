import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import ServiceManagement from '@/features/services/components/ServiceManagement';

export default async function AdminServicePage() {
  const admin = await requireAdmin();
  const records = await prisma.hospitalService.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage Services</h1>
      </div>
      <ServiceManagement initialData={records} />
    </div>
  );
}
