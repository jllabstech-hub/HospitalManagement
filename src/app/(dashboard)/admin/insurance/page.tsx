import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import InsurancePartnerManagement from '@/features/insurance/components/InsurancePartnerManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminInsurancePage() {
  const admin = await requireAdmin();
  const records = await prisma.insurancePartner.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Insurance & Cashless Support"
        description="Manage empanelled insurers and TPA partners shown on the public insurance page."
        frontendPath="/insurance"
      />
      <InsurancePartnerManagement initialData={records} />
    </div>
  );
}
