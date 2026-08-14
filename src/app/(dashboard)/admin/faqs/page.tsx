import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import FaqItemManagement from '@/features/faqs/components/FaqItemManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminFaqPage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.faqItem.findMany({
    where: admin.tenantId ? { tenantId: admin.tenantId } : {},
    orderBy: { question: 'asc' },
  });

  const seen = new Set<string>();
  const records = rawRecords.filter((rec) => {
    const key = rec.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Frequently Asked Questions (FAQ)"
        description="Manage patient FAQ items, categorizations, and display ordering."
        frontendPath="/patient-resources/faq"
      />
      <FaqItemManagement initialData={records} />
    </div>
  );
}
