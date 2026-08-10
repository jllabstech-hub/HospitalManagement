import Link from 'next/link';
import { requireDoctor } from '@/server/security/auth-helpers';
import { getDoctorAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour, getHospitalTodayDateString } from '@/lib/date-utils';
import DoctorAppointmentActionButtons from '@/features/appointments/components/DoctorAppointmentActionButtons';

interface PageProps {
  searchParams: Promise<{
    date?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function DoctorAppointmentsPage({ searchParams }: PageProps) {
  const user = await requireDoctor();
  const resolvedParams = await searchParams;

  const todayStr = getHospitalTodayDateString();
  const dateStr = resolvedParams.date || todayStr;
  const statusFilter = resolvedParams.status || '';
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const limit = Math.max(1, parseInt(resolvedParams.limit || '10', 10));

  const { appointments, counts, currentPage, totalPages, totalCount } = await getDoctorAppointments(user.doctorProfileId, {
    dateStr,
    status: statusFilter,
    page,
    limit,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Doctor Appointments
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          View and manage patient outpatient consultations for selected dates.
        </p>
      </div>

      {/* Filter Form */}
      <form method="GET" action="/doctor/appointments" className="card-surface space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Date Selector */}
          <div className="md:col-span-4">
            <label htmlFor="docDateInput" className="mb-1 block text-xs font-semibold text-ink">
              Select Date:
            </label>
            <input
              id="docDateInput"
              type="date"
              name="date"
              defaultValue={dateStr}
              className="input-field !py-2 text-xs font-medium sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-4">
            <label htmlFor="docStatusFilter" className="mb-1 block text-xs font-semibold text-ink">
              Status Filter:
            </label>
            <select
              id="docStatusFilter"
              name="status"
              defaultValue={statusFilter}
              className="input-field !py-2 text-xs font-medium sm:text-sm"
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
            <label htmlFor="docLimitFilter" className="mb-1 block text-xs font-semibold text-ink">
              Entries per page
            </label>
            <select
              id="docLimitFilter"
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

        {(dateStr !== todayStr || statusFilter) && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-ink-muted">
              Showing records for Date: <strong className="text-ink">{dateStr}</strong>
            </span>
            <Link href="/doctor/appointments" className="font-semibold text-brand-700 hover:underline">
              Reset to Today
            </Link>
          </div>
        )}
      </form>

      {/* Daily Summary Bar */}
      <div className="card-surface flex flex-wrap gap-4 p-4 text-xs font-semibold text-ink-muted">
        <span>
          Total: <strong className="text-ink">{counts.total}</strong>
        </span>
        <span>
          Booked: <strong className="text-brand-700">{counts.booked}</strong>
        </span>
        <span>
          Confirmed: <strong className="text-brand-800">{counts.confirmed}</strong>
        </span>
        <span>
          Completed: <strong className="text-accent-700">{counts.completed}</strong>
        </span>
        <span>
          Cancelled: <strong className="text-rose-700">{counts.cancelled}</strong>
        </span>
        <span>
          No-Show: <strong className="text-amber-700">{counts.noShow}</strong>
        </span>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="space-y-2 rounded-card border border-dashed border-[#c9d5db] bg-surface-muted p-12 text-center">
          <h3 className="text-base font-semibold text-ink">No Appointments Found</h3>
          <p className="mx-auto max-w-sm text-xs text-ink-muted">
            No consultations match your date and status filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="card-surface flex flex-col justify-between gap-4 p-6 transition hover:border-brand-200 md:flex-row md:items-center"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="rounded-button border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-bold text-brand-800">
                    {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>

                <h3 className="text-base font-semibold text-ink">{appt.patient.fullName}</h3>
                <p className="text-xs text-ink-muted">
                  Phone: {appt.patient.phoneNumber} | Gender: {appt.patient.gender}
                </p>

                {appt.cancellationReason && (
                  <p className="text-[11px] font-medium text-rose-700">
                    Reason: {appt.cancellationReason} ({appt.cancelledBy})
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <DoctorAppointmentActionButtons appointmentId={appt.id} currentStatus={appt.status} />
                <Link
                  href={`/doctor/appointments/${appt.id}`}
                  className="btn-secondary !px-4 !py-2 !text-xs"
                >
                  View Detail →
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {appointments.length > 0 && (
            <div className="card-surface flex items-center justify-between p-4 text-xs text-ink-muted">
              <span>
                Showing Page {currentPage} of {totalPages} ({totalCount} matching appointments)
              </span>
              <div className="flex space-x-2">
                <Link
                  href={`/doctor/appointments?date=${dateStr}${statusFilter ? `&status=${statusFilter}` : ''}&limit=${limit}&page=${currentPage - 1}`}
                  className={`btn-secondary !px-3 !py-1.5 !text-xs ${
                    currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/doctor/appointments?date=${dateStr}${statusFilter ? `&status=${statusFilter}` : ''}&limit=${limit}&page=${currentPage + 1}`}
                  className={`btn-secondary !px-3 !py-1.5 !text-xs ${
                    currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
