import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedLocations } from '@/features/cms/queries/hospital';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Locations · ${APP_CONFIG.appName}`,
  description: `Hospital locations and directions for ${APP_CONFIG.appName}.`,
};

export default async function LocationsPage() {
  const locations = await getPublishedLocations();

  return (
    <>
      <PageHero
        eyebrow="Visit us"
        title="Hospital locations"
        subtitle="Outpatient campuses and clinic locations across our hospital network."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Locations' }]}
            className="mb-8"
          />

          {locations.length === 0 ? (
            <EmptyState
              title="No locations published yet"
              description={`Visit us at ${APP_CONFIG.contact.address} or contact our main desk.`}
              actionHref="/contact"
              actionLabel="Contact us"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {locations.map((loc) => (
                <Card key={loc.id} hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-ink">{loc.name}</h2>
                    {loc.isPrimary && (
                      <span className="rounded-pill bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex-1 text-sm text-ink-muted">
                    {[loc.address, loc.city, loc.state, loc.postalCode].filter(Boolean).join(', ')}
                  </p>
                  {loc.phone && <p className="mt-2 text-sm text-ink">{loc.phone}</p>}
                  <Link
                    href={`/locations/${loc.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    View details →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
