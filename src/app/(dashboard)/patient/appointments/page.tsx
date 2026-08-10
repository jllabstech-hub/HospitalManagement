import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPatientAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

export default async function PatientAppointmentsPage({ searchParams }: PageProps) {
  const user = await requirePatient();
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || 'upcoming';
  const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const limit = 6;

  const { upcoming, past, cancelled } = await getPatientAppointments(user.patientProfileId);

  let currentList = upcoming;
  if (activeTab === 'past') currentList = past;
  if (activeTab === 'cancelled') currentList = cancelled;

  const totalItems = currentList.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (currentPage - 1) * limit;
  const paginatedList = currentList.slice(startIndex, startIndex + limit);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">My Appointments</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your upcoming consultations, appointment history, and cancelled bookings.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex space-x-2">
        <Link
          href="/patient/appointments?tab=upcoming"
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Upcoming ({upcoming.length})
        </Link>
        <Link
          href="/patient/appointments?tab=past"
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'past'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Past / History ({past.length})
        </Link>
        <Link
          href="/patient/appointments?tab=cancelled"
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'cancelled'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cancelled ({cancelled.length})
        </Link>
      </div>

      {/* Appointments Grid */}
      {currentList.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="text-4xl">📅</div>
          <h3 className="text-base font-bold text-slate-700">No {activeTab} appointments</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any appointments under the &quot;{activeTab}&quot; category.
          </p>
          <div className="pt-2">
            <Link
              href="/patient/doctors"
              className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Book New Appointment
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedList.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {appt.doctor.department.name}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-800">{appt.doctor.fullName}</h3>
                  <p className="text-xs text-blue-600 font-medium">{appt.doctor.qualification}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <p><strong className="text-slate-700">Date:</strong> {appt.dateStr}</p>
                    <p>
                      <strong className="text-slate-700">Time:</strong> {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                    </p>
                  </div>

                  {appt.status === 'CANCELLED' && appt.cancellationReason && (
                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800">
                      <strong>Reason:</strong> {appt.cancellationReason}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <Link
                    href={`/patient/appointments/${appt.id}`}
                    className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 font-bold text-xs rounded-xl transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Bar */}
          {currentList.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs text-slate-500 shadow-xs">
              <span>
                Showing Page {currentPage} of {totalPages} ({totalItems} {activeTab} appointments)
              </span>
              <div className="flex space-x-2">
                <Link
                  href={`/patient/appointments?tab=${activeTab}&page=${currentPage - 1}`}
                  className={`px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 transition ${
                    currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/patient/appointments?tab=${activeTab}&page=${currentPage + 1}`}
                  className={`px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 transition ${
                    currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
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
