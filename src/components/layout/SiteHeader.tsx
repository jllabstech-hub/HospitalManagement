import Link from 'next/link';
import BrandLogo from './BrandLogo';
import SiteHeaderClient from './SiteHeaderClient';
import { APP_CONFIG } from '@/config';
import { buildTenantNav } from './build-tenant-nav';
import { getPublishedSpecialities, getPublishedCentres } from '@/features/cms/queries/catalog';

interface SiteHeaderProps {
  profile?: {
    hospitalName?: string | null;
    phone?: string | null;
    emergencyPhone?: string | null;
  } | null;
}

/**
 * Public site header — Server Component shell with tenant-scoped navigation.
 */
export default async function SiteHeader({ profile }: SiteHeaderProps) {
  const phone = profile?.phone ?? APP_CONFIG.contact.phone;
  const emergencyPhone = profile?.emergencyPhone ?? APP_CONFIG.contact.emergency;
  const phoneHref = profile?.phone ? `tel:${profile.phone.replace(/[^0-9+]/g, '')}` : APP_CONFIG.contact.phoneHref;

  let specialities: { name: string; slug: string; shortDescription: string | null }[] = [];
  let centres: { name: string; slug: string; shortDescription: string | null }[] = [];
  try {
    const [loadedSpecialities, loadedCentres] = await Promise.all([
      getPublishedSpecialities(),
      getPublishedCentres(),
    ]);
    specialities = loadedSpecialities.map((item) => ({
      name: item.name,
      slug: item.slug,
      shortDescription: item.shortDescription,
    }));
    centres = loadedCentres.map((item) => ({
      name: item.name,
      slug: item.slug,
      shortDescription: item.shortDescription,
    }));
  } catch {
    specialities = [];
    centres = [];
  }

  const navItems = buildTenantNav({
    hospitalName: profile?.hospitalName,
    specialities,
    centres,
  });

  return (
    <SiteHeaderClient
      utilityLeft={`${emergencyPhone} · Outpatient bookings online`}
      utilityPhone={phone}
      utilityPhoneHref={phoneHref}
      navItems={navItems}
      brand={<BrandLogo showTagline={false} size="md" className="min-w-0" />}
      desktopActions={
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-button border border-brand-200/80 bg-brand-50/50 px-4 py-2 text-xs font-bold text-brand-800 transition duration-brand hover:border-brand-300 hover:bg-brand-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            Patient Login
          </Link>
          <Link
            href="/book-appointment"
            className="inline-flex items-center justify-center gap-1.5 rounded-button bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-soft transition duration-brand hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current opacity-90" aria-hidden>
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>Book Appointment</span>
          </Link>
        </div>
      }
    />
  );
}
