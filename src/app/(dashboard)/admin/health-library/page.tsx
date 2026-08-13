import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import HealthArticleManagement from '@/features/health-library/components/HealthArticleManagement';

export default async function AdminHealthArticlePage() {
  const admin = await requireAdmin();
  const records = await prisma.healthArticle.findMany({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage HealthArticles</h1>
      </div>
      <HealthArticleManagement initialData={records} />
    </div>
  );
}
