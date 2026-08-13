import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import PatientResourceManagement from '@/features/patient-resources/components/PatientResourceManagement';

export default async function AdminPatientResourcePage() {
  const admin = await requireAdmin();
  const records = await prisma.patientResource.findMany({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage PatientResources</h1>
      </div>
      <PatientResourceManagement initialData={records} />
    </div>
  );
}
