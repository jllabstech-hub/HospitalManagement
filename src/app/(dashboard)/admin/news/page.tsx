import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import NewsArticleManagement from '@/features/news/components/NewsArticleManagement';

export default async function AdminNewsArticlePage() {
  const admin = await requireAdmin();
  const records = await prisma.newsArticle.findMany({
    where: { tenantId: admin.tenantId },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage NewsArticles</h1>
      </div>
      <NewsArticleManagement initialData={records} />
    </div>
  );
}
