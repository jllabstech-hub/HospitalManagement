import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import EmptyState from '@/components/ui/EmptyState';
import { getDepartmentBySlug, getPublishedDepartments } from '@/features/cms/queries/catalog';
import { publicPageMetadata } from '@/lib/seo';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const departments = await getPublishedDepartments();
  return departments.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);
  if (!dept) return { title: 'Department not found', robots: { index: false } };
  return publicPageMetadata({
    title: dept.seoTitle ?? `${dept.name} · ${APP_CONFIG.appName}`,
    description:
      dept.seoDescription ?? dept.shortDescription ?? `${dept.name} outpatient department.`,
    path: `/departments/${dept.slug}`,
  });
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);
  if (!dept) notFound();

  return (
    <>
      <PageHero
        eyebrow="Department"
        title={dept.name}
        subtitle={dept.shortDescription ?? dept.description ?? undefined}
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Departments', href: '/departments' },
              { label: dept.name },
            ]}
            className="mb-8"
          />

          {dept.fullDescription && (
            <div className="card-surface mb-10 p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                {dept.fullDescription}
              </p>
            </div>
          )}

          <h2 className="font-display text-xl font-semibold text-ink">
            Doctors in {dept.name}
            {dept._count?.doctors != null && (
              <span className="ml-2 text-base font-normal text-ink-muted">
                ({dept._count.doctors})
              </span>
            )}
          </h2>

          {dept.doctors.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="No doctors listed yet"
              description="Specialists for this department will appear here once published."
              actionHref={`/doctors?department=${dept.id}`}
              actionLabel="Browse all doctors"
            />
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dept.doctors.map((doc) => (
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

          <div className="mt-10 rounded-card border border-brand-100 bg-brand-50/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Ready to consult a {dept.name} specialist?
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Choose a doctor in {dept.name} and pick a live 30-minute OPD consultation slot.
              </p>
            </div>
            <Link
              href={`/book-appointment?department=${dept.id}&step=doctors`}
              className="btn-primary shrink-0 shadow-soft"
            >
              Book Appointment in {dept.name} →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
