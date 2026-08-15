import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPublicDepartments, searchDoctors } from '@/features/doctors/queries';
import PatientDoctorSearchFilters from '@/components/shared/PatientDoctorSearchFilters';
import DoctorCard from '@/components/doctors/DoctorCard';
import EmptyState from '@/components/ui/EmptyState';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: 'Find a Doctor',
  description: `Search ${APP_CONFIG.shortName} specialists by name or department and book a consultation.`,
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    department?: string;
    page?: string;
  }>;
}

export default async function FindDoctorPage({ searchParams }: PageProps) {
  await requirePatient();

  const resolvedParams = await searchParams;
  const search = resolvedParams.search || '';
  const departmentId = resolvedParams.department || '';
  const page = parseInt(resolvedParams.page || '1', 10);

  const [departments, doctorSearchResult] = await Promise.all([
    getPublicDepartments(),
    searchDoctors({
      search,
      departmentId,
      page,
      limit: 12,
    }),
  ]);

  const { doctors, currentPage, totalPages, totalCount } = doctorSearchResult;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Doctor directory</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          Find a Doctor
        </h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Find the Right Doctor — search by specialty, department, or name, then book a
          consultation.
        </p>
      </div>

      <PatientDoctorSearchFilters
        departments={departments}
        currentSearch={search}
        currentDepartment={departmentId}
      />

      {doctors.length === 0 ? (
        <EmptyState
          title="No Doctors Found"
          description="We couldn't find any active doctors matching your search criteria. Try adjusting your search keyword or department filter."
          actionHref="/patient/doctors"
          actionLabel="View All Doctors"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              href={`/patient/doctors/${doc.id}`}
              bookHref={`/patient/doctors/${doc.id}`}
            />
          ))}
        </div>
      )}

      {doctors.length > 0 && (
        <div className="card-surface flex items-center justify-between p-4 text-xs font-semibold">
          <div>
            Found <span className="text-ink">{totalCount}</span> matching doctors · Showing Page{' '}
            <span className="text-ink">{currentPage}</span> of{' '}
            <span className="text-ink">{totalPages}</span>
          </div>
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <Link
                href={`/patient/doctors?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&page=${currentPage - 1}`}
                className="btn-secondary"
              >
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/patient/doctors?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&page=${currentPage + 1}`}
                className="btn-primary"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
