import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import ServiceManagement from '@/features/services/components/ServiceManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminServicePage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.hospitalService.findMany({
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
        title="Hospital Services"
        description="Manage clinical and diagnostic services offered across hospital departments."
        frontendPath="/services"
      />
      <ServiceManagement initialData={records} />
    </div>
  );
}
