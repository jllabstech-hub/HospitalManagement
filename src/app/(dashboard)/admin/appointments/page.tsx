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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Admin Appointments Master Directory
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          System-wide appointment supervision, filtering, and audit log.
        </p>
      </div>

      {/* Filter Form */}
      <form method="GET" action="/admin/appointments" className="card-surface space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Interactive Search Input */}
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-semibold text-ink">
              Interactive Search (Patient / Doctor / Reason)
            </label>
            <InteractiveSearchInput
              placeholder="Type patient, doctor name or reason..."
              defaultValue={search}
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <label htmlFor="adminDeptFilter" className="mb-1 block text-xs font-semibold text-ink">
              Department
            </label>
            <select
              id="adminDeptFilter"
              name="department"
              defaultValue={departmentId}
              className="input-field !py-2 text-xs sm:text-sm"
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
            <label htmlFor="adminDoctorFilter" className="mb-1 block text-xs font-semibold text-ink">
              Doctor
            </label>
            <select
              id="adminDoctorFilter"
              name="doctor"
              defaultValue={doctorId}
              className="input-field !py-2 text-xs sm:text-sm"
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
            <label htmlFor="adminStatusFilter" className="mb-1 block text-xs font-semibold text-ink">
              Status
            </label>
            <select
              id="adminStatusFilter"
              name="status"
              defaultValue={statusFilter}
              className="input-field !py-2 text-xs sm:text-sm"
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
            <label htmlFor="adminLimitFilter" className="mb-1 block text-xs font-semibold text-ink">
              Entries per page
            </label>
            <select
              id="adminLimitFilter"
              name="limit"
              defaultValue={limit}
              className="input-field !py-2 text-xs font-medium sm:text-sm"
            >
              <option value="5">5 entries</option>
              <option value="10">10 entries</option>
              <option value="15">15 entries</option>
              <option value="20">20 entries</option>
              <option value="50">50 entries</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-end md:col-span-2">
            <button type="submit" className="btn-primary w-full !py-2 !text-xs sm:!text-sm">
              Filter
            </button>
          </div>
        </div>

        {(search || departmentId || doctorId || statusFilter || dateStr) && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-ink-muted">
              Found <strong className="text-ink">{totalCount}</strong> matching appointments
            </span>
            <Link href="/admin/appointments" className="font-semibold text-brand-700 hover:underline">
              Reset Filters
            </Link>
          </div>
        )}
      </form>

      {/* Appointments Table */}
      {appointments.length === 0 ? (
        <div className="space-y-2 rounded-card border border-dashed border-[#c9d5db] bg-surface-muted p-12 text-center">
          <h3 className="text-base font-semibold text-ink">No Appointments Found</h3>
          <p className="mx-auto max-w-sm text-xs text-ink-muted">
            No system appointments match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#dde5e9] bg-surface-muted font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Patient Name</th>
                  <th className="px-4 py-3.5">Doctor Name</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde5e9]/60 font-medium">
                {appointments.map((a) => (
                  <tr key={a.id} className="transition hover:bg-brand-50/40">
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {a.dateStr}{' '}
                      <span className="font-normal text-ink-soft">({formatTimeTo12Hour(a.startTime)})</span>
                    </td>
                    <td className="px-4 py-3.5 text-ink">{a.patient.fullName}</td>
                    <td className="px-4 py-3.5 text-ink">{a.doctor.fullName}</td>
                    <td className="px-4 py-3.5 font-semibold text-brand-700">{a.doctor.department.name}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/appointments/${a.id}`}
                        className="font-bold text-brand-700 hover:underline"
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
            <div className="flex items-center justify-between border-t border-[#dde5e9] bg-surface-muted p-4 text-xs font-semibold">
              <div className="text-ink-muted">
                Showing Page <span className="text-ink">{currentPage}</span> of{' '}
                <span className="text-ink">{totalPages}</span> ({totalCount} total)
              </div>
              <div className="flex space-x-2">
                {currentPage > 1 && (
                  <Link
                    href={`/admin/appointments?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&doctor=${encodeURIComponent(doctorId)}&status=${encodeURIComponent(statusFilter)}&limit=${limit}&page=${currentPage - 1}`}
                    className="btn-secondary !px-4 !py-2 !text-xs"
                  >
                    ← Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/admin/appointments?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentId)}&doctor=${encodeURIComponent(doctorId)}&status=${encodeURIComponent(statusFilter)}&limit=${limit}&page=${currentPage + 1}`}
                    className="btn-primary !px-4 !py-2 !text-xs"
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
