import { getDashboardAnalytics } from '@/features/analytics/actions';
import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard';

export const metadata = {
  title: 'Hospital Analytics | Admin Dashboard',
};

export default async function AdminAnalyticsPage() {
  const data = await getDashboardAnalytics();

  return (
    <div className="mx-auto max-w-7xl">
      <AnalyticsDashboard kpis={data.kpis} charts={data.charts} />
    </div>
  );
}
