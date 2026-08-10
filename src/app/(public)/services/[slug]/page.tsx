import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import { getServiceBySlug, getPublishedServices } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await getPublishedServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: 'Service not found' };
  return {
    title: service.seoTitle ?? `${service.name} · ${APP_CONFIG.appName}`,
    description: service.seoDescription ?? service.shortDescription ?? service.name,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.name}
        subtitle={service.shortDescription ?? undefined}
      />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: service.name },
            ]}
            className="mb-8"
          />

          <div className="card-surface p-6 sm:p-8">
            {service.fullDescription ? (
              <p className="text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                {service.fullDescription}
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                Detailed service information will be updated soon. Contact our team for outpatient
                scheduling guidance.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book-appointment" className="btn-primary">
              Book appointment
            </Link>
            <Link href="/contact" className="btn-secondary">
              Ask a question
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
