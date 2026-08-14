import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import PatientResourceManagement from '@/features/patient-resources/components/PatientResourceManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminPatientResourcePage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.patientResource.findMany({
    where: admin.tenantId ? { tenantId: admin.tenantId } : {},
    orderBy: { title: 'asc' },
  });

  const seen = new Set<string>();
  const records = rawRecords.filter((rec) => {
    const key = rec.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Patient Resources & Downloads"
        description="Provide downloadable forms, guidebooks, and patient preparation documents."
        frontendPath="/patient-resources"
      />
      <PatientResourceManagement initialData={records} />
    </div>
  );
}
