import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { getActiveHospitalProfile } from '@/features/cms/queries/hospital';
import FooterSettingsForm from '@/features/cms/components/FooterSettingsForm';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { parseFooterConfig } from '@/features/cms/footer-config';

export default async function AdminFooterCmsPage() {
  await requireAdmin();
  const profile = await getActiveHospitalProfile();
  const footerConfig = parseFooterConfig(profile?.footerConfig, profile?.hospitalName);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Website Footer"
        description="Edit the public footer: contact details, hours, social links, navigation columns, and legal links."
        frontendPath="/"
      >
        <Link href="/admin/content" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to Content
        </Link>
      </AdminPageHeader>

      <FooterSettingsForm
        initial={{
          legalName: profile?.legalName || '',
          phone: profile?.phone || '',
          emergencyPhone: profile?.emergencyPhone || '',
          email: profile?.email || '',
          addressLine1: profile?.addressLine1 || '',
          addressLine2: profile?.addressLine2 || '',
          city: profile?.city || '',
          state: profile?.state || '',
          postalCode: profile?.postalCode || '',
          workingHours: profile?.workingHours || '',
          facebookUrl: profile?.facebookUrl || '',
          twitterUrl: profile?.twitterUrl || '',
          instagramUrl: profile?.instagramUrl || '',
          linkedinUrl: profile?.linkedinUrl || '',
          footerConfig,
        }}
      />
    </div>
  );
}
