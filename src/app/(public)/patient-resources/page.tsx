import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedResources } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Patient Resources · ${APP_CONFIG.appName}`,
  description: `Guides, forms, and resources for patients at ${APP_CONFIG.appName}.`,
};

export default async function PatientResourcesPage() {
  const resources = await getPublishedResources();

  return (
    <>
      <PageHero
        eyebrow="Patient support"
        title="Patient resources"
        subtitle="Downloadable guides, visit preparation tips, and helpful links for outpatient care."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Patient Resources' }]}
            className="mb-8"
          />

          <div className="mb-8 flex flex-wrap gap-3">
            <Link href="/patient-resources/faq" className="btn-secondary">
              Frequently asked questions
            </Link>
            <Link href="/book-appointment" className="btn-primary">
              Book appointment
            </Link>
          </div>

          {resources.length === 0 ? (
            <EmptyState
              title="No resources published yet"
              description="Patient guides and downloadable resources will appear here once added."
              actionHref="/patient-resources/faq"
              actionLabel="View FAQs"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.map((resource) => (
                <Card key={resource.id} className="flex items-start justify-between gap-4">
                  <div>
                    {resource.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                        {resource.category}
                      </span>
                    )}
                    <h2 className="mt-1 font-semibold text-ink">{resource.title}</h2>
                    {resource.description && (
                      <p className="mt-1 text-sm text-ink-muted">{resource.description}</p>
                    )}
                  </div>
                  {resource.fileUrl && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-sm font-semibold text-brand-700"
                    >
                      Download
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
