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
  }>;
}

export default async function DoctorAppointmentsPage({ searchParams }: PageProps) {
  const user = await requireDoctor();
  const resolvedParams = await searchParams;

  const todayStr = getHospitalTodayDateString();
  const dateStr = resolvedParams.date || todayStr;
  const statusFilter = resolvedParams.status || '';

  const { appointments, counts } = await getDoctorAppointments(user.doctorProfileId, {
    dateStr,
    status: statusFilter,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Doctor Appointments</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and manage patient outpatient consultations for selected dates.
        </p>
      </div>

      {/* Filter Form */}
      <form method="GET" action="/doctor/appointments" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Date Selector */}
          <div className="md:col-span-5">
            <label htmlFor="docDateInput" className="block text-xs font-semibold text-slate-700 mb-1">
              Select Date:
            </label>
            <input
              id="docDateInput"
              type="date"
              name="date"
              defaultValue={dateStr}
              className="w-full px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-5">
            <label htmlFor="docStatusFilter" className="block text-xs font-semibold text-slate-700 mb-1">
              Status Filter:
            </label>
            <select
              id="docStatusFilter"
              name="status"
              defaultValue={statusFilter}
              className="w-full px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
            >
              Filter
            </button>
          </div>
        </div>

        {(dateStr !== todayStr || statusFilter) && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing records for Date: <strong className="text-slate-800">{dateStr}</strong>
            </span>
            <Link href="/doctor/appointments" className="text-indigo-600 font-semibold hover:underline">
              Reset to Today
            </Link>
          </div>
        )}
      </form>

      {/* Daily Summary Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
        <span>Total: <strong className="text-slate-800">{counts.total}</strong></span>
        <span>Booked: <strong className="text-blue-700">{counts.booked}</strong></span>
        <span>Confirmed: <strong className="text-indigo-700">{counts.confirmed}</strong></span>
        <span>Completed: <strong className="text-emerald-700">{counts.completed}</strong></span>
        <span>Cancelled: <strong className="text-rose-700">{counts.cancelled}</strong></span>
        <span>No-Show: <strong className="text-amber-700">{counts.noShow}</strong></span>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <div className="text-4xl">📅</div>
          <h3 className="text-base font-bold text-slate-700">No Appointments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No consultations match your date and status filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-sm text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                    {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>

                <h3 className="text-base font-bold text-slate-800">{appt.patient.fullName}</h3>
                <p className="text-xs text-slate-500">
                  Phone: {appt.patient.phoneNumber} | Gender: {appt.patient.gender}
                </p>

                {appt.cancellationReason && (
                  <p className="text-[11px] text-rose-700 font-medium">
                    Reason: {appt.cancellationReason} ({appt.cancelledBy})
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <DoctorAppointmentActionButtons appointmentId={appt.id} currentStatus={appt.status} />
                <Link
                  href={`/doctor/appointments/${appt.id}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition"
                >
                  View Detail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
