import Link from 'next/link';
import { requireDoctor } from '@/server/security/auth-helpers';
import { getDoctorAppointments } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour, getHospitalTodayDateString } from '@/lib/date-utils';
import DoctorAppointmentActionButtons from '@/features/appointments/components/DoctorAppointmentActionButtons';
import EmptyState from '@/components/ui/EmptyState';

export default async function DoctorDashboardPage() {
  const user = await requireDoctor();
  const todayStr = getHospitalTodayDateString();

  const { appointments, counts } = await getDoctorAppointments(user.doctorProfileId, {
    dateStr: todayStr,
  });

  const stats = [
    { label: 'Today Total', value: counts.total, className: 'bg-white' },
    { label: 'Booked', value: counts.booked, className: 'bg-brand-50 border-brand-200' },
    { label: 'Confirmed', value: counts.confirmed, className: 'bg-brand-50/70 border-brand-200' },
    { label: 'Completed', value: counts.completed, className: 'bg-accent-50 border-accent-200' },
    { label: 'No Show', value: counts.noShow, className: 'bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="space-y-8">
      <section className="portal-hero px-6 py-8 sm:px-8">
        <div className="absolute inset-0 portal-grid opacity-20" aria-hidden />
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[28px] border-brand-400/20" aria-hidden />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-100">
              Doctor Portal
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Your clinical day, in focus.</h1>
            <p className="mt-2 max-w-xl text-sm text-brand-100">
              Logged in as <span className="font-semibold text-white">{user.email}</span>. Manage
              today&apos;s outpatient appointments and consultation schedules.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/doctor/appointments" className="btn-primary !bg-brand-600 hover:!bg-brand-500">
              Appointment Directory
            </Link>
            <Link
              href="/doctor/availability"
              className="inline-flex items-center rounded-button border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Availability
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className={`metric-card text-center ${stat.className}`}>
            <span className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              {stat.label}
            </span>
            <span className="mt-1 block text-2xl font-bold text-ink">{stat.value}</span>
          </div>
        ))}
      </div>

      <section className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[#dde5e9] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Today&apos;s Appointments ({todayStr})</h2>
            <p className="text-sm text-ink-muted">Outpatient patient queue sorted chronologically.</p>
          </div>
          <Link href="/doctor/appointments" className="text-xs font-semibold text-brand-700 hover:underline">
            View All Dates →
          </Link>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            title="No Appointments Today"
            description="You have no scheduled outpatient consultations for today."
          />
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex flex-col justify-between gap-4 rounded-card border border-[#dde5e9] bg-surface-muted p-5 transition hover:border-brand-200 hover:shadow-soft md:flex-row md:items-center">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                    {appt.patient.fullName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-button border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-800">
                      {formatTimeTo12Hour(appt.startTime)} – {formatTimeTo12Hour(appt.endTime)}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-ink">{appt.patient.fullName}</h3>
                  <p className="text-xs text-ink-muted">
                    Contact: {appt.patient.phoneNumber} | Gender: {appt.patient.gender}
                  </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <DoctorAppointmentActionButtons
                    appointmentId={appt.id}
                    currentStatus={appt.status}
                  />
                  <Link
                    href={`/doctor/appointments/${appt.id}`}
                    className="rounded-button border border-[#dde5e9] bg-white px-3.5 py-2 text-xs font-bold text-ink transition hover:bg-brand-50"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
