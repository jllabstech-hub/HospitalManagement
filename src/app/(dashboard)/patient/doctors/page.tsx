import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPublicDepartments, searchDoctors } from '@/features/doctors/queries';

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
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Find a Doctor</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search doctors by specialty, department, or name.
        </p>
      </div>

      {/* Search & Filter Form */}
      <form method="GET" action="/patient/doctors" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="md:col-span-6">
            <label htmlFor="searchInput" className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor Name or Specialization
            </label>
            <input
              id="searchInput"
              type="text"
              name="search"
              defaultValue={search}
              placeholder="e.g. Smith, Cardiology, MBBS"
              className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-4">
            <label htmlFor="deptFilter" className="block text-xs font-semibold text-slate-700 mb-1">
              Medical Department
            </label>
            <select
              id="deptFilter"
              name="department"
              defaultValue={departmentId}
              className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition"
            >
              Search
            </button>
          </div>
        </div>

        {(search || departmentId) && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Found <strong className="text-slate-800">{totalCount}</strong> matching {totalCount === 1 ? 'doctor' : 'doctors'}
            </span>
            <Link href="/patient/doctors" className="text-blue-600 font-semibold hover:underline">
              Reset Filters
            </Link>
          </div>
        )}
      </form>

      {/* Doctor Grid */}
      {doctors.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-base font-bold text-slate-700">No Doctors Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn&apos;t find any active doctors matching your search criteria. Try adjusting your search keyword or department filter.
          </p>
          <div className="pt-2">
            <Link
              href="/patient/doctors"
              className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              View All Doctors
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between p-6"
            >
              <div>
                {/* Department Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {doc.department.name}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {doc.experienceYears} Yrs Exp.
                  </span>
                </div>

                {/* Doctor Name & Qualification */}
                <h3 className="text-base font-bold text-slate-800">{doc.fullName}</h3>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{doc.qualification}</p>

                {/* Short Bio */}
                <p className="text-xs text-slate-500 mt-3 line-clamp-3 leading-relaxed">
                  {doc.bio || 'Experienced specialist available for outpatient consultations.'}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  30-Min Consults
                </span>
                <Link
                  href={`/patient/doctors/${doc.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  View Profile & Book →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
          <div>
            Showing Page <span className="text-slate-800">{currentPage}</span> of{' '}
            <span className="text-slate-800">{totalPages}</span>
          </div>
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <Link
                href={`/patient/doctors?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&page=${currentPage - 1}`}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/patient/doctors?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&page=${currentPage + 1}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
