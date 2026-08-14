import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getActiveHospitalProfile } from '@/features/cms/queries/hospital';
import { APP_CONFIG } from '@/config';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getActiveHospitalProfile();
  return {
    title: `About ${profile?.hospitalName ?? APP_CONFIG.appName}`,
    description:
      profile?.shortDescription ??
      `Learn about ${APP_CONFIG.appName} — outpatient excellence, specialist care, and patient-centred scheduling.`,
  };
}

export default async function AboutOverviewPage() {
  const profile = await getActiveHospitalProfile();

  return (
    <>
      <PageHero
        eyebrow="About us"
        title={profile?.hospitalName ?? APP_CONFIG.appName}
        subtitle={
          profile?.tagline ??
          profile?.shortDescription ??
          'A modern home for outpatient excellence in Bengaluru.'
        }
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Overview' },
            ]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-surface p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-ink">Our Story & Medical Heritage</h2>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  {profile?.fullDescription ??
                    profile?.shortDescription ??
                    `${APP_CONFIG.appName} brings together specialist clinics, thoughtful scheduling, and a secure patient portal — so every outpatient visit feels organized from the first click to the consultation room.`}
                </p>
              </div>

              {(profile?.mission || profile?.vision || profile?.values) && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {profile.mission && (
                    <div className="card-surface p-6">
                      <h3 className="font-semibold text-ink">Mission</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{profile.mission}</p>
                    </div>
                  )}
                  {profile.vision && (
                    <div className="card-surface p-6">
                      <h3 className="font-semibold text-ink">Vision</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{profile.vision}</p>
                    </div>
                  )}
                  {profile.values && (
                    <div className="card-surface p-6">
                      <h3 className="font-semibold text-ink">Core Values</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{profile.values}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <nav className="card-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">About</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/about/overview" className="font-medium text-brand-700">
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link href="/about/leadership" className="text-ink-muted hover:text-brand-700">
                      Leadership
                    </Link>
                  </li>
                  <li>
                    <Link href="/about/facilities" className="text-ink-muted hover:text-brand-700">
                      Facilities
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="card-surface p-4 text-sm text-ink-muted">
                <p className="font-semibold text-ink">Quick links</p>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/doctors" className="text-brand-700 hover:underline">
                      Find a doctor
                    </Link>
                  </li>
                  <li>
                    <Link href="/book-appointment" className="text-brand-700 hover:underline">
                      Book appointment
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations" className="text-brand-700 hover:underline">
                      Locations
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
