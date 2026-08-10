import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPatientAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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

  const tabs = [
    { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
    { id: 'past', label: `Past / History (${past.length})` },
    { id: 'cancelled', label: `Cancelled (${cancelled.length})` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">My Appointments</h1>
        <p className="mt-2 text-base text-ink-muted">
          View your upcoming consultations, appointment history, and cancelled bookings.
        </p>
      </div>

      <div className="card-surface flex gap-2 p-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/patient/appointments?tab=${tab.id}`}
            className={cn(
              'flex-1 rounded-button py-2.5 text-center text-xs font-bold transition',
              activeTab === tab.id
                ? 'bg-brand-700 text-white shadow-soft'
                : 'text-ink-muted hover:bg-brand-50 hover:text-brand-800'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {currentList.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} appointments`}
          description={`You do not have any appointments under the "${activeTab}" category.`}
          actionHref="/patient/doctors"
          actionLabel="Book New Appointment"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paginatedList.map((appt) => (
              <Card key={appt.id} hover className="flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="rounded-pill bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      {appt.doctor.department.name}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{appt.doctor.fullName}</h3>
                  <p className="text-sm font-medium text-brand-700">{appt.doctor.qualification}</p>
                  <div className="mt-4 space-y-1 border-t border-[#dde5e9] pt-3 text-sm text-ink-muted">
                    <p>
                      <strong className="text-ink">Date:</strong> {appt.dateStr}
                    </p>
                    <p>
                      <strong className="text-ink">Time:</strong>{' '}
                      {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                    </p>
                  </div>
                  {appt.status === 'CANCELLED' && appt.cancellationReason && (
                    <div className="mt-3 rounded-button border border-rose-100 bg-rose-50 p-2.5 text-[11px] text-rose-800">
                      <strong>Reason:</strong> {appt.cancellationReason}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end border-t border-[#dde5e9] pt-4">
                  <Link
                    href={`/patient/appointments/${appt.id}`}
                    className="rounded-button border border-[#dde5e9] bg-white px-4 py-2 text-xs font-bold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    View Details →
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {currentList.length > 0 && (
            <div className="card-surface flex items-center justify-between p-4 text-xs text-ink-muted">
              <span>
                Showing Page {currentPage} of {totalPages} ({totalItems} {activeTab} appointments)
              </span>
              <div className="flex space-x-2">
                <Link
                  href={`/patient/appointments?tab=${activeTab}&page=${currentPage - 1}`}
                  className={cn(
                    'btn-secondary !py-1.5 !text-xs',
                    currentPage <= 1 && 'pointer-events-none opacity-40'
                  )}
                >
                  Previous
                </Link>
                <Link
                  href={`/patient/appointments?tab=${activeTab}&page=${currentPage + 1}`}
                  className={cn(
                    'btn-secondary !py-1.5 !text-xs',
                    currentPage >= totalPages && 'pointer-events-none opacity-40'
                  )}
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
