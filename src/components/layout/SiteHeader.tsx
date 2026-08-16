import Link from 'next/link';
import BrandLogo from './BrandLogo';
import SiteHeaderClient from './SiteHeaderClient';
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
      navItems={navItems}
      brand={<BrandLogo stacked size="md" className="min-w-0" />}
      desktopActions={
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-brand-800/80 bg-transparent px-4 py-2 text-[13px] font-medium text-brand-900 transition hover:bg-white 2xl:px-5 2xl:py-2.5 2xl:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Patient Login
          </Link>
          <Link
            href="/book-appointment"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-800 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-900 2xl:px-5 2xl:py-2.5 2xl:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            Book Appointment
          </Link>
        </div>
      }
    />
  );
}
