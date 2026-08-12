import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import DoctorDirectoryFilters from '@/components/doctors/DoctorDirectoryFilters';
import EmptyState from '@/components/ui/EmptyState';
import { searchPublicDoctors } from '@/features/cms/queries/doctors-public';
import {
  getPublishedDepartments,
  getPublishedSpecialities,
} from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Find a Doctor · ${APP_CONFIG.appName}`,
  description: `Search specialists by name, department, or speciality at ${APP_CONFIG.appName}.`,
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    department?: string;
    speciality?: string;
    page?: string;
  }>;
}

export default async function DoctorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const search = params.search?.trim() ?? '';
  const departmentId = params.department?.trim() ?? '';
  const specialityId = params.speciality?.trim() ?? '';

  const [result, departments, specialities] = await Promise.all([
    searchPublicDoctors({
      search: search || undefined,
      departmentId: departmentId || undefined,
      specialityId: specialityId || undefined,
      page,
      limit: 12,
      sort: 'featured',
    }),
    getPublishedDepartments(),
    getPublishedSpecialities(),
  ]);

  const buildPageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (departmentId) qs.set('department', departmentId);
    if (specialityId) qs.set('speciality', specialityId);
    if (p > 1) qs.set('page', String(p));
    const q = qs.toString();
    return q ? `/doctors?${q}` : '/doctors';
  };

  return (
    <>
      <PageHero
        eyebrow="Find a doctor"
        title="Doctor directory"
        subtitle="Search published specialists by name, department, or speciality. Book a 30-minute outpatient consultation online."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Doctors' }]}
            className="mb-8"
          />

          <DoctorDirectoryFilters
            departments={departments}
            specialities={specialities}
          />

          <p className="mb-6 text-sm text-ink-muted">
            {result.totalCount} specialist{result.totalCount === 1 ? '' : 's'} found
          </p>

          {result.doctors.length === 0 ? (
            <EmptyState
              title="No doctors match your search"
              description="Try adjusting filters or browse all departments."
              actionHref="/departments"
              actionLabel="Browse departments"
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.doctors.map((doc) => (
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

              {result.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  {page > 1 && (
                    <Link href={buildPageHref(page - 1)} className="btn-secondary">
                      ← Previous
                    </Link>
                  )}
                  <span className="text-sm text-ink-muted">
                    Page {result.currentPage} of {result.totalPages}
                  </span>
                  {page < result.totalPages && (
                    <Link href={buildPageHref(page + 1)} className="btn-secondary">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
