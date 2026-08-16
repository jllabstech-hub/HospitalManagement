import { requireAdmin } from '@/server/security/auth-helpers';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ContentImportClient from '@/features/content-import/components/ContentImportClient';

export default async function AdminContentImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Populate Hospital Content"
        description="Crawl this hospital's existing public website and import CMS content. Doctors are managed separately."
        frontendPath="/departments"
      />
      <ContentImportClient />
    </div>
  );
}
