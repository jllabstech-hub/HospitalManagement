import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import SuccessStoryManagement from '@/features/success-stories/components/SuccessStoryManagement';

export default async function AdminSuccessStoryPage() {
  const admin = await requireAdmin();
  const records = await prisma.successStory.findMany({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage SuccessStorys</h1>
      </div>
      <SuccessStoryManagement initialData={records} />
    </div>
  );
}
