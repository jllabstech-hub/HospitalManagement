import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import NewsArticleManagement from '@/features/news/components/NewsArticleManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminNewsPage() {
  const admin = await requireAdmin();
  const rawRecords = await prisma.newsArticle.findMany({
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
        title="Hospital News & Announcements"
        description="Publish authoritative hospital press releases, achievements, and announcements."
        frontendPath="/news"
      />
      <NewsArticleManagement initialData={records} />
    </div>
  );
}
