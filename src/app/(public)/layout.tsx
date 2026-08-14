import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import FloatingActionDock from '@/components/public/FloatingActionDock';
import { getActiveHospitalProfile } from '@/features/cms/queries/hospital';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const profile = await getActiveHospitalProfile();

  return (
    <div className="flex min-h-screen flex-col relative">
      <SiteHeader profile={profile} />
      <main className="flex-1">{children}</main>
      <SiteFooter profile={profile} />
      <FloatingActionDock emergencyPhone={profile?.emergencyPhone} />
    </div>
  );
}
