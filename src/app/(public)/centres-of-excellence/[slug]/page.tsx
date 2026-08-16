import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import CmsRecordImage from '@/components/cms/CmsRecordImage';
import { getCentreBySlug } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Host-based multi-tenancy: slugs are resolved at request time.
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const centre = await getCentreBySlug(slug);
  if (!centre) return { title: 'Centre not found' };
  return {
    title: centre.seoTitle ?? `${centre.name} · ${APP_CONFIG.appName}`,
    description:
      centre.seoDescription ?? centre.shortDescription ?? `${centre.name} centre of excellence.`,
  };
}

export default async function CentreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const centre = await getCentreBySlug(slug);
  if (!centre) notFound();

  const doctors = centre.doctors.map((d) => d.doctor);
  const specialities = centre.specialities.map((s) => s.speciality);
  const services = centre.services.map((s) => s.service);

  return (
    <>
      <PageHero
        eyebrow="Centre of excellence"
        title={centre.name}
        subtitle={centre.shortDescription ?? undefined}
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Centres of Excellence', href: '/centres-of-excellence' },
              { label: centre.name },
            ]}
            className="mb-8"
          />

          <CmsRecordImage
            src={centre.heroImageUrl}
            fallbackTitle={centre.name}
            alt={`${centre.name} centre of excellence`}
            className="mb-8 rounded-card border border-[#dde5e9]"
          />

          {(centre.fullDescription || centre.clinicalFocus) && (
            <div className="card-surface mb-10 space-y-4 p-6 sm:p-8">
              {centre.fullDescription && (
                <p className="text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                  {centre.fullDescription}
                </p>
              )}
              {centre.clinicalFocus && (
                <div>
                  <h2 className="text-sm font-semibold text-ink">Clinical focus</h2>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                    {centre.clinicalFocus}
                  </p>
                </div>
              )}
            </div>
          )}

          {specialities.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-xl font-semibold text-ink">Specialities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {specialities.map((spec) => (
                  <Link
                    key={spec.id}
                    href={`/specialities/${spec.slug}`}
                    className="rounded-pill bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800"
                  >
                    {spec.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-xl font-semibold text-ink">Services</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((svc) => (
                  <Card key={svc.id} padding="sm">
                    <Link href={`/services/${svc.slug}`} className="font-medium text-brand-700">
                      {svc.name}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-display text-xl font-semibold text-ink">Consultants</h2>
          {doctors.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="No consultants listed"
              description="Doctors associated with this centre will appear here once published."
            />
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={{
                    id: doc.id,
                    fullName: doc.publicDisplayName ?? doc.fullName,
                    qualification: doc.qualification,
                    experienceYears: doc.experienceYears,
                    department: doc.department,
                  }}
                  href={`/doctors/${doc.slug ?? doc.id}`}
                  bookHref={`/book-appointment?doctorId=${doc.id}`}
                  publicMode
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
