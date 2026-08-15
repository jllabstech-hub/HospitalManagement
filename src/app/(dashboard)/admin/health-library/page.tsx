import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import HealthArticleManagement from '@/features/health-library/components/HealthArticleManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminHealthArticlePage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.healthArticle.findMany({
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
        title="Health Library & Patient Education"
        description="Publish and manage medical articles, patient wellness guides, and health tips."
        frontendPath="/health-library"
      />
      <HealthArticleManagement initialData={records} />
    </div>
  );
}
