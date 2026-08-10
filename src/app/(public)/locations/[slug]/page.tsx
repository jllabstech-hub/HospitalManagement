import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getLocationBySlug, getPublishedLocations } from '@/features/cms/queries/hospital';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const locations = await getPublishedLocations();
  return locations.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const loc = await getLocationBySlug(slug);
  if (!loc) return { title: 'Location not found' };
  return {
    title: loc.seoTitle ?? `${loc.name} · ${APP_CONFIG.appName}`,
    description: loc.seoDescription ?? `${loc.name} — ${loc.city ?? 'hospital location'}.`,
  };
}

export default async function LocationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const loc = await getLocationBySlug(slug);
  if (!loc) notFound();

  return (
    <>
      <PageHero eyebrow="Location" title={loc.name} subtitle={loc.city ?? undefined} />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Locations', href: '/locations' },
              { label: loc.name },
            ]}
            className="mb-8"
          />

          <div className="card-surface space-y-4 p-6 sm:p-8">
            <div>
              <h2 className="text-sm font-semibold text-ink">Address</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {[loc.address, loc.city, loc.state, loc.postalCode].filter(Boolean).join(', ')}
              </p>
            </div>
            {loc.phone && (
              <div>
                <h2 className="text-sm font-semibold text-ink">Phone</h2>
                <p className="mt-1 text-sm text-ink-muted">{loc.phone}</p>
              </div>
            )}
            {loc.emergencyPhone && (
              <div>
                <h2 className="text-sm font-semibold text-ink">Emergency</h2>
                <p className="mt-1 text-sm text-ink-muted">{loc.emergencyPhone}</p>
              </div>
            )}
            {loc.email && (
              <div>
                <h2 className="text-sm font-semibold text-ink">Email</h2>
                <a href={`mailto:${loc.email}`} className="mt-1 text-sm text-brand-700">
                  {loc.email}
                </a>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {loc.directionsUrl && (
                <a
                  href={loc.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Get directions
                </a>
              )}
              {loc.mapUrl && (
                <a
                  href={loc.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View map
                </a>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Link href="/locations" className="btn-secondary">
              ← All locations
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
