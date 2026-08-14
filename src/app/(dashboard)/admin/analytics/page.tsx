import { getDashboardAnalytics } from '@/features/analytics/actions';
import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export const metadata = {
  title: 'Hospital Analytics | Admin Dashboard',
};

export default async function AdminAnalyticsPage() {
  const data = await getDashboardAnalytics();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminPageHeader
        title="Hospital Analytics & System Reporting"
        description="Comprehensive real-time metrics, appointment completion rates, doctor loads, and patient growth analytics."
        frontendPath="/"
      />
      <AnalyticsDashboard kpis={data.kpis} charts={data.charts} />
    </div>
  );
}
