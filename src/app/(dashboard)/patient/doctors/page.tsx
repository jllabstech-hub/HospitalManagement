import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPublicDepartments, searchDoctors } from '@/features/doctors/queries';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';
import DoctorCard from '@/components/doctors/DoctorCard';
import EmptyState from '@/components/ui/EmptyState';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: 'Find a Doctor',
  description: `Search ${APP_CONFIG.shortName} specialists by name or department and book a 30-minute consultation.`,
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

  const { doctors, totalCount, currentPage, totalPages } = doctorSearchResult;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Doctor directory</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          Find a Doctor
        </h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Find the Right Doctor — search by specialty, department, or name, then book a
          30-minute consultation.
        </p>
      </div>

      <form
        method="GET"
        action="/patient/doctors"
        className="card-surface space-y-4 p-5 sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-semibold text-ink">
              Interactive Search (Doctor / Specialization / Keyword)
            </label>
            <InteractiveSearchInput
              placeholder="Type doctor name, specialty, qualification..."
              defaultValue={search}
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="deptFilter" className="mb-1 block text-xs font-semibold text-ink">
              Medical Department
            </label>
            <select
              id="deptFilter"
              name="department"
              defaultValue={departmentId}
              className="input-field"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end md:col-span-2">
            <button type="submit" className="btn-primary w-full">
              Search
            </button>
          </div>
        </div>

        {(search || departmentId) && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-ink-muted">
              Found <strong className="text-ink">{totalCount}</strong> matching{' '}
              {totalCount === 1 ? 'doctor' : 'doctors'}
            </span>
            <Link href="/patient/doctors" className="font-semibold text-brand-700 hover:underline">
              Reset Filters
            </Link>
          </div>
        )}
      </form>

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
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      )}

      {doctors.length > 0 && (
        <div className="card-surface flex items-center justify-between p-4 text-xs font-semibold">
          <div>
            Showing Page <span className="text-ink">{currentPage}</span> of{' '}
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
