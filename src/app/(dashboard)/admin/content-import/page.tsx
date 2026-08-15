import { requireAdmin } from '@/server/security/auth-helpers';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ContentImportClient from '@/features/content-import/components/ContentImportClient';

export default async function AdminContentImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Populate Hospital Content"
        description="Crawl a public hospital website and import common CMS content for this hospital. Doctors are managed separately."
        frontendPath="/departments"
      />
      <ContentImportClient />
    </div>
  );
}
