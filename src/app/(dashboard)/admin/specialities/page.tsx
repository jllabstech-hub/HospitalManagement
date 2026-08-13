import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import SpecialityManagement from '@/features/specialities/components/SpecialityManagement';

export default async function AdminSpecialityPage() {
  const admin = await requireAdmin();
  const records = await prisma.speciality.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage Specialitys</h1>
      </div>
      <SpecialityManagement initialData={records} />
    </div>
  );
}
