import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import SuccessStoryManagement from '@/features/success-stories/components/SuccessStoryManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminSuccessStoryPage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.successStory.findMany({
    where: { tenantId: admin.tenantId },
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
        title="Patient Success Stories"
        description="Share inspiring patient recovery experiences and clinical outcomes."
        frontendPath="/success-stories"
      />
      <SuccessStoryManagement initialData={records} />
    </div>
  );
}
