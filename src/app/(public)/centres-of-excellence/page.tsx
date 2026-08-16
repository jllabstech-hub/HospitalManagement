import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import CmsRecordImage from '@/components/cms/CmsRecordImage';
import { getPublishedCentres } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Centres of Excellence · ${APP_CONFIG.appName}`,
  description: `Explore centres of excellence at ${APP_CONFIG.appName}.`,
};

export default async function CentresPage() {
  const centres = await getPublishedCentres();

  return (
    <>
      <PageHero
        eyebrow="Centres of excellence"
        title="Specialist centres"
        subtitle="Multidisciplinary programmes combining specialities, services, and consultant teams."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Centres of Excellence' }]}
            className="mb-8"
          />

          {centres.length === 0 ? (
            <EmptyState
              title="No centres published yet"
              description="Centres of excellence will appear here once published in the CMS."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {centres.map((centre) => (
                <Card key={centre.id} hover padding="none" className="flex h-full flex-col overflow-hidden">
                  <CmsRecordImage src={centre.heroImageUrl} fallbackTitle={centre.name} alt={`${centre.name} centre of excellence`} className="rounded-t-card" />
                  <div className="flex h-full flex-col p-6">
                  <h2 className="text-lg font-semibold text-ink">{centre.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">
                    {centre.shortDescription ?? 'Coordinated specialist outpatient care.'}
                  </p>
                  <Link
                    href={`/centres-of-excellence/${centre.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    Explore centre →
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
