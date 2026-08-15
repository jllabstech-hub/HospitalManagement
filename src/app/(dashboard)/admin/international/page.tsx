import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import InternationalPageForm from '@/features/international/components/InternationalPageForm';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminInternationalPage() {
  const admin = await requireAdmin();
  const content = await prisma.internationalPageContent.findUnique({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="International Patient Desk"
        description="Edit visa assistance, second-opinion, and coordinator copy for international patients."
        frontendPath="/international-patients"
      />
      <InternationalPageForm
        initialData={{
          title: content?.title || 'International patients',
          introduction: content?.introduction || '',
          howToRequest: content?.howToRequest || '',
          secondOpinion: content?.secondOpinion || '',
          requiredDocuments: content?.requiredDocuments || '',
          travelInformation: content?.travelInformation || '',
          accommodationInfo: content?.accommodationInfo || '',
          coordinatorContact: content?.coordinatorContact || '',
        }}
      />
    </div>
  );
}
