import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import FaqItemManagement from '@/features/faqs/components/FaqItemManagement';

export default async function AdminFaqItemPage() {
  const admin = await requireAdmin();
  const records = await prisma.faqItem.findMany({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage FaqItems</h1>
      </div>
      <FaqItemManagement initialData={records} />
    </div>
  );
}
