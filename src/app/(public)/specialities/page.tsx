import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import CmsRecordImage from '@/components/cms/CmsRecordImage';
import { getPublishedSpecialities } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Specialities · ${APP_CONFIG.appName}`,
  description: `Explore clinical specialities available at ${APP_CONFIG.appName}.`,
};

export default async function SpecialitiesPage() {
  const specialities = await getPublishedSpecialities();

  return (
    <>
      <PageHero
        eyebrow="Clinical care"
        title="Medical specialities"
        subtitle="Focused outpatient programmes organised by speciality and linked to specialist consultants."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Specialities' }]}
            className="mb-8"
          />

          {specialities.length === 0 ? (
            <EmptyState
              title="No specialities published yet"
              description="Speciality listings will appear here once added to the CMS."
              actionHref="/departments"
              actionLabel="Browse departments"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {specialities.map((spec) => (
                <Card key={spec.id} hover padding="none" className="flex h-full flex-col overflow-hidden">
                  <CmsRecordImage src={spec.imageUrl} fallbackTitle={spec.name} alt={`${spec.name} and specialist care`} className="rounded-t-card" />
                  <div className="flex h-full flex-col p-6">
                  {spec.department && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                      {spec.department.name}
                    </span>
                  )}
                  <h2 className="mt-2 text-lg font-semibold text-ink">{spec.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">
                    {spec.shortDescription ?? 'Specialist outpatient consultations.'}
                  </p>
                  <Link
                    href={`/specialities/${spec.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    Learn more →
                  </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
