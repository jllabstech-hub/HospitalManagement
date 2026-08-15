import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import LeadershipManagement from '@/features/leadership/components/LeadershipManagement';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminLeadershipPage() {
  const admin = await requireAdmin();
  const records = await prisma.leadershipMember.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Leadership & Management"
        description="Publish medical directors and operational leaders shown under About Us."
        frontendPath="/about/leadership"
      />
      <LeadershipManagement initialData={records} />
    </div>
  );
}
