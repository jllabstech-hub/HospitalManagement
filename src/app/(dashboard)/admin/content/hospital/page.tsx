import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { getActiveHospitalProfile } from '@/features/cms/queries/hospital';
import HospitalProfileForm from '@/features/cms/components/HospitalProfileForm';

export default async function AdminHospitalProfilePage() {
  await requireAdmin();
  const profile = await getActiveHospitalProfile();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Hospital Profile</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Edit the public hospital identity, contact details, and mission content.
          </p>
        </div>
        <Link href="/admin/content" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to Content
        </Link>
      </div>

      <HospitalProfileForm
        profile={
          profile
            ? {
                id: profile.id,
                hospitalName: profile.hospitalName,
                legalName: profile.legalName ?? '',
                shortDescription: profile.shortDescription ?? '',
                fullDescription: profile.fullDescription ?? '',
                tagline: profile.tagline ?? '',
                phone: profile.phone ?? '',
                emergencyPhone: profile.emergencyPhone ?? '',
                email: profile.email ?? '',
                addressLine1: profile.addressLine1 ?? '',
                addressLine2: profile.addressLine2 ?? '',
                city: profile.city ?? '',
                state: profile.state ?? '',
                postalCode: profile.postalCode ?? '',
                country: profile.country ?? '',
                timezone: profile.timezone ?? '',
                websiteUrl: profile.websiteUrl ?? '',
                workingHours: profile.workingHours ?? '',
                mission: profile.mission ?? '',
                vision: profile.vision ?? '',
                values: profile.values ?? '',
                heroImageUrl: profile.heroImageUrl ?? '',
                logoUrl: profile.logoUrl ?? '',
              }
            : null
        }
      />
    </div>
  );
}
