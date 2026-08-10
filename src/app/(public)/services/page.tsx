import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedServices } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Services · ${APP_CONFIG.appName}`,
  description: `Outpatient and hospital services at ${APP_CONFIG.appName}.`,
};

export default async function ServicesPage() {
  const services = await getPublishedServices();

  return (
    <>
      <PageHero
        eyebrow="Patient services"
        title="Hospital services"
        subtitle="Outpatient programmes, diagnostics, and support services available through our hospital network."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
            className="mb-8"
          />

          {services.length === 0 ? (
            <EmptyState
              title="No services published yet"
              description="Service listings will appear here once added to the CMS."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc) => (
                <Card key={svc.id} hover className="flex h-full flex-col">
                  <h2 className="text-lg font-semibold text-ink">{svc.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">
                    {svc.shortDescription ?? 'Hospital outpatient service.'}
                  </p>
                  <Link
                    href={`/services/${svc.slug}`}
                    className="mt-4 text-sm font-semibold text-brand-700"
                  >
                    Learn more →
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
