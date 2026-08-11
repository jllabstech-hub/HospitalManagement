import type { Metadata } from 'next';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedFacilities } from '@/features/cms/queries/hospital';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Facilities · ${APP_CONFIG.appName}`,
  description: `Explore hospital facilities and infrastructure at ${APP_CONFIG.appName}.`,
};

export default async function FacilitiesPage() {
  const facilities = await getPublishedFacilities();

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Hospital facilities"
        subtitle="Modern outpatient infrastructure designed for comfort, safety, and efficient specialist care."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Facilities' },
            ]}
            className="mb-8"
          />

          {facilities.length === 0 ? (
            <EmptyState
              title="No facilities published"
              description="Published facility descriptions will appear here when available from the hospital content library."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <Card key={facility.id} className="flex h-full flex-col">
                  {facility.category && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                      {facility.category}
                    </span>
                  )}
                  <h2 className="mt-2 text-lg font-semibold text-ink">{facility.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-muted">
                    {facility.description ?? 'Facility details available on request.'}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
