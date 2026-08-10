import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { getAdminAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    department?: string;
    doctor?: string;
    status?: string;
    date?: string;
  }>;
}

export default async function AdminAppointmentsMasterPage({ searchParams }: PageProps) {
  await requireAdmin();
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || '1', 10);
  const limit = Math.max(1, parseInt(resolvedParams.limit || '10', 10));
  const search = resolvedParams.search || '';
  const departmentId = resolvedParams.department || '';
  const doctorId = resolvedParams.doctor || '';
  const statusFilter = resolvedParams.status || '';
  const dateStr = resolvedParams.date || '';

  const [departments, doctors, result] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.doctorProfile.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
    getAdminAppointments({
      page,
      limit,
      search,
      departmentId,
      doctorId,
      status: statusFilter,
      dateStr,
    }),
  ]);

  const { appointments, totalCount, currentPage, totalPages } = result;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Admin Appointments Master Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          System-wide appointment supervision, filtering, and audit log.
        </p>
      </div>

      {/* Filter Form */}
      <form method="GET" action="/admin/appointments" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Interactive Search Input */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Interactive Search (Patient / Doctor / Reason)
            </label>
            <InteractiveSearchInput
              placeholder="Type patient, doctor name or reason..."
              defaultValue={search}
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <label htmlFor="adminDeptFilter" className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <select
              id="adminDeptFilter"
              name="department"
              defaultValue={departmentId}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div className="md:col-span-3">
            <label htmlFor="adminDoctorFilter" className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor
            </label>
            <select
              id="adminDoctorFilter"
              name="doctor"
              defaultValue={doctorId}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <label htmlFor="adminStatusFilter" className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              id="adminStatusFilter"
              name="status"
              defaultValue={statusFilter}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>

          {/* Entries per page */}
          <div className="md:col-span-2">
            <label htmlFor="adminLimitFilter" className="block text-xs font-semibold text-slate-700 mb-1">
              Entries per page
            </label>
            <select
              id="adminLimitFilter"
              name="limit"
              defaultValue={limit}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
            >
              <option value="5">5 entries</option>
              <option value="10">10 entries</option>
              <option value="15">15 entries</option>
              <option value="20">20 entries</option>
              <option value="50">50 entries</option>
            </select>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
            >
              Filter / Search
            </button>
          </div>
        </div>

        {(search || departmentId || doctorId || statusFilter || dateStr) && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Found <strong className="text-slate-800">{totalCount}</strong> matching appointments
            </span>
            <Link href="/admin/appointments" className="text-purple-600 font-semibold hover:underline">
              Reset Filters
            </Link>
          </div>
        )}
      </form>

      {/* Appointments Table */}
      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <div className="text-4xl">🔍</div>
          <h3 className="text-base font-bold text-slate-700">No Appointments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No system appointments match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Doctor Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {a.dateStr} <span className="text-slate-400 font-normal">({formatTimeTo12Hour(a.startTime)})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{a.patient.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-700">{a.doctor.fullName}</td>
                    <td className="py-3.5 px-4 text-purple-700 font-semibold">{a.doctor.department.name}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/appointments/${a.id}`}
                        className="text-purple-600 hover:underline font-bold"
                      >
                        View Detail →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {appointments.length > 0 && (
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
              <div>
                Showing Page <span className="text-slate-800">{currentPage}</span> of{' '}
                <span className="text-slate-800">{totalPages}</span> ({totalCount} total)
              </div>
              <div className="flex space-x-2">
                {currentPage > 1 && (
                  <Link
                    href={`/admin/appointments?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&doctor=${encodeURIComponent(doctorId)}&status=${encodeURIComponent(statusFilter)}&limit=${limit}&page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg"
                  >
                    ← Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/admin/appointments?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&doctor=${encodeURIComponent(doctorId)}&status=${encodeURIComponent(statusFilter)}&limit=${limit}&page=${currentPage + 1}`}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
