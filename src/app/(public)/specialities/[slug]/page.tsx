import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import {
  getSpecialityBySlug,
} from '@/features/cms/queries/catalog';
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
  const spec = await getSpecialityBySlug(slug);
  if (!spec) return { title: 'Speciality not found' };
  return {
    title: spec.seoTitle ?? `${spec.name} · ${APP_CONFIG.appName}`,
    description: spec.seoDescription ?? spec.shortDescription ?? `${spec.name} speciality care.`,
  };
}

export default async function SpecialityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const spec = await getSpecialityBySlug(slug);
  if (!spec) notFound();

  const doctors = spec.doctors.map((d) => d.doctor);

  return (
    <>
      <PageHero
        eyebrow="Speciality"
        title={spec.name}
        subtitle={spec.shortDescription ?? undefined}
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Specialities', href: '/specialities' },
              { label: spec.name },
            ]}
            className="mb-8"
          />

          {spec.fullDescription && (
            <div className="card-surface mb-10 p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                {spec.fullDescription}
              </p>
            </div>
          )}

          <h2 className="font-display text-xl font-semibold text-ink">Consultants</h2>
          {doctors.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="No consultants listed"
              description="Doctors linked to this speciality will appear here once published."
              actionHref={`/doctors?speciality=${spec.id}`}
              actionLabel="Browse doctors"
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

          {spec.articles.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl font-semibold text-ink">Related articles</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spec.articles.map((article) => (
                  <Card key={article.id} hover>
                    <h3 className="font-semibold text-ink">{article.title}</h3>
                    {article.excerpt && (
                      <p className="mt-2 text-sm text-ink-muted line-clamp-2">{article.excerpt}</p>
                    )}
                    <Link
                      href={`/health-library/${article.slug}`}
                      className="mt-3 inline-block text-sm font-semibold text-brand-700"
                    >
                      Read article →
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
