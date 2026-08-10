import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPatientAppointments } from '@/features/appointments/services/manage-appointments';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';

export default async function PatientDashboardPage() {
  const user = await requirePatient();
  const { upcoming } = await getPatientAppointments(user.patientProfileId);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-card hero-mesh px-6 py-8 text-white shadow-card sm:px-8">
        <div className="absolute inset-0 pattern-dots opacity-20" aria-hidden />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-100">
              Patient Portal
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              Patient Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-brand-100">
              Welcome back. Logged in as{' '}
              <span className="font-semibold text-white">{user.email}</span>. Manage outpatient
              consultations and discover specialist doctors.
            </p>
          </div>
          <Link
            href="/patient/doctors"
            className="inline-flex items-center justify-center rounded-button bg-white px-5 py-3 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-brand-50"
          >
            Find a Doctor →
          </Link>
        </div>
      </section>

      <section className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#dde5e9] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Upcoming Appointment</h2>
            <p className="text-sm text-ink-muted">Your scheduled outpatient hospital visits.</p>
          </div>
          <Link href="/patient/appointments" className="text-xs font-semibold text-brand-700 hover:underline">
            View All Appointments →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            title="No Upcoming Appointments"
            description="You do not have any upcoming doctor consultations scheduled. Browse our doctor directory to book a slot."
            actionHref="/patient/doctors"
            actionLabel="Find a Doctor"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                dateStr={appt.dateStr}
                startTime={appt.startTime}
                endTime={appt.endTime}
                status={appt.status}
                title={appt.doctor.fullName}
                subtitle={appt.doctor.department.name}
                meta={appt.doctor.qualification}
                href={`/patient/appointments/${appt.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-between gap-4 md:col-span-1">
          <div>
            <h3 className="font-semibold text-ink">Find a Doctor</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Browse active hospital departments and book 30-min slots.
            </p>
          </div>
          <Link href="/patient/doctors" className="btn-primary w-fit">
            Browse Doctors
          </Link>
        </Card>
        <Card className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-semibold text-ink">Book Appointment</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Choose a specialist and reserve the next available consultation.
            </p>
          </div>
          <Link href="/patient/doctors" className="btn-secondary w-fit">
            Start Booking
          </Link>
        </Card>
        <Card className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-semibold text-ink">My Appointments</h3>
            <p className="mt-1 text-sm text-ink-muted">
              View completed, cancelled, and historical records.
            </p>
          </div>
          <Link href="/patient/appointments" className="btn-secondary w-fit">
            View History
          </Link>
        </Card>
      </section>
    </div>
  );
}
