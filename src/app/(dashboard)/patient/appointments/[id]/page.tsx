import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getPatientAppointmentDetail } from '@/features/appointments/services/manage-appointments';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import PatientCancelButton from '@/features/appointments/components/PatientCancelButton';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PatientAppointmentDetailPage({ params }: PageProps) {
  const user = await requirePatient();
  const resolvedParams = await params;

  const appt = await getPatientAppointmentDetail(user.patientProfileId, resolvedParams.id);

  if (!appt) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        <Link href="/patient/appointments" className="hover:text-brand-700">
          ← My Appointments
        </Link>
        <span>/</span>
        <span className="text-ink">Detail</span>
      </div>

      <div className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dde5e9] pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-pill border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-700">
              Appointment Summary
            </span>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Consultation Details</h1>
            <p className="mt-0.5 text-xs text-ink-soft">ID: {appt.id}</p>
          </div>
          <StatusBadge status={appt.status} size="lg" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-3 rounded-card border border-[#dde5e9] bg-surface-muted p-5 text-sm">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">Doctor Info</h3>
            <p>
              <strong className="text-ink">Doctor:</strong> {appt.doctor.fullName}
            </p>
            <p>
              <strong className="text-ink">Specialty:</strong> {appt.doctor.qualification}
            </p>
            <p>
              <strong className="text-ink">Department:</strong> {appt.doctor.department.name}
            </p>
            <p>
              <strong className="text-ink">Contact:</strong> {appt.doctor.phoneNumber}
            </p>
          </div>

          <div className="space-y-3 rounded-card border border-[#dde5e9] bg-surface-muted p-5 text-sm">
            <h3 className="border-b border-[#dde5e9] pb-2 text-sm font-semibold text-ink">Schedule Info</h3>
            <p>
              <strong className="text-ink">Date:</strong> {appt.dateStr}
            </p>
            <p>
              <strong className="text-ink">Time Slot:</strong> {formatTimeTo12Hour(appt.startTime)} –{' '}
              {formatTimeTo12Hour(appt.endTime)}
            </p>
            <p>
              <strong className="text-ink">Booked On:</strong>{' '}
              {appt.createdAt.toISOString().split('T')[0]}
            </p>
          </div>
        </div>

        {appt.status === 'CANCELLED' && (
          <div className="space-y-1 rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <p className="font-bold">Appointment Cancelled</p>
            {appt.cancelledBy && (
              <p>
                <strong>Cancelled By:</strong> {appt.cancelledBy}
              </p>
            )}
            {appt.cancellationReason && (
              <p>
                <strong>Reason:</strong> {appt.cancellationReason}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#dde5e9] pt-4 sm:flex-row">
          <Link href="/patient/appointments" className="btn-secondary">
            ← Back to My Appointments
          </Link>
          {appt.isCancellable && <PatientCancelButton appointmentId={appt.id} />}
        </div>
      </div>
    </div>
  );
}
